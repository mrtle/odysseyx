import { describe, expect, it } from "vitest";
import { SAMPLE_LOGLINES, SAMPLE_SCENES, SAMPLE_STORIES } from "@/components/lab/samples";
import { SCENARIOS } from "@/content/scenarios";
import { DAILY_PROMPTS } from "@/content/daily-prompts";
import * as tracks from "@/content/tracks";
import { DEMO_ENGLISH_ONLY, demoCanRead } from "./language";

/** Clearly not English: the offline coach must refuse rather than score these. */
const FOREIGN: [string, string][] = [
  // The reported cases.
  ["Spanish logline (evidence)", "Cuando una capitana de ferry deshonrada descubre que su tripulación trafica refugiados, debe elegir entre su carrera y la verdad."],
  ["Spanish elevator pitch", "Es la historia de una baterista sorda que pierde su audífono la noche antes de la audición de su vida, y tiene que tocar sin oír nada."],
  ["Japanese story", "雨の夜、年老いた漁師は港で古い手紙を見つけた。それは四十年前に亡くなった妻からのものだった。彼は震える手で封を切った。"],
  ["Japanese studio pitch", "これは、耳の聞こえないドラマーが人生最大のオーディションの前夜に補聴器を失くす物語です。"],
  // Held-out languages and registers.
  ["French logline", "Quand une capitaine de ferry déshonorée découvre que son équipage fait passer des réfugiés, elle doit choisir entre sa carrière et la vérité."],
  ["French prose with elisions", "C'est l'histoire d'un homme qui n'a jamais quitté son village. Un jour, il reçoit une lettre qu'il n'ose pas ouvrir."],
  ["German logline", "Als eine in Ungnade gefallene Fährkapitänin entdeckt, dass ihre Crew Flüchtlinge schmuggelt, muss sie sich zwischen ihrer Karriere und der Wahrheit entscheiden."],
  ["Portuguese", "Quando uma jovem pescadora encontra um mapa antigo no barco do avô, ela precisa decidir se conta para a família ou parte sozinha."],
  ["Italian", "Quando un vecchio pescatore trova una lettera della moglie morta, decide di attraversare il mare per consegnarla alla sorella che non vede da anni."],
  ["Dutch", "Wanneer een oude visser een brief van zijn overleden vrouw vindt, moet hij beslissen of hij de zee oversteekt om haar zus te zoeken."],
  ["Indonesian", "Seorang nelayan tua menemukan surat dari istrinya yang sudah meninggal dan dia harus memutuskan apakah akan menyeberangi laut untuk mencari adiknya yang tinggal di pulau lain bersama keluarga mereka."],
  ["Vietnamese", "Một ông lão đánh cá tìm thấy lá thư của người vợ đã mất và phải quyết định có nên vượt biển để tìm em gái của bà hay không."],
  ["Turkish", "Yaşlı bir balıkçı ölen karısından kalan bir mektup bulur ve kız kardeşini bulmak için denizi geçip geçmemeye karar vermek zorundadır."],
  ["Polish", "Stary rybak znajduje list od zmarłej żony i musi zdecydować, czy przepłynąć morze, żeby odnaleźć jej siostrę, której nie widział od lat."],
  ["Russian", "Старый рыбак находит письмо от покойной жены и должен решить, переплыть ли море, чтобы найти её сестру."],
  ["Greek", "Ένας γέρος ψαράς βρίσκει ένα γράμμα από τη νεκρή γυναίκα του και πρέπει να αποφασίσει αν θα διασχίσει τη θάλασσα."],
  ["Chinese", "一位老渔夫发现了亡妻留下的一封信，他必须决定是否要渡海去寻找她的妹妹。"],
  ["Korean", "늙은 어부는 죽은 아내가 남긴 편지를 발견하고 바다를 건너 그녀의 여동생을 찾을지 결정해야 한다."],
  ["Arabic", "يجد صياد عجوز رسالة من زوجته الراحلة ويجب أن يقرر ما إذا كان سيعبر البحر للعثور على أختها."],
  ["Hindi", "एक बूढ़ा मछुआरा अपनी दिवंगत पत्नी का एक पत्र पाता है और उसे तय करना होता है कि क्या वह समुद्र पार करेगा।"],
  ["Short Japanese daily", "売ります。赤ちゃんの靴、未使用。"],
  ["Short Russian daily", "Продаются детские ботинки, неношеные."],
];

/** English, including hard cases: must be scored normally. */
const ENGLISH: [string, string][] = [
  ["six-word story", "Baby shoes for sale — never worn."],
  ["accents and loanwords", "Baby shoes for sale — never worn. Café, déjà vu."],
  ["Spanish names in an English logline", "Rafael de la Vega, a disgraced matador, must win back the love of Ana del Río before the Feria de San Juan ends."],
  ["accented names", "Zoë Łukasiewicz and Björn Ångström meet in Malmö to plan the heist of the century."],
  ["terse screenplay", "INT. DINER - NIGHT. Rain on glass. MARA (30s) slides into the booth. JOE doesn't look up. MARA: Coffee. Black. JOE: Rough night? MARA: Rough year."],
  ["shot list shorthand", "WIDE: the docks at dawn. CU: her hands on the letter. OTS: Joe watching from the car. INSERT: the ring."],
  ["hesitant spoken pitch", "Um, so, basically it's like, uh, a heist movie but the crew are all grandmothers and, um, they rob the bank that took their homes."],
  ["one English line with a Spanish quote", "When Lucía finally says “no me dejes” at the station, her brother pretends not to hear and boards the train anyway."],
  ["bilingual draft, half and half", "My grandmother never said she loved us. Ella decía: «come, que se enfría». She fed us instead, every Sunday, until the day she couldn't."],
  ["too short to tell", "Hola, amigo."],
  ["the same word repeated (nothing to tell a language by)", "Hi. ".repeat(2000)],
  ["one foreign word repeated", "hola hola hola hola hola hola hola hola hola hola"],
  ["numbers and emoji only", "🎬🎬🎬 3, 2, 1 — action!"],
];

describe("demoCanRead", () => {
  it.each(FOREIGN)("refuses %s", (_, text) => {
    expect(demoCanRead(text)).toBe(false);
  });

  it.each(ENGLISH)("reads %s", (_, text) => {
    expect(demoCanRead(text)).toBe(true);
  });

  it("reads every English sample, scenario, prompt and lesson in the app", () => {
    const texts: string[] = [
      ...SAMPLE_STORIES.map((s) => s.text),
      ...SAMPLE_LOGLINES.map((s) => s.logline),
      ...SAMPLE_SCENES.flatMap((s) => [s.scene, s.intent ?? "", s.userShots ?? ""]),
      ...SCENARIOS.flatMap((s) => [s.openingLine, JSON.stringify(s)]),
      ...DAILY_PROMPTS.map((p) => JSON.stringify(p)),
    ];
    const walk = (v: unknown): void => {
      if (typeof v === "string") {
        if (v.length > 40) texts.push(v);
      } else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.values(v).forEach(walk);
    };
    walk(tracks);
    expect(texts.length).toBeGreaterThan(1000);
    expect(texts.filter((t) => t && !demoCanRead(t)).map((t) => t.slice(0, 80))).toEqual([]);
  });

  it("judges long text from a bounded sample, fast", () => {
    const english = SAMPLE_STORIES[0].text;
    const long = english.repeat(Math.ceil(80_000 / english.length));
    const start = performance.now();
    expect(demoCanRead(long)).toBe(true);
    expect(demoCanRead(FOREIGN[0][1].repeat(400))).toBe(false);
    expect(demoCanRead(". ".repeat(15_000))).toBe(true);
    expect(performance.now() - start).toBeLessThan(200);
  });

  it("explains itself in the message", () => {
    expect(DEMO_ENGLISH_ONLY).toMatch(/only reads English/);
    expect(DEMO_ENGLISH_ONLY).toMatch(/ANTHROPIC_API_KEY/);
  });
});
