import {createMemoryStorage} from './classroom-storage.mjs';
window.aquariumClassroomStorage = createMemoryStorage();
let frame = null, switching = false;
const retired = [];
const entry = new URL('./index.html', location.href);
function show(href, fromHistory = false) {
  const next = new URL(href, entry);
  if (next.origin !== entry.origin || next.pathname !== entry.pathname || switching) return false;
  switching = true;
  try {
    if (frame) {
      const win = frame.contentWindow;
      if (win.aquariumPrepareNavigation?.() === false) return false;
      const stopped = win.aquariumStandaloneLifecycle?.stop();
      if (stopped) { retired.push(stopped); if (retired.length > 30) retired.shift(); }
      frame.remove();
    }
    frame = document.createElement('iframe');
    frame.id = 'aquarium-view'; frame.title = 'Aquarium Unterricht'; frame.src = next.href;
    document.body.append(frame);
    if (!fromHistory) history[history.state?.aquariumRoute ? 'pushState' : 'replaceState']({aquariumRoute:next.href},'', '#aquarium='+encodeURIComponent(next.search));
    return true;
  } finally { switching = false; }
}
window.aquariumStandaloneNavigate = href => setTimeout(() => show(href), 0);
window.aquariumClassroomSnapshot = () => ({frames: document.querySelectorAll('iframe').length, retired: [...retired], resources: frame?.contentWindow.aquariumStandaloneLifecycle?.snapshot()});
// A cached host must never resurrect a previous pupil's session.
addEventListener('pagehide', () => { frame?.contentWindow.aquariumStandaloneLifecycle?.stop(); window.aquariumClassroomStorage.clear(); });
addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
addEventListener('popstate', event => show(event.state?.aquariumRoute || entry.href, true));
show(entry.href);
