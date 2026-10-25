import {test,expect} from '@playwright/test';
test('real tweezers drag commits an allowed placement and rejects a collision',async({page},info)=>{
  test.setTimeout(300000);
  await page.setViewportSize({width:1366,height:960});
  await page.goto('http://127.0.0.1:4185/player.html');
  await expect.poll(()=>page.frames().some(f=>f.url().includes('classroom.html'))).toBe(true);
  const host=page.frames().find(f=>f.url().includes('classroom.html'));
  await host.evaluate(()=>aquariumStandaloneNavigate('./index.html?expert=1'));
  await expect.poll(()=>page.frames().some(f=>f.url().endsWith('?expert=1'))).toBe(true);
  const v=page.frames().find(f=>f.url().endsWith('?expert=1'));
  const act=async selector=>v.locator(selector+':visible').first().press('Enter');
  await act('[data-graphics-profile=ipad]');await act('[data-scenarios]');await act('[data-scenario-start=foodweb]');
  await expect(v.locator('#tweezers-button')).toBeEnabled();
  await act('#tweezers-button');
  const snap=()=>v.evaluate(()=>aquariumAquascapingSnapshot());
  await expect.poll(async()=>(await snap()).targets.every(t=>t.screen)).toBe(true);
  const before=(await snap()).targets.find(t=>t.species==='spiderwood');
  const box=await page.locator('#sco').boundingBox();
  const point=t=>({x:t.screen.x+box.x,y:t.screen.y+box.y});
  const start=point(before);
  await page.mouse.move(start.x,start.y);await page.mouse.down();
  await expect.poll(async()=>(await snap()).phase).toBe('dragging');
  let accepted=false;
  for(const [dx,dy] of [[100,0],[-100,0],[0,65],[0,-65],[150,-20]]) {
    await page.mouse.move(start.x+dx,start.y+dy,{steps:4});
    if(!(await snap()).blocked){accepted=true;break;}
  }
  expect(accepted).toBe(true);await page.mouse.up();
  await expect.poll(async()=>(await snap()).phase).toBe('idle');
  const after=(await snap()).targets.find(t=>t.uid===before.uid);
  expect(Math.hypot(after.x-before.x,after.z-before.z)).toBeGreaterThan(0.05);
  await page.screenshot({path:info.outputPath('accepted-placement.png')});
  if(!(await snap()).enabled)await act('#tweezers-button');
  const next=point(after);await page.mouse.move(next.x,next.y);await page.mouse.down();
  await expect.poll(async()=>(await snap()).phase).toBe('dragging');
  let rejected=false;
  for(const stone of (await snap()).targets.filter(t=>t.species==='stone')) {
    const target=point(stone);
    for(const [dx,dy] of [[0,0],[0,35],[0,-35],[-40,0],[40,0]]) {
      await page.mouse.move(target.x+dx,target.y+dy,{steps:3});
      if((await snap()).blocked){rejected=true;break;}
    }
    if(rejected)break;
  }
  expect(rejected).toBe(true);await page.screenshot({path:info.outputPath('rejected-collision.png')});
  await page.keyboard.press('Escape');await page.mouse.up();
  const final=(await snap()).targets.find(t=>t.uid===before.uid);
  expect([final.x,final.z]).toEqual([after.x,after.z]);
  expect(await page.evaluate(()=>calls)).toEqual([]);
});
