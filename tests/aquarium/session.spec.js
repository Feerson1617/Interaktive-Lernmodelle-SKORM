import {test, expect} from '@playwright/test';
const missions=['m1-light-oxygen','m2-food-transformation','m3-hidden-inheritance','m4-dominance-frequency','m5-recurring-input','m6-plant-carbon'];
test('real Aquarium: RAM across six missions, no storage/API/network, fresh reload and disposal', async ({page,context},info)=>{
  test.setTimeout(900000);
  const failures=[],errors=[],external=[],storage=[];
  await context.exposeBinding('reportPersistence',(_,name)=>storage.push(name));
  await context.addInitScript(()=>{
    for(const name of ['localStorage','sessionStorage','indexedDB','caches']) {
      Object.defineProperty(window,name,{get(){window.reportPersistence(name);throw Error('Persistent storage accessed: '+name);}});
    }
  });
  await context.route('**/*', route=>{
    if(new URL(route.request().url()).hostname==='127.0.0.1')return route.continue();
    external.push(route.request().url());return route.abort();
  });
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,500));});
  page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
  await page.goto('http://127.0.0.1:4185/player.html');
  await expect.poll(()=>page.frames().some(f=>f.url().includes('classroom.html'))).toBe(true);
  const host=page.frames().find(f=>f.url().includes('classroom.html'));
  const view=()=>page.frames().find(f=>f.url().includes('/index.html'));
  await expect.poll(()=>!!view()).toBe(true);
  await expect(view().locator('[data-single=start]')).toBeVisible();
  await expect(view().locator('[data-single-mission]')).toHaveCount(6);
  const attempts={};
  for(const mission of missions) {
    if(mission!==missions[0]) {
      await host.evaluate(m=>aquariumStandaloneNavigate('./index.html?mission='+m),mission);
      await expect.poll(()=>view()?.url().includes(mission)).toBe(true);
    }
    const v=view();
    if(mission===missions[0]) {await v.locator('[data-single=start]').press('Enter');await v.locator('[data-single=plant]').press('Enter');await v.locator('[data-single=prediction]').first().press('Enter');}
    else {
      await expect(v.locator('[data-class-stage]')).toBeVisible();
      const choice=v.locator('[data-class-choice]').first();
      if(await choice.count()) await choice.press('Enter');
      const feed=v.locator('[data-class=feed]');if(await feed.count())await feed.press('Enter');
    }
    await expect.poll(()=>v.evaluate(()=>aquariumLearningSnapshot().renderer?.stats.detailModels||0)).toBeGreaterThan(0);
    const snap=await v.evaluate(()=>aquariumLearningSnapshot());
    attempts[mission]=snap.session.attemptId;
    expect(snap.session.mission||mission).toBe(mission);
    await completeMission(v,mission);
    expect((await v.evaluate(()=>aquariumLearningSnapshot().session)).stage).toBe('complete');
    await page.screenshot({path:info.outputPath(mission+'.png')});
  }
  await host.evaluate(()=>aquariumStandaloneNavigate('./index.html?mission=m1-light-oxygen'));
  await expect.poll(()=>view()?.url().includes('m1-light-oxygen')).toBe(true);
  await expect(view().locator('[data-single=start]')).toBeVisible();
  await view().locator('[data-single=start]').press('Enter');
  await expect(view().locator('[data-single-stage]')).toBeVisible();
  expect(await view().evaluate(()=>aquariumLearningSnapshot().session.attemptId)).toBe(attempts[missions[0]]);
  expect(await view().evaluate(()=>aquariumLearningSnapshot().session.prediction)).toBeTruthy();
  const lifecycle=await host.evaluate(()=>aquariumClassroomSnapshot());
  expect(lifecycle.frames).toBe(1);expect(lifecycle.retired.length).toBeGreaterThanOrEqual(6);
  for(const r of lifecycle.retired) {expect(r.disposed).toBe(true);expect(r.intervals).toBe(0);expect(r.timeouts).toBe(0);expect(r.registeredListeners).toBe(0);expect(r.animationCallbacks).toBe(0);expect(r.webglContexts).toBe(0);}
  expect(await page.evaluate(()=>calls)).toEqual([]);
  await host.evaluate(()=>location.reload());
  await expect.poll(()=>view()?.url().endsWith('/index.html')).toBe(true);
  await expect(view().locator('[data-single=start]')).toBeVisible();
  await view().locator('[data-single=start]').press('Enter');
  expect(await view().evaluate(()=>aquariumLearningSnapshot().session.attemptId)).not.toBe(attempts[missions[0]]);
  expect(await page.evaluate(()=>calls)).toEqual([]);
  expect(storage).toEqual([]);expect(failures).toEqual([]);expect(external).toEqual([]);expect(errors).toEqual([]);
});

async function completeMission(v,mission) {
  const act=async action=>{await v.locator(`[data-class="${action}"]`).first().press('Enter');};
  const choice=async value=>{await v.locator(`[data-class-choice="${value}"]`).first().press('Enter');};
  const observe=async()=>{await act('play');await expect.poll(()=>v.evaluate(()=>aquariumLearningSnapshot().session.stage),{timeout:150000}).not.toBe('observing');};
  if(mission.startsWith('m1')) {
    const m=async action=>v.locator(`[data-single="${action}"]`).press('Enter');
    await m('play');await expect(v.locator('[data-single-stage=light-finished]')).toBeVisible({timeout:150000});
    await m('reset');await m('darken');await m('play');await expect(v.locator('[data-single-stage=compare]')).toBeVisible({timeout:150000});
    for(const value of ['observed','processes'])await v.locator(`[data-single-choice="${value}"]`).press('Enter');
  } else if(mission.startsWith('m2')) {
    await observe();await choice('observed');await act('filter');
    for(const value of ['decomposer','nutrients','separate'])await choice(value);
  } else if(mission.startsWith('m3')) {
    const parents=async()=>{
      const s=await v.evaluate(()=>aquariumLearningSnapshot().session);
      const fish=s.tank.entities.filter(e=>e.species==='molly');
      const female=fish.find(e=>e.sex==='♀'&&(s.stage!=='founders'||e.genotype==='AA'));
      const male=fish.find(e=>e.sex==='♂'&&(s.stage!=='founders'||e.genotype==='aa'));
      for(const e of [female,male])await v.locator(`[data-class=select][data-class-uid="${e.uid}"]`).press('Enter');
    };
    await parents();await act('generation');await choice('dark');await parents();await act('generation');
    await v.locator('[data-class=select]').first().press('Enter');await choice('actual-alleles');await choice('possible');
  } else if(mission.startsWith('m4')) {
    for(let trial=0;trial<3;trial++) {for(let g=0;g<3;g++)await act('generation');if(trial<2)await act('reset-trial');}
    await act('compare-trials');for(const value of ['actual-counts','weighted-parents','not-guaranteed'])await choice(value);
  } else if(mission.startsWith('m5')) {
    await choice('water');
    await observe();await act('reset-measure');await choice('feed');await observe();await choice('actual-late');await choice('source');
  } else if(mission.startsWith('m6')) {
    await act('plant');await observe();for(const value of ['observed','water-carbon','respiration','explanation'])await choice(value);
  }
}
