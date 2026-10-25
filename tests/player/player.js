// Independent test double: deliberately completes an unreported first attempt on Finish.
const params = new URLSearchParams(location.search);
window.calls = [];
window.lessonStatus = params.get('status') || 'not attempted';
window.activeSession = false;
let lastError = '0';
const fail = params.get('fail');
const record = (method, args) => { calls.push([method, ...args]); lastError = '0'; };
function failure(method) {
  if (fail === method) { lastError = '101'; return true; }
  return false;
}
window.API = {
  LMSInitialize(arg) {
    record('LMSInitialize', [arg]);
    if (failure('init')) return 'false';
    if (activeSession) { lastError = '101'; return 'false'; }
    activeSession = true; return 'true';
  },
  LMSGetValue(key) {
    record('LMSGetValue', [key]);
    if (failure('get')) return '';
    if (!activeSession || key !== 'cmi.core.lesson_status') { lastError = '401'; return ''; }
    return lessonStatus;
  },
  LMSSetValue(key, value) {
    record('LMSSetValue', [key, value]);
    if (failure('set')) return 'false';
    if (!activeSession || key !== 'cmi.core.lesson_status' || value !== 'incomplete') { lastError = '401'; return 'false'; }
    lessonStatus = value; return 'true';
  },
  LMSCommit(arg) { record('LMSCommit', [arg]); return failure('commit') ? 'false' : String(activeSession); },
  LMSFinish(arg) {
    record('LMSFinish', [arg]); if (failure('finish')) return 'false';
    if (!activeSession) { lastError = '301'; return 'false'; }
    if (lessonStatus === 'not attempted') lessonStatus = 'completed';
    activeSession = false; return 'true';
  },
  LMSGetLastError() { return lastError; },
  LMSGetErrorString() { return 'Test player error'; },
  LMSGetDiagnostic() { return ''; }
};
const { launch } = await (await fetch('/package-config.json')).json();
document.getElementById('launch').onclick = () => window.open(launch, 'universal-scorm');
const mode = params.get('mode') || 'embedded';
if (mode !== 'popup') {
  const iframe = document.createElement('iframe'); iframe.name = 'sco'; iframe.id = 'sco'; iframe.title = 'Lernanwendung';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads');
  iframe.src = mode === 'nested' ? '/nested.html' : mode === 'cross-origin' ? 'https://127.0.0.1:4176' + launch : launch;
  document.getElementById('player').append(iframe);
}
