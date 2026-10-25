import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

test('Original eye geometry, all views, receptors and continuous accommodation', () => {
  const result = execFileSync('node', ['modelle/sinnblick/tests/check_eye.cjs'], { encoding: 'utf8' });
  assert.equal(JSON.parse(result).result, 'PASS');
  console.log(result.trim());
});
test('All ear models: valid labelled geometry and finite animation at sound extremes', () => {
  const c = vm.createContext({ console }); c.window = c;
  for (const name of ['three.min.js', 'content.js', 'bone-geometry.js', 'models.js']) {
    vm.runInContext(readFileSync(`modelle/sinnblick/ear/${name}`, 'utf8'), c);
  }
  const views = { overview: () => c.EarModels.buildOverview() };
  for (const [name, builder] of Object.entries({ ...c.EarBuilders, ...c.EarFineBuilders })) {
    views[name] = () => { const root = new c.THREE.Group(), kit = c.EarModels.kit('ear', root); return { root, kit, ...builder(kit) }; };
  }
  assert.deepEqual(Object.keys(views).sort(), ['overview','outer','middle','cochlea','hair','ossicles','nerve','balance','pressure'].sort());
  let meshes = 0;
  for (const [name, build] of Object.entries(views)) {
    const view = build();
    assert.ok(view.kit.meshes.length > 0, name);
    for (const soundOn of [false, true]) for (const amplitude of [0, .65, 1]) for (const pitch of [0, .54, 1]) {
      view.animate?.({ soundOn, amplitude, pitch, phase: 1.3, elapsed: 1200 });
      view.root.updateMatrixWorld(true);
      for (const mesh of view.kit.meshes) {
        assert.ok(mesh.userData.part, name);
        assert.ok(mesh.geometry.attributes.position.array.every(Number.isFinite), name);
        assert.ok(mesh.matrixWorld.elements.every(Number.isFinite), name);
      }
    }
    if (name === 'balance') assert.equal(view.animate, null, 'balance does not respond to sound');
    if (name === 'ossicles') assert.equal(Object.keys(view.kit.groups).length, 11);
    meshes += view.kit.meshes.length;
  }
  console.log(`Ear: ${Object.keys(views).length} views, ${meshes} meshes, 18 sound states per view`);
});
