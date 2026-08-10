const fs = require('fs');
const http = require('http');
const path = require('path');
const { test, expect } = require('@playwright/test');

const APP_ROOT = path.resolve(__dirname, '..', '..');
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function versionedWorker(version) {
  const source = fs.readFileSync(path.join(APP_ROOT, 'sw.js'), 'utf8')
    .replace(/var CACHE = 'regex-trainer-[^']+';/, `var CACHE = 'regex-trainer-update-${version}';`);
  return `${source}\nself.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'GET_VERSION' && event.ports && event.ports[0]) {
      event.ports[0].postMessage('${version}');
    }
  });\n`;
}

async function startVersionServer() {
  let version = 'a';
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/sw.js') {
      response.writeHead(200, {
        'Content-Type': MIME['.js'],
        'Cache-Control': 'no-store',
        'Service-Worker-Allowed': '/'
      });
      response.end(versionedWorker(version));
      return;
    }

    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filename = path.resolve(APP_ROOT, relative);
    if (filename !== APP_ROOT && !filename.startsWith(APP_ROOT + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    fs.readFile(filename, (error, contents) => {
      if (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
        return;
      }
      response.writeHead(200, {
        'Content-Type': MIME[path.extname(filename)] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      response.end(contents);
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return {
    origin: `http://127.0.0.1:${address.port}`,
    setVersion(next) { version = next; },
    close() { return new Promise(resolve => server.close(resolve)); }
  };
}

async function workerVersion(page, state) {
  return page.evaluate(async requestedState => {
    const registration = await navigator.serviceWorker.getRegistration();
    const worker = requestedState === 'waiting' ? registration.waiting : navigator.serviceWorker.controller;
    if (!worker) return null;
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => reject(new Error('Keine Versionsantwort vom Service Worker')), 2_000);
      channel.port1.onmessage = event => {
        clearTimeout(timer);
        resolve(event.data);
      };
      worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
    });
  }, state);
}

test('PWA-Update kann vertagt und später geladen werden, ohne fremde Caches zu löschen', async ({ browser }) => {
  test.setTimeout(30_000);
  const fixture = await startVersionServer();
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();

  try {
    await page.goto(fixture.origin + '/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await expect.poll(() => workerVersion(page, 'controller')).toBe('a');

    await page.evaluate(async () => {
      const cache = await caches.open('fremde-anwendung-cache');
      await cache.put('/fremde-marke', new Response('behalten'));
    });

    fixture.setVersion('b');
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration.update();
    });
    const update = page.locator('.update-toast');
    await expect(update).toContainText('Eine neue Version ist bereit.');
    await expect.poll(() => workerVersion(page, 'waiting')).toBe('b');
    await expect.poll(() => workerVersion(page, 'controller')).toBe('a');

    await update.getByRole('button', { name: 'Später' }).click();
    await expect(update).toHaveCount(0);
    await expect.poll(() => workerVersion(page, 'controller')).toBe('a');
    await expect.poll(() => workerVersion(page, 'waiting')).toBe('b');

    await page.reload();
    await expect(page.locator('.update-toast')).toContainText('Eine neue Version ist bereit.');
    await expect.poll(() => workerVersion(page, 'controller')).toBe('a');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.locator('.update-toast').getByRole('button', { name: 'Neu laden' }).click()
    ]);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await expect.poll(() => workerVersion(page, 'controller')).toBe('b');
    await expect(page.getByRole('heading', { name: 'Lernpfad', exact: true })).toBeVisible();

    const cachesAfter = await page.evaluate(async () => {
      const keys = await caches.keys();
      const foreign = await caches.open('fremde-anwendung-cache');
      const marker = await foreign.match('/fremde-marke');
      return { keys, marker: marker && await marker.text() };
    });
    expect(cachesAfter.marker).toBe('behalten');
    expect(cachesAfter.keys).toContain('fremde-anwendung-cache');
    expect(cachesAfter.keys).toContain('regex-trainer-update-b');
    expect(cachesAfter.keys).not.toContain('regex-trainer-update-a');
  } finally {
    await context.close();
    await fixture.close();
  }
});
