import { test, expect } from '@playwright/test';

async function launch(page, base, mode = 'embedded', extra = '') {
  await page.goto(`${base}/player.html?mode=${mode}${extra}`);
  await expect.poll(() => page.evaluate(() => typeof document.querySelector('#launch').onclick)).toBe('function');
  let content;
  if (mode === 'popup') {
    const opened = page.waitForEvent('popup'); await page.locator('#launch').click(); content = await opened;
  } else {
    await expect.poll(() => page.frames().some(f => f.url().includes('/pages/start.html'))).toBe(true);
    content = page.frames().find(f => f.url().includes('/pages/start.html'));
  }
  return content;
}
const trace = page => page.evaluate(() => ({ calls, lessonStatus, activeSession }));

for (const protocol of ['http', 'https']) for (const mode of ['embedded', 'popup']) {
  test(`${protocol} ${mode}: modules, dynamic import, JSON, textured GLB/GLTF and finish`, async ({ page, context }, testInfo) => {
    const base = `${protocol}://127.0.0.1:${protocol === 'http' ? 4181 : 4182}`;
    const urls = [], failures = [], errors = [];
    context.on('request', request => urls.push(request.url()));
    context.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
    context.on('page', p => p.on('pageerror', error => errors.push(error.message)));
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
    const content = await launch(page, base, mode);
    await expect(content.locator('#scorm-session')).toHaveAttribute('data-state', 'active');
    await expect(content.locator('#render-status')).toHaveAttribute('data-ready', 'true');
    await expect(content.locator('#lesson')).toContainText('Beide Modelle');
    for (const path of ['/modules/lesson.js', '/assets/lesson.json', '/assets/triangle.glb', '/assets/triangle.gltf', '/assets/triangle.bin', '/assets/texture.png']) expect(urls.some(url => url.endsWith(path)), path).toBe(true);
    // Pixel evidence: a successful loader alone would not prove visible WebGL output.
    const coloredPixels = await content.locator('canvas').evaluate(canvas => {
      const gl = canvas.getContext('webgl2'), pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let count = 0; for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 100) count++;
      return count;
    });
    expect(coloredPixels).toBeGreaterThan(1000);
    await content.locator('#rotate').click(); await expect(content.locator('#memory')).toContainText('Drehungen: 1');
    await content.locator('canvas').screenshot({ path: testInfo.outputPath('rendered-models.png') });
    await content.locator('#scorm-exit').click(); await expect(content.locator('#scorm-session')).toHaveAttribute('data-state', 'finished');
    const result = await trace(page);
    expect(result.lessonStatus).toBe('incomplete'); expect(result.activeSession).toBe(false);
    expect(result.calls.filter(c => c[0] === 'LMSSetValue')).toEqual([['LMSSetValue', 'cmi.core.lesson_status', 'incomplete']]);
    expect(result.calls.filter(c => c[0] === 'LMSGetValue')).toEqual([['LMSGetValue', 'cmi.core.lesson_status']]);
    expect(result.calls.filter(c => c[0] === 'LMSFinish')).toHaveLength(1);
    expect(urls.filter(url => !url.startsWith(base + '/'))).toEqual([]); expect(errors).toEqual([]); expect(failures).toEqual([]);
  });
}
test('Nested parent discovery and actual popup close', async ({ page }) => {
  const content = await launch(page, 'https://127.0.0.1:4182', 'nested');
  await expect(content.locator('#scorm-session')).toHaveAttribute('data-state', 'active');
  await content.locator('#scorm-exit').click();
  const popup = await launch(page, 'https://127.0.0.1:4182', 'popup');
  await expect(popup.locator('#scorm-session')).toHaveAttribute('data-state', 'active');
  await popup.close(); await expect.poll(async () => (await trace(page)).activeSession).toBe(false);
});
test('Classroom adapter is volatile and never replaces or clears browser storage', async ({ page }) => {
  await page.goto('http://127.0.0.1:4183/blank.html');
  await page.evaluate(() => { localStorage.setItem('unrelated-project', 'keep'); localStorage.setItem('scorm-example-turns', '88'); });
  let content = await launch(page, 'http://127.0.0.1:4183');
  await expect(content.locator('#render-status')).toHaveAttribute('data-ready', 'true');
  await expect(content.locator('#memory')).toContainText('Flüchtiger Unterrichtsmodus · Drehungen: 0');
  await content.locator('#rotate').click(); await expect(content.locator('#memory')).toContainText('Drehungen: 1');
  expect(await content.evaluate(() => [localStorage.getItem('unrelated-project'), localStorage.getItem('scorm-example-turns'), Storage.prototype.setItem.toString().includes('[native code]')])).toEqual(['keep', '88', true]);
  content = await launch(page, 'http://127.0.0.1:4183');
  await expect(content.locator('#memory')).toContainText('Drehungen: 0');
});
test('Normal mode keeps the application-owned save on reload', async ({ page }) => {
  let content = await launch(page, 'http://127.0.0.1:4181');
  await expect(content.locator('#render-status')).toHaveAttribute('data-ready', 'true');
  await content.locator('#rotate').click();
  content = await launch(page, 'http://127.0.0.1:4181');
  await expect(content.locator('#memory')).toContainText('Drehungen: 1');
});
test('Initialization error stays visible; app and retry remain usable', async ({ page }) => {
  const content = await launch(page, 'http://127.0.0.1:4181', 'embedded', '&fail=init');
  await expect(content.locator('#scorm-session')).toHaveAttribute('data-state', 'error');
  await expect(content.locator('#render-status')).toHaveAttribute('data-ready', 'true');
  await expect(content.locator('#scorm-exit')).toHaveText('Verbindung erneut prüfen');
});
test('A direct tab without accessible LMS API reports unavailable', async ({ page }) => {
  await page.goto('https://127.0.0.1:4182/lms/course/content/pages/start.html');
  await expect(page.locator('#scorm-session')).toHaveAttribute('data-state', 'unavailable');
  await expect(page.locator('#render-status')).toHaveAttribute('data-ready', 'true');
});
for (const viewport of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }]) test(`Tablet touch ${viewport.width}x${viewport.height}`, async ({ browser }, testInfo) => {
  const context = await browser.newContext({ hasTouch: true, viewport, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  for (const mode of ['embedded', 'popup']) {
    const content = await launch(page, 'https://127.0.0.1:4182', mode);
    await expect(content.locator('#render-status')).toHaveAttribute('data-ready', 'true');
    await content.locator('canvas').tap(); await expect(content.locator('#memory')).toContainText('Drehungen:');
    expect(await content.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
    if (mode === 'embedded') await page.screenshot({ path: testInfo.outputPath('tablet.png'), fullPage: true });
    await content.locator('#scorm-exit').tap(); expect((await trace(page)).activeSession).toBe(false);
  }
  await context.close();
});
