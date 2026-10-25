// SCORM 1.2 only. Never read identity, scores, responses or suspend_data.
const methods = ['LMSInitialize', 'LMSFinish', 'LMSGetValue', 'LMSSetValue', 'LMSCommit', 'LMSGetLastError'];
const successful = value => value === true || value === 'true';

export function findApi(host) {
  const seen = new Set();
  function parents(start) {
    let current = start;
    for (let depth = 0; current && depth < 100 && !seen.has(current); depth++) {
      seen.add(current);
      try {
        const api = current.API;
        if (api && methods.every(name => typeof api[name] === 'function')) return api;
      } catch { /* Cross-origin windows must not prevent checking an accessible opener. */ }
      try {
        const parent = current.parent;
        if (!parent || parent === current) break;
        current = parent;
      } catch { break; }
    }
    return null;
  }
  const parentApi = parents(host);
  if (parentApi) return parentApi;
  try { return parents(host.opener); } catch { return null; }
}

export function createSession(host, changed = () => {}) {
  let api, active = false, ended = false;
  let state = { phase: 'idle', error: null };
  const publish = (phase, error = null) => { state = { phase, error }; changed({ ...state }); };
  function call(name, ...args) {
    try {
      const value = api[name](...args);
      const error = String(api.LMSGetLastError());
      return { value, ok: error === '0', error: error === '0' ? null : `${name}: ${error}` };
    } catch { return { value: 'false', ok: false, error: `${name}: exception` }; }
  }
  function commit() {
    if (!active) return false;
    const result = call('LMSCommit', '');
    if (!result.ok || !successful(result.value)) {
      publish('error', result.error || 'LMSCommit: false'); return false;
    }
    return true;
  }
  function initialize({ restore = false } = {}) {
    if (active) return true;
    if (ended && !restore) return false;
    api = findApi(host);
    if (!api) { publish('unavailable'); return false; }
    const init = call('LMSInitialize', '');
    if (!init.ok || !successful(init.value)) { publish('error', init.error || 'LMSInitialize: false'); return false; }
    active = true; ended = false;
    // SCORM 1.2 can otherwise default an unreported first attempt to completed.
    // Only mark it incomplete. Never synthesize completed/passed/failed or a score.
    const status = call('LMSGetValue', 'cmi.core.lesson_status');
    if (!status.ok) { publish('error', status.error); return true; }
    if (status.value === 'not attempted' || status.value === '') {
      const set = call('LMSSetValue', 'cmi.core.lesson_status', 'incomplete');
      if (!set.ok || !successful(set.value)) { publish('error', set.error || 'LMSSetValue: false'); return true; }
      if (!commit()) return true;
    } else if (!['incomplete', 'completed', 'passed', 'failed', 'browsed'].includes(status.value)) {
      publish('error', 'LMSGetValue: unexpected lesson_status'); return true;
    }
    publish('active'); return true;
  }
  function finish() {
    if (!active) return ended;
    const saved = commit();
    const result = call('LMSFinish', '');
    if (!result.ok || !successful(result.value)) {
      publish('error', result.error || 'LMSFinish: false'); return false;
    }
    active = false; ended = true;
    publish('finished', saved ? null : state.error); return true;
  }
  return { initialize, commit, finish, isActive: () => active, status: () => ({ ...state }) };
}

export function bindLifecycle(host, session) {
  let restore = false;
  const hidden = () => { if (host.document.visibilityState === 'hidden') session.commit(); };
  const hide = event => { restore = Boolean(event.persisted && session.isActive()); session.finish(); };
  const show = event => { if (event.persisted && restore) { restore = false; session.initialize({ restore: true }); } };
  host.document.addEventListener('visibilitychange', hidden);
  host.addEventListener('pagehide', hide);
  host.addEventListener('pageshow', show);
  return () => {
    host.document.removeEventListener('visibilitychange', hidden);
    host.removeEventListener('pagehide', hide);
    host.removeEventListener('pageshow', show);
  };
}
