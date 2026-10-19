// usage: node render.mjs stills 1.5 4.2 ...   |   node render.mjs frames
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

const [mode, ...times] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(new URL("index.html", import.meta.url).pathname).href, { waitUntil: "load" });
await page.evaluate(() => window.ready);
const stage = await page.$("#stage");

const shot = async (t, path) => {
  await page.evaluate((t) => window.renderAt(t), t);
  await stage.screenshot(path.endsWith(".png") ? { path } : { path, type: "jpeg", quality: 95 });
};

if (mode === "stills") {
  mkdirSync("stills", { recursive: true });
  for (const t of times) await shot(+t, `stills/t${(+t).toFixed(2)}.png`);
} else {
  mkdirSync("frames", { recursive: true });
  const fps = 30, n = Math.round((await page.evaluate(() => window.DUR)) * fps);
  for (let i = 0; i < n; i++) {
    await shot(i / fps, `frames/f${String(i).padStart(4, "0")}.jpg`);
    if (i % 60 === 0) console.log(`frame ${i}/${n}`);
  }
}
await browser.close();
