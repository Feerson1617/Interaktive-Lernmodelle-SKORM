import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, findApi, bindLifecycle } from '../runtime/session.js';

function mock(status = 'not attempted', fail = '') {
  let active = false, code = '0';
  const calls = [];
  const api = {
    LMSInitialize(arg) { calls.push(['LMSInitialize', arg]); code = fail === 'init' ? '101' : '0'; if (code !== '0') return 'false'; active = true; return 'true'; },
    LMSGetValue(key) { calls.push(['LMSGetValue', key]); code = fail === 'get' ? '101' : '0'; return status; },
    LMSSetValue(key, value) { calls.push(['LMSSetValue', key, value]); code = fail === 'set' ? '101' : '0'; if (code !== '0') return 'false'; status = value; return 'true'; },
    LMSCommit(arg) { calls.push(['LMSCommit', arg]); code = fail === 'commit' ? '101' : '0'; return String(code === '0'); },
    LMSFinish(arg) { calls.push(['LMSFinish', arg]); code = fail === 'finish' ? '101' : '0'; if (code !== '0') return 'false'; active = false; if (status === 'not attempted') status = 'completed'; return 'true'; },
    LMSGetLastError() { return code; }
  };
  return { api, calls, status: () => status, active: () => active };
}
const host = api => { const win = new EventTarget(); win.API = api; win.parent = win; win.document = new EventTarget(); return win; };
const count = (mock, method) => mock.calls.filter(call => call[0] === method).length;

test('SCORM initializes once, prevents default completion and finishes once without a score', () => {
  const m = mock(), session = createSession(host(m.api));
  assert.equal(session.initialize(), true); assert.equal(session.initialize(), true);
  assert.equal(session.finish(), true); assert.equal(session.finish(), true);
  assert.equal(count(m, 'LMSInitialize'), 1); assert.equal(count(m, 'LMSFinish'), 1);
  assert.equal(m.status(), 'incomplete');
  assert.deepEqual(m.calls.filter(c => c[0] === 'LMSSetValue'), [['LMSSetValue', 'cmi.core.lesson_status', 'incomplete']]);
  assert.deepEqual(m.calls.filter(c => c[0] === 'LMSGetValue'), [['LMSGetValue', 'cmi.core.lesson_status']]);
  assert.equal(session.initialize(), false);
});
for (const initial of ['incomplete', 'completed', 'passed', 'failed', 'browsed']) test(`Preserves existing LMS status: ${initial}`, () => {
  const m = mock(initial), session = createSession(host(m.api)); session.initialize(); session.finish();
  assert.equal(m.status(), initial); assert.equal(count(m, 'LMSSetValue'), 0);
});
for (const fail of ['init', 'get', 'set', 'commit', 'finish']) test(`SCORM reports ${fail} failure without unhandled exceptions or fabricated success`, () => {
  const m = mock('not attempted', fail), session = createSession(host(m.api));
  session.initialize(); if (fail === 'finish') session.finish();
  assert.equal(session.status().phase, 'error');
  assert.match(session.status().error, /101/);
  if (fail === 'init') { session.finish(); assert.equal(count(m, 'LMSFinish'), 0); }
  assert.ok(m.calls.every(c => c[0] !== 'LMSSetValue' || c[2] === 'incomplete'));
});
test('Finds API in current window, ancestors, opener and opener ancestors', () => {
  const m = mock();
  const top = host(m.api), opener = host(null); opener.parent = top;
  assert.equal(findApi(top), m.api);
  assert.equal(findApi({ parent: top }), m.api);
  assert.equal(findApi({ opener: top }), m.api);
  assert.equal(findApi({ opener }), m.api);
});
test('Inaccessible parents, closed openers, loops and excessive nesting terminate safely', () => {
  const m = mock(), top = host(m.api);
  const denied = { get API() { throw new Error('SecurityError'); }, get parent() { throw new Error('SecurityError'); }, opener: top };
  assert.equal(findApi(denied), m.api);
  const cycle = {}; cycle.parent = cycle; assert.equal(findApi(cycle), null);
  assert.equal(findApi({ get opener() { throw new Error('closed'); } }), null);
  let deep = top; for (let i = 0; i < 110; i++) deep = { parent: deep };
  assert.equal(findApi(deep), null);
  assert.equal(findApi({ API: { LMSInitialize() {} } }), null);
});
test('Unavailable API supports an explicit retry once it becomes accessible', () => {
  const win = host(null), session = createSession(win); assert.equal(session.initialize(), false);
  assert.equal(session.status().phase, 'unavailable'); win.API = mock().api;
  assert.equal(session.initialize(), true); assert.equal(session.status().phase, 'active');
});
test('A throwing API is reported and never breaks the game', () => {
  const m = mock(); m.api.LMSInitialize = () => { throw new Error('LMS failure'); };
  const session = createSession(host(m.api)); assert.equal(session.initialize(), false);
  assert.equal(session.status().phase, 'error'); assert.match(session.status().error, /exception/);
});
test('Visibility commits, pagehide finishes, cached return reinitializes, duplicate close is harmless', () => {
  const m = mock(), win = host(m.api), session = createSession(win);
  const unbind = bindLifecycle(win, session); session.initialize();
  win.document.visibilityState = 'hidden'; win.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(count(m, 'LMSFinish'), 0); assert.equal(count(m, 'LMSCommit'), 2);
  const hide = new Event('pagehide'); hide.persisted = true; win.dispatchEvent(hide);
  assert.equal(count(m, 'LMSFinish'), 1);
  const show = new Event('pageshow'); show.persisted = true; win.dispatchEvent(show);
  assert.equal(count(m, 'LMSInitialize'), 2); assert.equal(session.isActive(), true);
  session.finish(); win.dispatchEvent(hide); assert.equal(count(m, 'LMSFinish'), 2);
  unbind(); win.dispatchEvent(show); assert.equal(count(m, 'LMSInitialize'), 2);
});
