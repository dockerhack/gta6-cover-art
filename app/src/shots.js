// Vice City Cover Studio — screenshot script (Node, standard library plus
// playwright-core for the browser). Serves app/ on localhost, opens it in
// headless Chromium, and saves the three screenshots to screenshots/:
//
//   1-cover.jpg  the One Night cover, After Dark grade, 1280 x 720
//   2-editor.jpg the editor at work, export controls visible, 1280 x 1000
//   3-cover.jpg  the six-panel Mosaic cover, Neon Mono grade, 1080 x 1080
//
// Run from the repository root with:
//   node app/src/shots.js
//
// playwright-core is resolved from the local node_modules first, then from
// PLAYWRIGHT_CORE_PATH. Chromium comes from CHROME_PATH, else the system
// Chrome at /opt/meta-chromium/chrome.

const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize, sep, dirname } = require('node:path');

const repoDir = join(__dirname, '..', '..');
const appDir = join(repoDir, 'app');
const shotsDir = join(repoDir, 'screenshots');

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  ({ chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || '/tmp/shot-tool/node_modules/playwright-core'));
}

const CHROME = process.env.CHROME_PATH || '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8',
};

function serveApp() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/') rel = '/index.html';
      const file = normalize(join(appDir, rel));
      if (!file.startsWith(appDir + sep)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function main() {
  const { server, port } = await serveApp();
  const base = 'http://127.0.0.1:' + port + '/index.html';
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const problems = [];
  try {
    // --- Shot 1: the One Night cover, After Dark, landscape. ---
    const page1 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page1.on('console', (m) => { if (m.type() === 'error') problems.push('shot1 console: ' + m.text()); });
    page1.on('pageerror', (e) => problems.push('shot1 pageerror: ' + e.message));
    page1.on('request', (r) => {
      if (!r.url().startsWith('http://127.0.0.1')) problems.push('shot1 external request: ' + r.url());
    });
    await page1.goto(base + '?present=1', { waitUntil: 'load' });
    await page1.evaluate(() => window.coverApp.ready);
    await page1.evaluate(() => window.coverApp.present('oneNight', 'afterDark', 1920, 1080));
    await page1.waitForTimeout(400);
    await page1.locator('#coverCanvas').screenshot({ path: join(shotsDir, '1-cover.jpg'), type: 'jpeg', quality: 88 });
    const tag1 = await page1.evaluate(() => window.VCCover.taglineFor(window.coverApp.state));
    console.log('1-cover.jpg tagline: ' + tag1);
    await page1.close();

    // --- Shot 2: the editor at work, export controls visible. ---
    const page2 = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page2.on('console', (m) => { if (m.type() === 'error') problems.push('shot2 console: ' + m.text()); });
    page2.on('pageerror', (e) => problems.push('shot2 pageerror: ' + e.message));
    page2.on('request', (r) => {
      if (!r.url().startsWith('http://127.0.0.1')) problems.push('shot2 external request: ' + r.url());
    });
    await page2.goto(base, { waitUntil: 'load' });
    await page2.evaluate(() => window.coverApp.ready);
    await page2.evaluate(() => {
      document.getElementById('exportAll').scrollIntoView({ block: 'center' });
    });
    await page2.waitForTimeout(400);
    const btnBox = await page2.locator('#exportAll').boundingBox();
    console.log('exportAll button box in viewport: ' + JSON.stringify(btnBox));
    if (!btnBox || btnBox.y < 0 || btnBox.y + btnBox.height > 1000) {
      problems.push('shot2: Export all 3 sizes button not fully inside the 1280x1000 viewport');
    }
    await page2.screenshot({ path: join(shotsDir, '2-editor.jpg'), type: 'jpeg', quality: 88 });
    await page2.close();

    // --- Shot 3: the Mosaic cover, Neon Mono, square. ---
    const page3 = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
    page3.on('console', (m) => { if (m.type() === 'error') problems.push('shot3 console: ' + m.text()); });
    page3.on('pageerror', (e) => problems.push('shot3 pageerror: ' + e.message));
    page3.on('request', (r) => {
      if (!r.url().startsWith('http://127.0.0.1')) problems.push('shot3 external request: ' + r.url());
    });
    await page3.goto(base + '?present=1', { waitUntil: 'load' });
    await page3.evaluate(() => window.coverApp.ready);
    await page3.evaluate(() => window.coverApp.present('mosaic', 'neonMono', 1080, 1080));
    await page3.waitForTimeout(400);
    await page3.locator('#coverCanvas').screenshot({ path: join(shotsDir, '3-cover.jpg'), type: 'jpeg', quality: 88 });
    const tag3 = await page3.evaluate(() => window.VCCover.taglineFor(window.coverApp.state));
    console.log('3-cover.jpg tagline: ' + tag3);
    if (tag3 !== 'SIX SCENES · ONE NIGHT · NO SLEEP') {
      problems.push('shot3: tagline is not SIX SCENES: ' + tag3);
    }
    await page3.close();
  } finally {
    await browser.close();
    server.close();
  }

  if (problems.length > 0) {
    console.error('PROBLEMS:');
    problems.forEach((p) => console.error(' - ' + p));
    process.exitCode = 1;
  } else {
    console.log('All three screenshots saved to ' + shotsDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
