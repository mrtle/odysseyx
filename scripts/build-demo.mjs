/**
 * Builds the static click-through demo and inlines it into one HTML file,
 * .demo-dist/odysseusx.html, that runs anywhere with no server: the API
 * routes run in the page on the offline demo coach.
 *
 * Two files come out of one run:
 *  - odysseusx.html: a page body (no <html>/<head>/<body> tags) for hosts
 *    that wrap it in their own document, such as claude.ai Artifacts
 *  - odysseusx-standalone.html: a full HTML document to open locally
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(root, ".demo-dist");

await build({ configFile: join(root, "demo/vite.config.mts"), logLevel: "warn" });

const assets = await readdir(join(outDir, "assets"));
const js = assets.filter((f) => f.endsWith(".js"));
const css = assets.filter((f) => f.endsWith(".css"));
if (js.length !== 1) throw new Error(`Expected one JS bundle, found: ${js.join(", ") || "none"}`);

const script = (await readFile(join(outDir, "assets", js[0]), "utf8")).replaceAll("</script", "<\\/script");
const styles = (await Promise.all(css.map((f) => readFile(join(outDir, "assets", f), "utf8")))).join("\n").replaceAll("</style", "<\\/style");

const body = `<title>OdysseusX</title>
<style>
${styles}
/* Host wrappers may set a smaller body font; the app is designed at 16px. */
html, body { font-size: 16px; }
</style>
<div id="odysseusx-root"></div>
<script type="module">
${script}
</script>
`;

const standalone = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n</head>\n<body>\n${body}</body>\n</html>\n`;

for (const [name, content] of [
  ["odysseusx.html", body],
  ["odysseusx-standalone.html", standalone],
]) {
  const file = join(outDir, name);
  await writeFile(file, content);
  console.log(`Wrote ${file} (${(Buffer.byteLength(content) / 1024 / 1024).toFixed(2)} MB)`);
}
