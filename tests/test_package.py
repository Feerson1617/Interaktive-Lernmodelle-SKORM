import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build import build, write_zip
from validate import ROOT, validate_package


class PackageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        source = cls.root / 'app'
        (source / 'pages').mkdir(parents=True)
        (source / 'js').mkdir()
        (source / 'pages/start.html').write_text('<!doctype html><html><head><title>Fixture</title></head><body><h1>Fixture</h1><script type="module" src="../js/main.js"></script></body></html>')
        (source / 'js/main.js').write_text("import {value} from './value.js'; const data = await import('./data.js'); fetch(new URL('../data.json', import.meta.url));")
        (source / 'js/value.js').write_text('export const value=1;')
        (source / 'js/data.js').write_text('export default {};')
        (source / 'data.json').write_text('{}')
        cls.config = {'name': 'A & B <Modell>', 'description': 'Test', 'sourceDir': 'app', 'entry': 'pages/start.html', 'output': 'unit-fixture.zip'}
        cls.config_path = cls.root / 'config.json'
        cls.config_path.write_text(json.dumps(cls.config))
        build(cls.config_path, 'void 0;')
        cls.output = ROOT / 'dist/unit-fixture.zip'
        with zipfile.ZipFile(cls.output) as archive: cls.original = {name: archive.read(name) for name in archive.namelist()}

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()
        cls.output.unlink(missing_ok=True)
        cls.output.with_suffix('.zip.validation.json').unlink(missing_ok=True)

    def check_files(self, files):
        path = self.root / 'candidate.zip'
        write_zip(files, path)
        return validate_package(path)

    def changed_source(self, name, content):
        files = copy.copy(self.original)
        files[name] = content.encode()
        info = json.loads(files['__scorm/package-info.json'])
        info['source_sha256'][name] = hashlib.sha256(files[name]).hexdigest()
        files['__scorm/package-info.json'] = json.dumps(info).encode()
        return files

    def test_nontracking_asset_and_runtime_rejection(self):
        path = self.root / 'asset.json'
        path.write_text(json.dumps({**self.config, 'trackingMode': 'asset'}))
        try:
            build(path, 'throw Error("SCO runtime must not execute")')
            with zipfile.ZipFile(self.output) as archive: files = {n: archive.read(n) for n in archive.namelist()}
            self.assertIn(b'scormtype="asset"', files['imsmanifest.xml'])
            self.assertNotIn(b'SCO runtime must not execute', files['pages/start.html'])
            self.check_files(files)
            files['pages/start.html'] = files['pages/start.html'].replace(b'<script></script>', b'<script>LMSCommit("")</script>')
            with self.assertRaisesRegex(ValueError, 'SCO runtime'): self.check_files(files)
        finally:
            build(self.config_path, 'void 0;')

    def test_valid_modules_nested_launch_and_xml_escaping(self):
        result = self.check_files(self.original)
        self.assertEqual(result['launch'], 'pages/start.html')
        self.assertTrue(result['xsd'])

    def test_reproducible_bytes(self):
        before = self.output.read_bytes()
        build(self.config_path, 'void 0;')
        self.assertEqual(before, self.output.read_bytes())

    def test_no_outer_folder(self):
        with self.assertRaisesRegex(ValueError, 'ZIP root'): self.check_files({'folder/' + name: value for name, value in self.original.items()})

    def test_no_zip_inside_zip(self):
        with self.assertRaisesRegex(ValueError, 'ZIP root'): self.check_files({'inner.zip': self.output.read_bytes()})

    def test_missing_asset(self):
        files = copy.copy(self.original); del files['data.json']
        with self.assertRaisesRegex(ValueError, 'enumerate'): self.check_files(files)

    def test_traversal(self):
        files = copy.copy(self.original); files['../escape'] = b''
        with self.assertRaisesRegex(ValueError, 'Unsafe'): self.check_files(files)

    def test_case_collision(self):
        files = copy.copy(self.original); files['DATA.JSON'] = b''
        with self.assertRaisesRegex(ValueError, 'colliding'): self.check_files(files)

    def test_xsd_required_resource_type(self):
        files = copy.copy(self.original); files['imsmanifest.xml'] = files['imsmanifest.xml'].replace(b' type="webcontent"', b'')
        with self.assertRaises(Exception): self.check_files(files)

    def test_scorm_version(self):
        files = copy.copy(self.original); files['imsmanifest.xml'] = files['imsmanifest.xml'].replace(b'<schemaversion>1.2', b'<schemaversion>2004')
        with self.assertRaisesRegex(ValueError, 'SCORM 1.2'): self.check_files(files)

    def test_changed_original_is_detected(self):
        files = copy.copy(self.original); files['data.json'] = b'{"changed":true}'
        with self.assertRaisesRegex(ValueError, 'Application changed'): self.check_files(files)

    def test_external_fetch(self):
        with self.assertRaisesRegex(ValueError, 'External'): self.check_files(self.changed_source('js/main.js', "fetch('https://example.invalid/data')"))

    def test_external_dynamic_import(self):
        with self.assertRaisesRegex(ValueError, 'External'): self.check_files(self.changed_source('js/main.js', "import('https://example.invalid/module.js')"))

    def test_root_relative_module(self):
        with self.assertRaisesRegex(ValueError, 'root-relative'): self.check_files(self.changed_source('js/main.js', "import '/js/value.js'"))

    def test_bare_module(self):
        with self.assertRaisesRegex(ValueError, 'Bare module'): self.check_files(self.changed_source('js/main.js', "import 'three'"))

    def test_missing_dynamic_module(self):
        with self.assertRaisesRegex(ValueError, 'Missing resource'): self.check_files(self.changed_source('js/main.js', "import('./absent.js')"))

    def test_dynamic_reference_is_reported_not_claimed_verified(self):
        result = self.check_files(self.changed_source('js/main.js', 'fetch(window.configuredURL)'))
        self.assertTrue(result['dynamic_references_requiring_browser_coverage'])

    def test_external_css_and_gltf(self):
        from validate import inspect_resources
        for files, launch in [({'style.css': b'@import "https://example.invalid/a.css";'}, 'index.html'),
                              ({'a.gltf': b'{"buffers":[{"uri":"https://example.invalid/a.bin"}]}'}, 'index.html')]:
            with self.subTest(files=list(files)), self.assertRaisesRegex(ValueError, 'External'): inspect_resources(files, launch)

    def test_missing_gltf_texture(self):
        from validate import inspect_resources
        with self.assertRaisesRegex(ValueError, 'Missing resource'): inspect_resources({'a.gltf': b'{"images":[{"uri":"missing.png"}]}'}, 'index.html')

    def test_symlink_rejected(self):
        link = self.root / 'app/link.js'; link.symlink_to('js/main.js')
        try:
            with self.assertRaisesRegex(ValueError, 'Symlinks'): build(self.config_path, '')
        finally: link.unlink()

    def test_classroom_mode_needs_explicit_adapter(self):
        config = {**self.config, 'classroomMode': True}
        path = self.root / 'bad.json'; path.write_text(json.dumps(config))
        with self.assertRaisesRegex(ValueError, 'adapter'): build(path, '')

    def test_output_path_rejected(self):
        path = self.root / 'bad.json'; path.write_text(json.dumps({**self.config, 'output': '../escape.zip'}))
        with self.assertRaisesRegex(ValueError, 'filename'): build(path, '')

    def test_modified_schema(self):
        files = copy.copy(self.original); files['ims_xml.xsd'] += b' '
        with self.assertRaisesRegex(ValueError, 'Modified standard schema'): self.check_files(files)

    def test_duplicate_zip_entries(self):
        import warnings
        path = self.root / 'duplicate.zip'
        write_zip(self.original, path)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            with zipfile.ZipFile(path, 'a') as archive: archive.writestr('data.json', '{}')
        with self.assertRaisesRegex(ValueError, 'Duplicate'): validate_package(path)

    def test_no_base_redirect(self):
        from validate import inspect_resources
        with self.assertRaisesRegex(ValueError, 'base'): inspect_resources({'a.html': b'<base href="https://example.invalid/">'}, 'a.html')

    def test_inline_css_local_resource(self):
        from validate import inspect_resources
        self.assertEqual(inspect_resources({'a.html': b'<p style="background:url(img.png);color:red">x</p>', 'img.png': b''}, 'a.html'), [])

    def test_inline_css_external_resource(self):
        from validate import inspect_resources
        with self.assertRaisesRegex(ValueError, 'External'): inspect_resources({'a.html': b'<p style="background:url(https://example.invalid/x.png)">x</p>'}, 'a.html')


if __name__ == '__main__': unittest.main()
