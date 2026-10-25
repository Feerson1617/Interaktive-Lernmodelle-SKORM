import {test,expect} from '@playwright/test';
test('tablet research in all grades, expert scenarios, genetics, analysis and eight tutorial steps',async({page},info)=>{
  test.setTimeout(600000);
  await page.setViewportSize({width:768,height:1024});
  await page.goto('http://127.0.0.1:4185/player.html');
  await expect.poll(()=>page.frames().some(f=>f.url().includes('classroom.html'))).toBe(true);
  const host=page.frames().find(f=>f.url().includes('classroom.html'));
  const view=()=>page.frames().find(f=>f.url().includes('/index.html'));
  async function route(query) {
    await host.evaluate(q=>aquariumStandaloneNavigate('./index.html'+q),query);
    await expect.poll(()=>view()?.url().endsWith('/index.html'+query)).toBe(true);
    await expect.poll(()=>view().evaluate(()=>typeof aquariumLearningSnapshot)).toBe('function');
  }
  const act=async selector=>view().locator(selector+':visible').first().press('Enter');
  for(const grade of [8,9,10]) {
    await route('?research='+grade);
    await expect(view().locator('[data-class-stage=free]')).toBeVisible();
    const before=await view().evaluate(()=>aquariumLearningSnapshot().session.tank.day);
    await act('[data-class=free-day]');
    expect(await view().evaluate(()=>aquariumLearningSnapshot().session.tank.day)).toBe(before+1);
  }
  await route('?expert=1');
  await act('[data-graphics-profile=ipad]');
  await expect(view().locator('[data-start=tutorial]')).toBeVisible();
  await act('[data-scenarios]');
  const scenarios=await view().locator('[data-scenario-start]').evaluateAll(es=>es.map(e=>e.dataset.scenarioStart));
  expect(scenarios).toHaveLength(5);
  await act('[data-scenario-start=foodweb]');await act('#ecosystem-button');
  for(const tab of ['web','microbes','nitrogen','carbon','energy','factors']) {
    await act('[data-eco-tab='+tab+']');await expect(view().locator('.study-content')).not.toBeEmpty();
  }
  await page.screenshot({path:info.outputPath('tablet-analysis.png')});
  await act('[data-eco-close]');await act('#genetics-button');
  await expect(view().locator('.genetics-overlay')).toBeVisible();
  await route('?expert=1');await act('[data-start=tutorial]');
  const state=()=>host.evaluate(()=>JSON.parse(aquariumClassroomStorage.getItem('aquarium-werkstatt-v1')));
  await act('[data-act=tutorial-action]');await act('[data-buy=tank-120]');await act('[data-act=place-tank]');
  expect((await state()).tutorialStep).toBe(1);
  const close=async()=>{if(await view().locator('[data-act=close-panel]:visible').count())await act('[data-act=close-panel]');};
  for(const [step,product] of [[2,'substrate-sand'],[3,'filter-internal120'],[4,'light-basic']]) {
    await act('[data-act=tutorial-action]');await act('[data-buy='+product+']');await close();await act('[data-act=tutorial-next]');expect((await state()).tutorialStep).toBe(step);
  }
  await act('[data-act=tutorial-action]');await act('[data-species]');await act('[data-act=add-species]');await close();await act('[data-act=tutorial-next]');expect((await state()).tutorialStep).toBe(5);
  await act('[data-act=tutorial-action]');await act('[data-act=quick-test]');await close();await act('[data-act=tutorial-next]');expect((await state()).tutorialStep).toBe(6);
  await act('[data-act=tutorial-action]');await act('[data-advance="7"]');await close();await act('[data-act=tutorial-next]');expect((await state()).tutorialStep).toBe(7);
  await act('[data-act=tutorial-action]');await act('[data-species]');await act('[data-act=close-modal]');await close();await act('[data-act=tutorial-next]');expect((await state()).tutorialCompleted).toBe(true);
  await page.screenshot({path:info.outputPath('tutorial-complete.png')});
  expect(await page.evaluate(()=>calls)).toEqual([]);
});
