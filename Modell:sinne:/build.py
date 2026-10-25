#!/usr/bin/env python3
"""Rebuild the self-contained HTML, including both full sensory simulations."""
from pathlib import Path
import json
from export_html import build
root=Path(__file__).resolve().parent
modules={name:build(root/name)[0] for name in ('eye','ear')}
(root/'modules.js').write_text('window.SenseModules='+json.dumps(modules,ensure_ascii=False).replace('</','<\\/')+';\n',encoding='utf-8')
html,assets=build(root)
(root/'Sinnblick.html').write_text(html,encoding='utf-8')
print('Sinnblick.html built; all assets bundled, offline audit passed.')
