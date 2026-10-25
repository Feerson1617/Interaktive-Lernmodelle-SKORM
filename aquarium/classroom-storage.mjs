/** Aquarium-only storage. Never reads or modifies browser storage. */
export function createMemoryStorage() {
  const values = new Map();
  const api = {
    getItem: key => values.get(String(key)) ?? null,
    setItem: (key, value) => { values.set(String(key), String(value)); },
    removeItem: key => { values.delete(String(key)); },
    clear: () => values.clear(),
    key: index => [...values.keys()][index] ?? null,
    get length() { return values.size; }
  };
  return new Proxy(api, {
    ownKeys: () => [...values.keys()],
    getOwnPropertyDescriptor: (_, key) => values.has(key) ? { enumerable: true, configurable: true, value: values.get(key) } : undefined
  });
}
export const aquariumStorage = globalThis.parent !== globalThis && globalThis.parent?.aquariumClassroomStorage;
if (typeof document !== 'undefined' && location.pathname.endsWith('/index.html')) {
  if (!aquariumStorage) throw Error('Aquarium requires its classroom host');
  const disabled = [
    '[data-single="export"]','[data-single="raw-export"]','[data-single="archive-file"]','[data-single="load"]',
    '[data-class="export"]','[data-class="raw-export"]','[data-class="archive-file"]','[data-class="load"]',
    '[data-act="save"]','[data-act="export"]','[data-act="import"]','[data-act="notes-export"]','[data-act="download-html"]',
    '[download]','input[type="file"]',
    '[data-learning-export]','[data-learning-import]','[data-learning-export-csv]',
    ...['export','export-text','config-export','csv','csv-all','imported-csv','imported-csv-all','manual-csv','imported-manual-csv','chart','manual-chart'].map(action => `[data-learn="${action}"]`)
  ].join(',');
  const remove = () => document.querySelectorAll(disabled).forEach(node => node.remove());
  new MutationObserver(remove).observe(document.documentElement, {childList: true, subtree: true});
  document.addEventListener('click', event => {
    const target = event.target.closest?.(disabled);
    const link = event.target.closest?.('a');
    if (target || link && !['data:', 'blob:'].includes(new URL(link.href).protocol) && new URL(link.href).origin !== location.origin) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  remove();
}
