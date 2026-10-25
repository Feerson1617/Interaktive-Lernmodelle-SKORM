"""Package a ready-to-serve application; preserve every original relative path."""
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile
from xml.sax.saxutils import escape, quoteattr
import zipfile
from validate import ROOT, validate_package, canonical

MARKERS = ('SCORM-CONTEXT', 'SCORM-WRAPPER')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_zip(files, output):
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compresslevel=9)


def build(config_file, runtime):
    config_file = Path(config_file).resolve()
    config = json.loads(config_file.read_text())
    allowed = {'name', 'description', 'sourceDir', 'entry', 'output', 'classroomMode', 'classroomAdapter'}
    if set(config) - allowed: raise ValueError('Unknown configuration fields')
    for key in ('name', 'description', 'sourceDir', 'entry', 'output'):
        if not isinstance(config.get(key), str) or not config[key].strip(): raise ValueError(f'Missing {key}')
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*\.zip', config['output']): raise ValueError('output must be a simple .zip filename')
    mode = config.get('classroomMode', False)
    if type(mode) is not bool: raise ValueError('classroomMode must be boolean')
    adapter = config.get('classroomAdapter')
    if mode and not adapter: raise ValueError('Classroom mode requires an explicit application-owned adapter')
    source = config_file.parent / config['sourceDir']
    if source.is_symlink() or not source.is_dir(): raise ValueError('sourceDir must be a directory, not a symlink')
    files = {}
    for path in sorted(source.rglob('*')):
        name = path.relative_to(source).as_posix()
        if path.is_symlink(): raise ValueError(f'Symlinks are not packaged: {name}')
        if path.is_dir():
            if path.name in {'.git', 'node_modules'}: raise ValueError('Use a built web output directory, not a development checkout')
            continue
        if any(part.startswith('.') for part in Path(name).parts): raise ValueError(f'Hidden source file: {name}')
        if name == 'imsmanifest.xml' or name.startswith('__scorm/') or name in {p.name for p in (ROOT / 'schemas').iterdir()}:
            raise ValueError(f'Reserved package path: {name}')
        canonical(name)
        files[name] = path.read_bytes()
    entry = canonical(config['entry'])
    if entry not in files or not entry.lower().endswith('.html'): raise ValueError('Missing HTML entry')
    if adapter:
        adapter = canonical(adapter)
        if adapter not in files: raise ValueError('Missing classroom adapter')
        # The adapter is application code, loaded by the application itself. No storage patching.
    originals = {name: sha(data) for name, data in files.items()}
    html = files[entry].decode('utf-8')
    if any(marker in html for marker in MARKERS) or 'id="scorm-session"' in html:
        raise ValueError('Source is already SCORM-wrapped or uses reserved toolbar IDs')
    if len(re.findall(r'<head\b[^>]*>', html, re.I)) != 1 or len(re.findall(r'<body\b[^>]*>', html, re.I)) != 1:
        raise ValueError('Entry needs explicit, unique head and body elements')
    context = json.dumps({'classroomMode': mode, 'classroomAdapter': adapter}, ensure_ascii=True).replace('<', '\\u003c')
    head = f'<!-- SCORM-CONTEXT-START --><script>Object.defineProperty(window,"SCORM_CONTEXT",{{value:Object.freeze({context}),writable:false,configurable:false}});</script><!-- SCORM-CONTEXT-END -->'
    toolbar = (ROOT / 'runtime/toolbar.html').read_text()
    script = re.sub(r'</script', r'<\\/script', runtime, flags=re.I)
    body = f'<!-- SCORM-WRAPPER-START -->\n{toolbar}<script>{script}</script>\n<!-- SCORM-WRAPPER-END -->'
    html = re.sub(r'(<head\b[^>]*>)', lambda m: m[1] + head, html, count=1, flags=re.I)
    html = re.sub(r'(<body\b[^>]*>)', lambda m: m[1] + body, html, count=1, flags=re.I)
    files[entry] = html.encode('utf-8')
    for record in json.loads((ROOT / 'schemas/sources.json').read_text()):
        files[record['file']] = (ROOT / 'schemas' / record['file']).read_bytes()
    files['__scorm/THIRD-PARTY-NOTICES.txt'] = (ROOT / 'THIRD-PARTY-NOTICES.txt').read_bytes()
    files['__scorm/package-info.json'] = (json.dumps({
        'format': 'SCORM 1.2', 'template_version': 1, 'name': config['name'], 'description': config['description'],
        'launch': entry, 'classroomMode': mode, 'classroomAdapter': adapter, 'source_sha256': originals,
        'data_policy': {'scores': False, 'answers': False, 'completion': False, 'new_attempt_status': 'incomplete'}
    }, ensure_ascii=False, indent=2) + '\n').encode()
    file_nodes = '\n'.join(f'      <file href={quoteattr(name)}/>' for name in sorted(files))
    title = escape(config['name'])
    files['imsmanifest.xml'] = f'''<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="SCORM-UNIVERSAL" version="1.0"
 xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
 xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
 <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
 <organizations default="ORG"><organization identifier="ORG" structure="hierarchical">
  <title>{title}</title><item identifier="ITEM" identifierref="SCO" isvisible="true"><title>{title}</title></item>
 </organization></organizations>
 <resources><resource identifier="SCO" type="webcontent" adlcp:scormtype="sco" href={quoteattr(entry)}>
{file_nodes}
 </resource></resources>
</manifest>
'''.encode()
    output_dir = ROOT / 'dist'
    output_dir.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output_dir) as temporary:
        candidate = Path(temporary) / config['output']
        write_zip(files, candidate)
        report = validate_package(candidate)
        destination = output_dir / config['output']
        candidate.replace(destination)
        (output_dir / (config['output'] + '.validation.json')).write_text(json.dumps(report, indent=2) + '\n')
    print(f'Validated: {destination} ({destination.stat().st_size} bytes)')


if __name__ == '__main__':
    build(sys.argv[1], sys.stdin.read())
