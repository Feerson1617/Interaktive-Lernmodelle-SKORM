import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryStorage} from '../aquarium/classroom-storage.mjs';
test('RAM adapter implements Aquarium enumeration, strings, deletion and isolated sessions',()=>{
  const first=createMemoryStorage(),second=createMemoryStorage();
  first.setItem('mission',12);first.setItem('notes','Antwort');
  assert.equal(first.getItem('mission'),'12');assert.equal(first.length,2);
  assert.deepEqual(Object.keys(first),['mission','notes']);assert.equal(first.key(1),'notes');
  assert.equal(second.getItem('notes'),null);first.removeItem('mission');assert.equal(first.key(0),'notes');
  first.clear();assert.equal(first.length,0);assert.equal(first.key(0),null);
});
