import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {once} from 'node:events';
test('unmodified normal Aquarium retains its original persistent save',async({page},info)=>{
  test.setTimeout(180000);
  const root=resolve(process.env.AQUARIUM_SOURCE || '.build/aquarium-source');
  const server=createServer(async(req,res)=>{
    try {
      const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(!path.startsWith(root+sep))throw Error('Invalid path');
      const data=await readFile(path);
      res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.webp':'image/webp'})[extname(path)]||'application/octet-stream');res.end(data);
    }catch{res.statusCode=404;res.end();}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await expect(page.locator('[data-single-mission]')).toHaveCount(6);
    await page.locator('[data-single=start]').press('Enter');
    await page.locator('[data-single=plant]').press('Enter');
    const key='aquarium-single-investigation-v1:m1-light-oxygen';
    const attempt=await page.evaluate(()=>aquariumLearningSnapshot().session.attemptId);
    const saved=await page.evaluate(k=>localStorage.getItem(k),key);expect(saved).toBeTruthy();
    await page.reload();await page.locator('[data-single=start]').press('Enter');
    expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
    expect(await page.evaluate(()=>aquariumLearningSnapshot().session.attemptId)).toBe(attempt);
    await expect(page.locator('canvas')).toHaveCount(1);await page.screenshot({path:info.outputPath('normal-original.png')});
    expect(errors).toEqual([]);
  }finally{await page.goto('about:blank');await new Promise(resolve=>server.close(resolve));}
});
