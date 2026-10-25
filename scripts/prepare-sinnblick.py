"""Prepare only Sinnblick's runtime files; the universal SCORM builder is unchanged."""
from pathlib import Path
import re
import shutil
from html import escape

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'modelle/sinnblick'
OUTPUT = ROOT / '.build/sinnblick-web'
RUNTIME = {
    '': ('index.html', 'styles.css', 'app.js', 'three.min.js', 'THREE-LICENSE.txt'),
    'eye': ('index.html', 'styles.css', 'app.js', 'bridge.js', 'three.min.js', 'THREE-LICENSE.txt'),
    'ear': ('index.html', 'styles.css', 'app.js', 'bridge.js', 'content.js', 'models.js',
            'bone-geometry.js', 'three.min.js', 'THREE-LICENSE.txt'),
}


def replace_once(text, before, after):
    if text.count(before) != 1:
        raise ValueError(f'Sinnblick source changed; review integration: {before[:90]}')
    return text.replace(before, after, 1)


def prepare():
    shutil.rmtree(OUTPUT, ignore_errors=True)
    for folder, names in RUNTIME.items():
        (OUTPUT / folder).mkdir(parents=True, exist_ok=True)
        for name in names:
            shutil.copyfile(SOURCE / folder / name, OUTPUT / folder / name)
    def edit(name, transform):
        path = OUTPUT / name
        path.write_text(transform(path.read_text(encoding='utf-8')), encoding='utf-8')
    # Same isolated applications, now individually auditable local documents.
    edit('index.html', lambda s: replace_once(replace_once(s,
         '<script src="modules.js"></script>', ''), '</head>',
         '<link rel="stylesheet" href="integration/layout.css"></head>'))
    edit('app.js', lambda s: replace_once(s, 'f.srcdoc=window.SenseModules[id];',
         "f.src=({eye:'eye/index.html',ear:'ear/index.html'})[id];"))
    # Hook inside the existing navigation closure, without exposing model state.
    hook = (SOURCE / 'integration/lifecycle.js').read_text(encoding='utf-8')
    edit('app.js', lambda s: replace_once(s, 'setup();\n})();', hook + '\nsetup();\n})();'))
    for organ in ('eye', 'ear'):
        edit(f'{organ}/bridge.js', lambda s: replace_once(s,
             "if(e.data.action==='pause'){paused=true;callbacks.pause();}",
             "if(e.data.action==='pause'){paused=true;callbacks.pause();}\n"
             " if(e.data.action==='resume'){paused=false;barrier();callbacks.resume?.();}"))
        edit(f'{organ}/index.html', lambda s: replace_once(s, '</head>',
             '<link rel="stylesheet" href="../integration/touch.css"></head>'))
    edit('eye/app.js', lambda s: replace_once(s, 'bridge.ready({activate()',
         'bridge.ready({resume(){resize();lastDrawTime=0;requestDraw();},activate()'))
    # The original 38px label spacing would overlap 44px touch targets.
    edit('eye/app.js', lambda s: replace_once(replace_once(s, 'spacing=38;',
         'spacing=Math.max(38,...items.map(p=>p.node.offsetHeight+6));'),
         'endY=y+16;', 'endY=y+p.node.offsetHeight/2;'))
    # Preserve citation titles and URLs, without outbound navigation in the SCO.
    def citations(html):
        html, count = re.subn(r'<a href="(https://[^"]+)" target="_blank" rel="noopener noreferrer">(.*?)</a>',
            lambda m: '<span class="source-citation">' + m[2] +
                      '<small>' + escape(m[1]) + '</small></span>', html)
        if count != 8:
            raise ValueError('Review changed eye citations')
        return replace_once(html, 'Quellenlinks benötigen Internet; das Modell selbst nicht.',
                            'Quellen sind als Literaturangaben aufgeführt; das Modell läuft ohne Internet.')
    edit('eye/index.html', citations)
    edit('ear/app.js', lambda s: replace_once(s,
         "a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=s.title;",
         "a=document.createElement('span');a.className='source-citation';a.textContent=s.title;const url=document.createElement('small');url.textContent=s.url;a.append(url);"))
    edit('ear/index.html', lambda s: replace_once(s, 'Nur die Quellenlinks benötigen Internet.',
         'Quellen sind als Literaturangaben aufgeführt.'))
    (OUTPUT / 'integration').mkdir()
    for name in ('layout.css', 'touch.css'):
        shutil.copyfile(SOURCE / 'integration' / name, OUTPUT / 'integration' / name)
    print(f'Sinnblick: prepared {len(list(OUTPUT.rglob("*.*")))} local runtime files in {OUTPUT}')


if __name__ == '__main__':
    prepare()
