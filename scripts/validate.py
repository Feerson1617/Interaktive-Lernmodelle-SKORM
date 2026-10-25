"""Offline validator for this single-SCO profile, with no Sinneslabor dependencies."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import struct
import subprocess
import tempfile
from urllib.parse import unquote, urlsplit
import zipfile
from lxml import etree
import tinycss2

ROOT = Path(__file__).resolve().parents[1]
CP = 'http://www.imsproject.org/xsd/imscp_rootv1p1p2'
ADL = 'http://www.adlnet.org/xsd/adlcp_rootv1p2'
XSI = 'http://www.w3.org/2001/XMLSchema-instance'
NS = {'cp': CP, 'adlcp': ADL}
LIMIT = 2048 * 1024 * 1024


def canonical(name):
    if not isinstance(name, str) or not name or '\\' in name or '%' in name or any(ord(c) < 32 for c in name):
        raise ValueError(f'Unsafe package path: {name!r}')
    parts = urlsplit(name)
    if parts.scheme or parts.netloc or parts.query or parts.fragment or str(PurePosixPath(name)) != name or name.startswith('/') or '..' in PurePosixPath(name).parts:
        raise ValueError(f'Unsafe package path: {name!r}')
    return name


def resolve_ref(value, base, files, module=False):
    if not value or value.startswith(('#', 'data:', 'blob:')): return
    url = urlsplit(value)
    path = unquote(url.path)
    if url.scheme or url.netloc or path.startswith('/') or '\\' in path:
        raise ValueError(f'External or root-relative resource in {base}: {value}')
    if module and not value.startswith(('./', '../')):
        raise ValueError(f'Bare module import in {base}: {value}; bundle or use relative module paths')
    target = posixpath.normpath(posixpath.join(posixpath.dirname(base), path)) if path else base
    canonical(target)
    if target not in files: raise ValueError(f'Missing resource in {base}: {value} -> {target}')


class HTMLResources(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paths, self.styles, self.scripts = [], [], []
        self.tag = None
        self.script_type = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'base': raise ValueError('base is not supported; use relative paths')
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'refresh': raise ValueError('Meta refresh is not a local resource')
        if tag == 'script' and attrs.get('type') == 'importmap': raise ValueError('Bundle import maps or use relative module imports')
        for key in ('src', 'href', 'poster', 'data', 'action', 'xlink:href'):
            if attrs.get(key): self.paths.append(attrs[key])
        if attrs.get('srcset'):
            if 'data:' in attrs['srcset']: raise ValueError('Use a local file for data: srcset entries')
            self.paths += [item.strip().split()[0] for item in attrs['srcset'].split(',') if item.strip()]
        if attrs.get('style'): self.styles.append(attrs['style'])
        for key, value in attrs.items():
            if key.startswith('on') and value: self.scripts.append(('function handler(event){' + value + '}', False))
        if tag in ('style', 'script'):
            self.tag = tag
            self.script_type = attrs.get('type', '')

    def handle_endtag(self, tag):
        if tag == self.tag: self.tag = None

    def handle_data(self, data):
        if self.tag == 'style': self.styles.append(data)
        if self.tag == 'script' and self.script_type in ('', 'module', 'text/javascript', 'application/javascript'):
            self.scripts.append((data, self.script_type == 'module'))


def css_refs(source):
    found = []
    def visit(tokens):
        for index, token in enumerate(tokens):
            if token.type == 'error': raise ValueError('Invalid CSS resource syntax')
            if token.type == 'url': found.append(token.value)
            if token.type == 'function' and token.lower_name == 'url':
                found.append(tinycss2.serialize(token.arguments).strip().strip('\'"'))
            if token.type == 'at-keyword' and token.lower_value == 'import':
                first = next((v for v in tokens[index + 1:] if v.type not in ('whitespace', 'comment')), None)
                if first and first.type == 'string': found.append(first.value)
            for attr in ('content', 'arguments', 'prelude'):
                if getattr(token, attr, None): visit(getattr(token, attr))
    # Component tokens also accept declarations in an HTML style attribute.
    visit(tinycss2.parse_component_value_list(source, skip_comments=True))
    return found


def inspect_resources(files, launch):
    scripts = []
    for name, data in files.items():
        suffix = PurePosixPath(name).suffix.lower()
        refs = []
        if suffix in ('.html', '.htm', '.svg'):
            html = HTMLResources(); html.feed(data.decode('utf-8'))
            refs += html.paths
            for css in html.styles: refs += css_refs(css)
            scripts += [{'path': name, 'document': name, 'code': code, 'module': module} for code, module in html.scripts]
        elif suffix == '.css': refs += css_refs(data.decode('utf-8'))
        elif suffix in ('.js', '.mjs'):
            # Parse as a module (a superset for the distributed JS used here).
            scripts.append({'path': name, 'document': launch, 'code': data.decode('utf-8'), 'module': True})
        elif suffix in ('.gltf', '.glb'):
            if suffix == '.glb':
                if len(data) < 20: raise ValueError(f'Truncated GLB: {name}')
                magic, version, size, length, kind = struct.unpack_from('<4sIIII', data)
                if magic != b'glTF' or version != 2 or size != len(data) or kind != 0x4E4F534A or length > len(data) - 20:
                    raise ValueError(f'Invalid GLB header: {name}')
                model = json.loads(data[20:20 + length])
            else: model = json.loads(data)
            refs += [item['uri'] for key in ('buffers', 'images') for item in model.get(key, []) if 'uri' in item]
        for reference in refs: resolve_ref(reference, name, files)
    audit = subprocess.run(['node', str(ROOT / 'scripts/audit-js.mjs')], input=json.dumps(scripts), text=True, capture_output=True, check=True)
    result = json.loads(audit.stdout)
    for item in result['references']: resolve_ref(item['value'], item['base'], files, item['kind'] == 'module')
    return result['dynamic']


def validate_package(filename, extract=None):
    filename = Path(filename)
    if filename.stat().st_size > LIMIT: raise ValueError('ZIP exceeds 2048 MB')
    with zipfile.ZipFile(filename) as archive:
        names = archive.namelist()
        if 'imsmanifest.xml' not in names: raise ValueError('imsmanifest.xml must be directly at ZIP root; no outer ZIP/folder')
        if len(names) != len(set(names)) or len(names) != len({name.casefold() for name in names}): raise ValueError('Duplicate/case-colliding ZIP entries')
        for name in names: canonical(name)
        if any((info.external_attr >> 16) & 0o170000 == 0o120000 for info in archive.infolist()): raise ValueError('Symlink in ZIP')
        if sum(info.file_size for info in archive.infolist()) > LIMIT: raise ValueError('Unpacked content exceeds 2048 MB')
        if archive.testzip(): raise ValueError('Corrupt ZIP')
        files = {name: archive.read(name) for name in names}
    parser = etree.XMLParser(resolve_entities=False, load_dtd=False, no_network=True)
    manifest = etree.fromstring(files['imsmanifest.xml'], parser)
    if manifest.getroottree().docinfo.doctype: raise ValueError('No manifest DTD permitted')
    schema = etree.XMLSchema(etree.parse(str(ROOT / 'schemas/validate.xsd'), parser))
    schema.assertValid(manifest)
    if manifest.tag != f'{{{CP}}}manifest': raise ValueError('Invalid CP namespace')
    if manifest.findtext('cp:metadata/cp:schema', namespaces=NS) != 'ADL SCORM' or manifest.findtext('cp:metadata/cp:schemaversion', namespaces=NS) != '1.2': raise ValueError('SCORM 1.2 required')
    orgs = manifest.find('cp:organizations', NS)
    if len(orgs) != 1 or orgs.get('default') != orgs[0].get('identifier'): raise ValueError('Unresolved organization')
    items = manifest.findall('.//cp:item', NS)
    resources = manifest.findall('cp:resources/cp:resource', NS)
    if len(resources) != 1 or len(items) != 1: raise ValueError('Expected one SCO/item')
    resource = resources[0]
    if resource.get('type') != 'webcontent' or resource.get(f'{{{ADL}}}scormtype') not in ('sco', 'asset') or items[0].get('identifierref') != resource.get('identifier'): raise ValueError('Invalid SCO reference')
    if any(not (node.findtext('cp:title', namespaces=NS) or '').strip() for node in [orgs[0], items[0]]): raise ValueError('Missing title')
    launch = canonical(resource.get('href', ''))
    if launch not in files or not launch.lower().endswith('.html'): raise ValueError('Missing HTML launch')
    refs = [node.get('href', '') for node in resource.findall('cp:file', NS)]
    if len(refs) != len(set(refs)) or set(refs) != set(files) - {'imsmanifest.xml'}: raise ValueError('Manifest must enumerate every resource exactly once')
    for ref in refs: canonical(ref)
    locations = manifest.get(f'{{{XSI}}}schemaLocation', '').split()
    if locations != [CP, 'imscp_rootv1p1p2.xsd', ADL, 'adlcp_rootv1p2.xsd']: raise ValueError('Invalid local schema locations')
    for record in json.loads((ROOT / 'schemas/sources.json').read_text()):
        if hashlib.sha256(files[record['file']]).hexdigest() != record['sha256']: raise ValueError('Modified standard schema')
    info = json.loads(files['__scorm/package-info.json'])
    if info.get('trackingMode', 'sco') != resource.get(f'{{{ADL}}}scormtype'): raise ValueError('Tracking mode mismatch')
    if info.get('trackingMode') == 'asset':
        if info['data_policy']['new_attempt_status'] is not None: raise ValueError('Asset cannot report status')
        wrapper = re.search(rb'<!-- SCORM-WRAPPER-START -->(.*?)<!-- SCORM-WRAPPER-END -->', files[launch], re.S)
        if not wrapper or wrapper[1].strip() != b'<script></script>': raise ValueError('Asset cannot contain SCO runtime')
    if info['launch'] != launch: raise ValueError('Launch metadata mismatch')
    for name, expected in info['source_sha256'].items():
        canonical(name)
        data = files[name]
        if name == launch:
            for marker in ('CONTEXT', 'WRAPPER'):
                pattern = rb'<!-- SCORM-' + marker.encode() + rb'-START -->.*?<!-- SCORM-' + marker.encode() + rb'-END -->'
                if len(re.findall(pattern, data, flags=re.S)) != 1: raise ValueError('Missing/duplicated SCORM integration marker')
                data = re.sub(pattern, b'', data, flags=re.S)
        if hashlib.sha256(data).hexdigest() != expected: raise ValueError(f'Application changed: {name}')
    dynamic = inspect_resources(files, launch)
    if extract:
        directory = Path(extract)
        if directory.exists() and any(directory.iterdir()): raise ValueError('Extract into a new/empty directory')
        directory.mkdir(parents=True, exist_ok=True)
        for name, data in files.items():
            path = directory / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    return {'status': 'passed', 'zip': filename.name, 'bytes': filename.stat().st_size, 'sha256': hashlib.sha256(filename.read_bytes()).hexdigest(),
            'launch': launch, 'files': sorted(files), 'xsd': True, 'source_files_unchanged': True,
            'dynamic_references_requiring_browser_coverage': dynamic,
            'limits': 'Static analysis cannot prove all computed URLs or persistence behavior; test each application in a browser and real LMS.'}


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('zip', nargs='?', default=str(ROOT / 'dist/Beispiel-SCORM-1.2.zip'))
    cli.add_argument('--extract'); cli.add_argument('--report')
    args = cli.parse_args()
    report = json.dumps(validate_package(args.zip, args.extract), indent=2) + '\n'
    if args.report: Path(args.report).write_text(report)
    print(report, end='')
