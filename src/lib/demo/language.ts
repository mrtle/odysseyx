/**
 * Can the offline demo coach read this text? Its heuristics are English
 * word lists, so Spanish, French, Japanese… would be scored as if nothing
 * were there and get confident, wrong feedback. The routes ask this first
 * in demo mode and return DEMO_ENGLISH_ONLY instead of scoring.
 *
 * The check is deliberately lenient: short text, mixed text and English
 * that happens to use foreign names ("Rafael de la Vega") all pass. Only
 * text that is clearly in another language is refused:
 *  - mostly non-Latin letters (Japanese, Chinese, Russian, Greek, Arabic…);
 *  - Latin script where foreign function words ("que", "une", "und",
 *    "het"…) clearly outnumber English ones ("the", "and", "was"…);
 *  - longer Latin-script text with almost no English function words at
 *    all, or with many accented letters and few English words (Indonesian,
 *    Vietnamese, Turkish, Polish…).
 * Pure and dependency-free, so it is safe to import anywhere.
 */

/** Shown instead of feedback when the offline coach can't read the learner's text. */
export const DEMO_ENGLISH_ONLY =
  "The offline demo coach only reads English, so it can't score this fairly. Write it in English, or add an ANTHROPIC_API_KEY on the server for full coaching in any language.";

/** Only this much of a long text is examined; the verdict never needs more. */
const SAMPLE_CHARS = 20_000;
/** Fewer letters than this: nothing to judge. */
const MIN_LETTERS = 4;
/** Fewer Latin-script words (or distinct words) than this: too little to tell, so accept. */
const MIN_WORDS = 6;

/**
 * Frequent English function words. Words that are just as common in other
 * languages ("a", "no", "me", "in", "was", "will") still count here: they
 * make short English lines readable, and foreign text carries far more of
 * its own function words than it borrows from this list.
 */
const ENGLISH = new Set(
  (
    "the a an and or but if then than so because as of to in on at by for from with without into onto over under about " +
    "after before between through during against across around behind beyond near off out up down upon within toward towards " +
    "i me my mine myself you your yours yourself he him his himself she her hers herself it its itself we us our ours " +
    "they them their theirs themselves this that these those who whom whose which what where when why how " +
    "is am are was were be been being have has had having do does did done will would shall should can could may might must " +
    "not no nor never always just only also very too again still even ever yet here there now all any each every some such " +
    "both either neither other another more most much many few less least own same one ones once while until since though " +
    "although unless whether upon onto via like"
  ).split(" "),
);

/**
 * Function words of other languages, accents removed: Spanish, French,
 * Portuguese, Italian, German and Dutch, plus a few from Indonesian,
 * Turkish, Polish, Vietnamese, Tagalog, Finnish, Hungarian, Czech, Romanian
 * and Swahili. Words that are also English are left out ("die", "son",
 * "pour", "war", "will", "van", "plus", "sin", "come", "fur", "um", "hay",
 * "era", "non", "dove", "fare"…), and so are common names ("al", "dan",
 * "ella", "ada", "han").
 */
const FOREIGN = new Set(
  (
    // Spanish
    "el la los las del de que y en un una unos unas por para con es su sus se lo como mas pero porque cuando muy sobre " +
    "tambien hasta donde quien desde todo toda todos nos esta este estos estas ese esa eso esto ellos ellas entre " +
    "fue estaba tiene tenia debe puede hacer tu mi yo usted aunque sino algo nada nunca siempre despues antes ahora " +
    // French
    "le les des du une et est dans qui pour ne pas sur au aux avec il elle ils elles nous vous je ce cette ces mais ou " +
    "sont ont comme leur leurs sa ses mes tes moi toi lui fait etait avait etre ete tres bien sans chez quand doit peut " +
    "tout tous toute aussi alors donc parce jamais rien " +
    // Portuguese
    "nao uma os ao aos das nas pelo pela pelos pelas seu sua seus suas mais muito quando ele ela eles elas dele dela deles " +
    "foi tem sao isso isto essa esse ja voce meu minha num numa lhe sem mesmo ainda tudo quem onde entao " +
    // Italian
    "il di che della delle dei degli gli sono anche questo questa quello molto suo loro nel nella alla dal dalla sul " +
    "piu tutto essere stato ci si io lei noi voi mio perche cosa ogni senza ancora poi gia " +
    // German
    "der und das ist nicht mit sich auf von zu dem ein eine einen einem einer sie ich wir ihr ihre ihrer auch als wie " +
    "noch nach bei aus oder aber wenn dass sein wird werden kann muss nur schon doch zwischen gegen durch ohne dann sehr " +
    "mehr hier jetzt immer keine kein diese dieser habe haben wurde " +
    // Dutch
    "het een niet zijn voor hij maar dat wat ook naar bij uit nog wel geen worden wordt werd haar ze zij hun deze dit te " +
    "zou moet heeft hebben veel meer " +
    // Indonesian / Malay, Turkish, Polish, Vietnamese, Tagalog
    "yang dengan untuk tidak dari dalam akan pada juga saya karena bisa sudah mereka kita atau seorang harus " +
    "ve bir bu icin ile cok gibi daha olan ama kadar sonra degil " +
    "nie sie ze jest jak tak jej jego przez dla czy juz " +
    "va cua khong mot nhung cac duoc nguoi trong voi cung khi " +
    "ang ng sa mga ay niya ako ito kanyang " +
    // Finnish, Hungarian, Czech, Romanian, Swahili
    "ei oli etta mutta kun niin joka ovat myos hogy nem egy az csak jsem jako jeho jsou byl nu este pentru fost cu pe " +
    "wa kwa ni za katika kuwa hii lakini"
  ).split(" "),
);

/** English contractions: "don't", "it's", "you're", "i've", "we'll", "she'd", "i'm". */
const ENGLISH_CONTRACTION = /^[a-z]+'(?:s|t|re|ve|ll|d|m)$/;
/** French / Italian elision: "l'homme", "d'un", "qu'il", "c'est", "j'ai", "dell'anno", "un'altra". */
const FOREIGN_ELISION = /^(?:l|d|j|qu|c|n|s|m|t|jusqu|lorsqu|puisqu|dell|all|nell|sull|dall|un|quest)'[a-z]/;

const LETTER = /\p{L}/gu;
const LATIN_LETTER = /\p{Script=Latin}/gu;
const LATIN_WORD = /[\p{Script=Latin}\p{M}]+(?:['’][\p{Script=Latin}\p{M}]+)*/gu;
/** Latin letters with diacritics (Latin-1 Supplement to Latin Extended-B, and Latin Extended Additional). */
const ACCENTED = /[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u1E00-\u1EFF]/gu;

function count(text: string, pattern: RegExp): number {
  pattern.lastIndex = 0;
  let n = 0;
  while (pattern.exec(text)) n++;
  return n;
}

/** Accent-free lower case: "Déjà" → "deja", "Straße" → "strasse". */
function fold(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/’/g, "'");
}

/** True when the offline (English-only) demo coach can give this text fair feedback. */
export function demoCanRead(text: string): boolean {
  const sample = text.length > SAMPLE_CHARS ? text.slice(0, SAMPLE_CHARS) : text;
  const letters = count(sample, LETTER);
  if (letters < MIN_LETTERS) return true;
  // Scripts other than Latin: the word lists can't match anything.
  const latin = count(sample, LATIN_LETTER);
  if (latin / letters < 0.5) return false;

  const tokens = (sample.match(LATIN_WORD) ?? []).map(fold);
  const n = tokens.length;
  // Too few words, or the same few repeated ("Hi. Hi. Hi."): nothing to tell a language by.
  if (n < MIN_WORDS || new Set(tokens).size < MIN_WORDS) return true;

  let english = 0;
  let foreign = 0;
  for (const token of tokens) {
    if (ENGLISH.has(token) || ENGLISH_CONTRACTION.test(token)) english++;
    else if (FOREIGN.has(token) || FOREIGN_ELISION.test(token)) foreign++;
  }
  // Another European language: its function words clearly outnumber English ones.
  if (foreign >= 3 && foreign / n >= 0.15 && foreign > 1.5 * english) return false;
  // Long enough to be sure, yet almost none of the words any English sentence needs.
  if (n >= 30 && english / n < 0.05) return false;
  // Heavily accented Latin script with little English (Vietnamese, Polish, Turkish…).
  if (n >= 8 && count(sample, ACCENTED) / latin >= 0.08 && english / n < 0.12) return false;
  return true;
}
