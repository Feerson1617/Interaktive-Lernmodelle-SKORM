import {execFileSync} from 'node:child_process';
const asset = JSON.parse(execFileSync('python3',['-c', 'import json,zipfile,sys; print(zipfile.ZipFile(sys.argv[1]).read("__scorm/package-info.json").decode())',process.env.SCORM_ZIP || 'dist/Beispiel-SCORM-1.2.zip'],{encoding:'utf8'})).trackingMode === 'asset';
import { test, expect } from '@playwright/test';
for (const protocol of ['http', 'https']) for (const mode of ['embedded', 'popup']) test(`${protocol}/${mode}: configured package launches without missing/external resources`, async ({ page, context }, testInfo) => {
  const base = `${protocol}://127.0.0.1:${protocol === 'http' ? 4185 : 4186}`;
  const failures = [], external = [], errors = [];
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === base) return route.continue();
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
  if (!asset) await expect(content.locator('#scorm-session')).toHaveAttribute('data-state', 'active');
  await content.waitForLoadState('networkidle');
  await content.locator('body').screenshot({ path: testInfo.outputPath('launch.png') });
  if (asset) {
    expect(await page.evaluate(() => calls)).toEqual([]);
    expect(failures).toEqual([]); expect(external).toEqual([]); expect(errors).toEqual([]);
    await content.goto('about:blank'); expect(await page.evaluate(() => calls)).toEqual([]); return;
  }
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
