import { test, expect } from '@playwright/test';
for (const protocol of ['http', 'https']) for (const mode of ['embedded', 'popup']) test(`${protocol}/${mode}: configured package launches without missing/external resources`, async ({ page, context }, testInfo) => {
  const base = `${protocol}://127.0.0.1:${protocol === 'http' ? 4185 : 4186}`;
  const failures = [], external = [], errors = [];
  await context.route('**/*', route => {
    if (route.request().url().startsWith(base + '/')) return route.continue();
    external.push(route.request().url()); return route.abort();
  });
  context.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
  context.on('page', p => p.on('pageerror', error => errors.push(error.message)));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/player.html?mode=${mode}`);
  await expect.poll(() => page.evaluate(() => typeof document.querySelector('#launch').onclick)).toBe('function');
  let content;
  if (mode === 'popup') { const popup = page.waitForEvent('popup'); await page.locator('#launch').click(); content = await popup; }
  else { await expect.poll(() => page.frames().some(f => f.url().includes('/content/'))).toBe(true); content = page.frames().find(f => f.url().includes('/content/')); }
  await expect(content.locator('#scorm-session')).toHaveAttribute('data-state', 'active');
  await content.waitForLoadState('networkidle');
  await content.locator('body').screenshot({ path: testInfo.outputPath('launch.png') });
  await content.locator('#scorm-exit').click();
  await expect(content.locator('#scorm-session')).toHaveAttribute('data-state', 'finished');
  const result = await page.evaluate(() => ({ calls, activeSession, lessonStatus }));
  expect(result.activeSession).toBe(false); expect(result.lessonStatus).toBe('incomplete');
  expect(result.calls.filter(c => c[0] === 'LMSSetValue')).toEqual([['LMSSetValue', 'cmi.core.lesson_status', 'incomplete']]);
  expect(result.calls.filter(c => c[0] === 'LMSGetValue')).toEqual([['LMSGetValue', 'cmi.core.lesson_status']]);
  expect(result.calls.filter(c => c[0] === 'LMSInitialize')).toHaveLength(1);
  expect(result.calls.filter(c => c[0] === 'LMSFinish')).toHaveLength(1);
  expect(failures).toEqual([]); expect(external).toEqual([]); expect(errors).toEqual([]);
});
