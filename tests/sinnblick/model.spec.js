import { test, expect } from '@playwright/test';
const base = 'https://127.0.0.1:4186';

// Test-only instrumentation counts actual GPU draw calls in each isolated model.
test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => {
    window.__gpuDraws = 0;
    for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext].filter(Boolean)) {
      for (const key of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
        const original = type.prototype[key];
        if (original) type.prototype[key] = function (...args) { window.__gpuDraws++; return original.apply(this, args); };
      }
    }
  });
  const problems = [];
  page.on('pageerror', e => problems.push(e.message));
  context.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
  context.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
  await context.route('**/*', route => {
    if (route.request().url().startsWith(base + '/')) return route.continue();
    problems.push(`External request: ${route.request().url()}`); return route.abort();
  });
  page.__problems = problems;
});
test.afterEach(async ({ page }) => { expect(page.__problems).toEqual([]); });
async function launch(page) {
  await page.goto(base + '/player.html');
  await expect.poll(() => page.frames().some(f => f.url().endsWith('/content/index.html'))).toBe(true);
  const app = page.frames().find(f => f.url().endsWith('/content/index.html'));
  await expect(app.locator('#scorm-session')).toHaveAttribute('data-state', 'active');
  await expect.poll(() => app.evaluate(() => window.__gpuDraws)).toBeGreaterThan(20);
  await expect(app.locator('#error')).toBeHidden();
  return app;
}
async function open(page, app, organ) {
  await app.locator(`.top [data-open="${organ}"]`).tap();
  await expect(app.locator('#loading')).toBeHidden();
  await expect.poll(() => page.frames().some(f => f.url().endsWith(`/${organ}/index.html`))).toBe(true);
  const frame = page.frames().find(f => f.url().endsWith(`/${organ}/index.html`));
  await expect.poll(() => frame.evaluate(() => window.__gpuDraws)).toBeGreaterThan(20);
  await expect.poll(() => frame.evaluate(() => SenseBridge.paused)).toBe(false);
  await expect(frame.locator(organ === 'eye' ? '#fatal-error' : '#error')).toBeHidden();
  expect(await frame.evaluate(() => THREE.REVISION)).toBe('160');
  return frame;
}
async function range(frame, id, value) {
  await frame.locator('#' + id).fill(String(value));
  await frame.locator('#' + id).dispatchEvent('input');
}
async function fits(frame) {
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  await expect.poll(() => frame.evaluate(() => [...document.querySelectorAll('button')].filter(b => {
    const r=b.getBoundingClientRect(); return r.width>0 && r.height>0 && (r.width<43.5 || r.height<43.5);
  }).map(b => b.id || b.className))).toEqual([]);
}
async function frameFits(app) {
  const dims = await app.evaluate(() => ({ bottom: document.getElementById('modules').getBoundingClientRect().bottom, height: innerHeight }));
  expect(dims.bottom).toBeLessThanOrEqual(dims.height + 1);
}
async function finish(page, app) {
  await app.locator('#scorm-exit').tap();
  await expect(app.locator('#scorm-session')).toHaveAttribute('data-state', 'finished');
  const { calls, activeSession, lessonStatus } = await page.evaluate(() => ({ calls, activeSession, lessonStatus }));
  expect(activeSession).toBe(false); expect(lessonStatus).toBe('incomplete');
  expect(calls.filter(c => c[0] === 'LMSSetValue')).toEqual([['LMSSetValue', 'cmi.core.lesson_status', 'incomplete']]);
  expect(calls.filter(c => c[0] === 'LMSGetValue')).toEqual([['LMSGetValue', 'cmi.core.lesson_status']]);
  expect(calls.filter(c => c[0] === 'LMSFinish')).toHaveLength(1);
}

for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  test(`Head and eye: anatomy, light, accommodation, all cells, ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const app = await launch(page);
    await app.locator('#head-canvas').screenshot({ path: info.outputPath('head.png') });
    await fits(app);
    await app.locator('#eye-label').tap();
    await expect(app.locator('#card-title')).toContainText('Fenster');
    await app.locator('#enter').tap();
    await expect(app.locator('#loading')).toBeHidden();
    const eye = page.frames().find(f => f.url().endsWith('/eye/index.html'));
    await expect.poll(() => eye.evaluate(() => window.Augenblick?.ready)).toBe(true);
    await frameFits(app); await fits(eye);
    await expect(eye.locator('#parts-list .part-row')).toHaveCount(13);
    await range(eye, 'light', 95);
    await expect.poll(() => eye.evaluate(() => Augenblick.state.light)).toBe(.95);
    await expect(eye.locator('#light-result')).toContainText('eng');
    await range(eye, 'focus-distance', 35);
    await expect.poll(() => eye.evaluate(() => Augenblick.state.near)).toBe(.65);
    await eye.locator('#focus-detail').tap();
    await expect.poll(() => eye.evaluate(() => Augenblick.state.mode)).toBe('accommodation');
    await expect(eye.locator('#parts-list .part-row')).toHaveCount(3);
    await eye.locator('#canvas').screenshot({ path: info.outputPath('accommodation.png') });
    await eye.locator('#focus-play').tap();
    const near = await eye.evaluate(() => Augenblick.state.near);
    await expect.poll(() => eye.evaluate(() => Augenblick.state.near)).not.toBe(near);
    await range(eye, 'focus-distance', 35);
    expect(await eye.evaluate(() => Augenblick.state.focusPlaying)).toBe(false);
    await eye.locator('#back-button').tap();
    await eye.locator('#retina-link').tap();
    await expect.poll(() => eye.evaluate(() => Augenblick.state.mode)).toBe('retina');
    for (const id of ['rods', 'cone-s', 'cone-m', 'cone-l']) {
      await eye.locator(`[data-select="${id}"]`).tap();
      await expect(eye.locator('#info-text')).not.toBeEmpty();
    }
    await eye.locator('#receptors-link').tap();
    await expect.poll(() => eye.evaluate(() => Augenblick.state.mode)).toBe('receptors');
    await eye.locator('#canvas').screenshot({ path: info.outputPath('receptors.png') });
    for (const id of ['pr-rod', 'pr-s', 'pr-m', 'pr-l']) {
      await eye.locator(`[data-select="${id}"]`).tap();
      await eye.locator('#focus-button').tap();
      await expect.poll(() => eye.evaluate(() => Augenblick.state.focus)).toBe(id);
      expect(await eye.evaluate(() => Augenblick.groups['pr-inner'].visible)).toBe(true);
      await eye.locator('#back-button').tap();
    }
    await eye.locator('#back-button').tap();
    await expect.poll(() => eye.evaluate(() => Augenblick.state.mode)).toBe('retina');
    await eye.locator('#back-button').tap();
    for (const [id, mode] of Object.entries({ iris:'iris', cornea:'cornea', sclera:'wall', macula:'macula', disc:'disc', nerve:'nerve' })) {
      await eye.locator(`[data-select="${id}"]`).tap();
      await eye.locator('#focus-button').tap();
      await expect.poll(() => eye.evaluate(() => Augenblick.state.mode)).toBe(mode);
      await expect(eye.locator('#info-card')).toBeHidden();
      await eye.locator('#back-button').tap();
    }
    await eye.locator('#whole-button').tap();
    expect(await eye.evaluate(() => Augenblick.state.cut)).toBe(false);
    await eye.locator('#cut-button').tap();
    await range(eye, 'explode', 50);
    expect(await eye.evaluate(() => Augenblick.state.explode)).toBe(.5);
    await eye.locator('[data-toggle="vitreous"]').tap();
    expect(await eye.evaluate(() => Augenblick.state.visibility.vitreous)).toBe(false);
    await eye.locator('#show-all').tap();
    await eye.locator('#sources-button').tap();
    await expect(eye.locator('.source-citation')).toHaveCount(8);
    await expect(eye.locator('a[href^="https:"]')).toHaveCount(0);
    await eye.locator('#sources-dialog [data-close-dialog]').tap();
    await app.locator('#back-head').tap();
    const resumed = await open(page, app, 'eye');
    expect(await resumed.evaluate(() => [Augenblick.state.light, Augenblick.state.near])).toEqual([.95, .65]);
    await finish(page, app);
    await expect.poll(() => resumed.evaluate(() => SenseBridge.paused)).toBe(true);
  });

  test(`Ear: all detail routes, sound, bones, hair, balance, ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const app = await launch(page), ear = await open(page, app, 'ear');
    await fits(ear); await frameFits(app);
    await ear.locator('#model').screenshot({ path: info.outputPath('ear.png') });
    await ear.locator('label[for="sound-toggle"], .sound-title label').tap();
    await expect(ear.locator('#sound-toggle')).toBeChecked();
    await range(ear, 'volume', 80); await range(ear, 'pitch', 90);
    await expect(ear.locator('#volume-value')).toHaveText('80 %');
    await expect(ear.locator('#pitch-value')).toHaveText('sehr hoch');
    await ear.locator('.sound-title label').tap();
    for (const [id, title] of Object.entries({ auricle:'Außenohr', malleus:'Mittelohr', cochlea:'Hörschnecke', nerve:'Hörnerv', balance:'Gleichgewichtsorgan', tube:'Druckausgleich' })) {
      await ear.locator(`#part-list .part-select[data-part="${id}"]`).tap();
      await expect(ear.locator('#info-text')).not.toBeEmpty();
      await ear.locator('#enter-detail').tap();
      await expect(ear.locator('#view-title')).toContainText(title);
      if (id === 'balance') await expect(ear.locator('#sound-explanation')).toContainText('unbewegt');
      await ear.locator('#back').tap();
    }
    await ear.locator('#bones-link').tap();
    await expect(ear.locator('#part-list .part-select')).toHaveCount(11);
    const bones = await ear.locator('#part-list .part-select').count();
    for (let i = 0; i < bones; i++) {
      await ear.locator('#part-list .part-select').nth(i).tap();
      await expect(ear.locator('#info-text')).not.toBeEmpty();
    }
    await ear.locator('#close-info').tap();
    await ear.locator('#model').screenshot({ path: info.outputPath('bones.png') });
    await ear.locator('.sound-title label').tap();
    const moving = await ear.locator('#model').screenshot();
    await page.waitForTimeout(180);
    expect((await ear.locator('#model').screenshot()).equals(moving)).toBe(false);
    await ear.locator('.sound-title label').tap();
    await ear.locator('#back').tap(); await ear.locator('#back').tap();
    await ear.locator('#corti-link').tap();
    await expect(ear.locator('#view-title')).toContainText('Haarzellen');
    for (const id of ['inner_hair', 'outer_hair', 'stereocilia', 'channels', 'synapse']) {
      await ear.locator(`#part-list .part-select[data-part="${id}"]`).tap();
      await expect(ear.locator('#info-text')).not.toBeEmpty();
    }
    await ear.locator('#close-info').tap();
    await ear.locator('#model').screenshot({ path: info.outputPath('hair.png') });
    await ear.locator('#back').tap(); await ear.locator('#back').tap();
    await ear.locator('#whole').tap(); await expect(ear.locator('#whole')).toHaveAttribute('aria-pressed','true');
    await ear.locator('#cut').tap();
    await ear.locator('#sources-button').tap();
    await expect(ear.locator('.source-citation')).toHaveCount(8);
    await expect(ear.locator('a[href^="https:"]')).toHaveCount(0);
    await ear.locator('#sources-dialog [data-close]').tap();
    await app.locator('#back-head').tap();
    await open(page, app, 'ear');
    await expect(ear.locator('#volume')).toHaveValue('80'); await expect(ear.locator('#pitch')).toHaveValue('90');
    await finish(page, app);
    await expect.poll(() => ear.evaluate(() => SenseBridge.paused)).toBe(true);
    const draws = await ear.evaluate(() => __gpuDraws);
    await page.waitForTimeout(150);
    expect(await ear.evaluate(() => __gpuDraws)).toBe(draws);
  });
}

// Chromium receives native touch input via CDP. WebKit has no multi-touch API;
// it receives PointerEvents, with capture stubbed only for those synthetic IDs.
async function touchGesture(frame, selector, pinch = false) {
  await frame.locator(selector).scrollIntoViewIfNeeded();
  const page=frame.page();
  if(page.context().browser().browserType().name()==='chromium') {
    const r=await frame.locator(selector).boundingBox(), x=r.x+r.width*.5, y=r.y+r.height*.65;
    const cdp=await page.context().newCDPSession(page);
    const points=i=>pinch ? [{id:71,x:x-35-i*3,y},{id:72,x:x+35+i*3,y}] : [{id:71,x:x+i*12,y}];
    try {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(0)});
      for(let i=1;i<=5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(i)});await page.waitForTimeout(25);}
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    } finally {await cdp.detach();}
    return;
  }
  await frame.locator(selector).evaluate(async (canvas, pinch) => {
    const r = canvas.getBoundingClientRect(), x = r.left + r.width * .5, y = r.top + r.height * .65;
    const capture = canvas.setPointerCapture;
    canvas.setPointerCapture = () => {};
    const send = (type, id, dx) => canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true, pointerId: id, pointerType: 'touch', isPrimary: id === 71,
      clientX: x + dx, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1
    }));
    try {
      send('pointerdown',71,pinch ? -35 : 0);
      if (pinch) send('pointerdown',72,35);
      for(let i=1;i<=5;i++) {
        send('pointermove',71,pinch ? -35-i*3 : i*12);
        if(pinch) send('pointermove',72,35+i*3);
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      send('pointerup',71,pinch ? -50 : 60);
      if(pinch)send('pointerup',72,50);
    } finally { canvas.setPointerCapture = capture; }
  }, pinch);
}
test('Rotation, pinch, zoom transitions and orientation change in exported models', async ({ page }, info) => {
  const app = await launch(page);
  const headCanvas=app.locator('#head-canvas'), size=await headCanvas.boundingBox();
  await headCanvas.tap({position:{x:size.width*.535,y:size.height*.365}});
  await expect(app.locator('#card-title')).toContainText('Fenster');
  const headBefore = await headCanvas.screenshot();
  await touchGesture(app, '#head-canvas');
  await page.waitForTimeout(250);
  expect((await app.locator('#head-canvas').screenshot()).equals(headBefore)).toBe(false);
  await app.locator('#reset').tap();
  const eyeLabel = app.locator('#eye-label');
  await eyeLabel.hover();
  for(let i=0;i<4;i++) { await page.mouse.wheel(0,-110); await page.waitForTimeout(60); }
  await expect(app.locator('#module-name')).toContainText('Auge');
  await expect(app.locator('#loading')).toBeHidden();
  const eye = page.frames().find(f => f.url().endsWith('/eye/index.html'));
  await expect.poll(() => eye.evaluate(() => window.Augenblick?.ready)).toBe(true);
  await page.waitForTimeout(500);
  const hit=await eye.evaluate(()=>{const canvas=document.getElementById('canvas'),v=Augenblick.anchors.iris.getWorldPosition(new THREE.Vector3()).project(Augenblick.camera);return {x:(v.x*.5+.5)*canvas.clientWidth,y:(-v.y*.5+.5)*canvas.clientHeight};});
  await eye.locator('#canvas').tap({position:hit});
  await expect.poll(()=>eye.evaluate(()=>Augenblick.state.selected)).not.toBeNull();
  await eye.locator('#close-info').tap();
  const position = await eye.evaluate(() => Augenblick.camera.position.toArray());
  await touchGesture(eye, '#canvas');
  await expect.poll(() => eye.evaluate(() => Augenblick.camera.position.toArray())).not.toEqual(position);
  const distance = await eye.evaluate(() => Augenblick.camera.position.length());
  await touchGesture(eye, '#canvas', true);
  await expect.poll(() => eye.evaluate(() => Augenblick.camera.position.length())).toBeLessThan(distance);
  await eye.locator('#retina-link').tap();
  await eye.locator('[data-select="cone-s"]').tap();
  for (let i=0;i<8 && await eye.evaluate(() => Augenblick.state.mode)==='retina';i++) await eye.locator('#zoom-in').tap();
  await expect.poll(() => eye.evaluate(() => Augenblick.state.mode)).toBe('receptors');
  await page.waitForTimeout(500);
  for(let i=0;i<5 && await eye.evaluate(() => Augenblick.state.mode)==='receptors';i++) await eye.locator('#zoom-out').tap();
  await expect.poll(() => eye.evaluate(() => Augenblick.state.mode)).toBe('retina');
  await app.locator('#back-head').tap();
  const ear = await open(page, app, 'ear');
  await ear.locator('label[for="auto-zoom"]').tap();
  await expect(ear.locator('#auto-zoom')).not.toBeChecked();
  const before = await ear.locator('#model').screenshot();
  await touchGesture(ear, '#model'); await touchGesture(ear, '#model',true);
  expect((await ear.locator('#model').screenshot()).equals(before)).toBe(false);
  await page.setViewportSize({ width:768,height:1024 });
  await fits(app); await fits(ear); await frameFits(app);
  await ear.locator('#model').screenshot({ path: info.outputPath('rotated-portrait.png') });
  await finish(page,app);
});

test('No persistence, session pause/restore keeps detail and in-memory settings', async ({ context, page }) => {
  await page.goto(base + '/blank.html');
  await page.evaluate(() => localStorage.setItem('unrelated-project','keep'));
  await context.addInitScript(() => {
    window.__storageAccess = [];
    for (const key of ['getItem','setItem','removeItem','clear']) {
      Storage.prototype[key] = function () { window.__storageAccess.push(key); throw new Error('Storage blocked in test'); };
    }
  });
  const app = await launch(page), eye = await open(page,app,'eye');
  await range(eye,'light',20); await range(eye,'focus-distance',42);
  await eye.locator('#retina-link').tap();
  await app.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));
  await expect(app.locator('#scorm-session')).toHaveAttribute('data-state','finished');
  await expect.poll(() => eye.evaluate(() => SenseBridge.paused)).toBe(true);
  await app.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await expect(app.locator('#scorm-session')).toHaveAttribute('data-state','active');
  await expect.poll(() => eye.evaluate(() => SenseBridge.paused)).toBe(false);
  expect(await eye.evaluate(() => [Augenblick.state.mode,Augenblick.state.light])).toEqual(['retina',.2]);
  expect(await eye.evaluate(() => Augenblick.state.near)).toBeCloseTo(.58);
  const ear = await open(page,app,'ear');
  await range(ear,'volume',23);
  for(const frame of [app,eye,ear]) expect(await frame.evaluate(() => __storageAccess)).toEqual([]);
  await app.locator('#scorm-exit').tap();
  const fresh = await launch(page), freshEye = await open(page,fresh,'eye');
  expect(await freshEye.evaluate(() => [Augenblick.state.light,Augenblick.state.near])).toEqual([.55,0]);
  // Browser-level storage inspection does not call the page's Storage stub.
  const state = await context.storageState();
  expect(state.origins.find(o => o.origin===base).localStorage).toEqual([{ name:'unrelated-project',value:'keep' }]);
  await finish(page,fresh);
});
