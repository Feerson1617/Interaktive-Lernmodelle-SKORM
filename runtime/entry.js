import { createSession, bindLifecycle } from './session.js';

// No application selectors or persistence overrides: arbitrary HTML remains independent.
function boot() {
  const toolbar = document.getElementById('scorm-session');
  const message = document.getElementById('scorm-message');
  const button = document.getElementById('scorm-exit');
  const disabled = new Map();
  const session = createSession(window, status => {
    toolbar.dataset.state = status.phase;
    button.disabled = status.phase === 'finished';
    button.textContent = status.phase === 'unavailable' || status.phase === 'error' && !session.isActive()
      ? 'Verbindung erneut prüfen' : 'Sitzung beenden';
    if (status.phase === 'finished') {
      for (const child of document.body.children) {
        if (child !== toolbar && !['SCRIPT', 'STYLE'].includes(child.tagName)) {
          if (!disabled.has(child)) disabled.set(child, child.inert);
          child.inert = true;
        }
      }
    } else {
      for (const [child, inert] of disabled) child.inert = inert;
      disabled.clear();
    }
    message.textContent = ({
      active: 'Verbindung zur Lernplattform ist aktiv.',
      unavailable: 'Keine Verbindung zur Lernplattform. Die Anwendung bleibt nutzbar.',
      error: 'Die Lernplattform meldet ein Verbindungsproblem. Die Anwendung bleibt nutzbar.',
      finished: status.error ? 'Sitzung beendet. Die Lernplattform hat zuvor einen Speicherfehler gemeldet.' : 'Sitzung beendet. Du kannst den SCORM-Player schließen.'
    })[status.phase] || '';
    window.dispatchEvent(new CustomEvent('scorm:session', { detail: Object.freeze({ ...status }) }));
  });
  button.addEventListener('click', () => session.isActive() ? session.finish() : session.initialize({ restore: true }));
  bindLifecycle(window, session);
  session.initialize();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
