"""Provenance, modular/source parity and a real ZIP's contents, not a DOM fixture."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'modelle/sinnblick'
sys.path.insert(0, str(SOURCE))
from export_html import build as standalone
sys.path.insert(0, str(ROOT / 'scripts'))
from validate import validate_package


class SinnblickTests(unittest.TestCase):
    def test_original_files_are_preserved(self):
        receipt = json.loads((ROOT / 'docs/modelle/sinnblick/quellstand.json').read_text())
        for name, digest in receipt['source_sha256'].items():
            with self.subTest(file=name):
                self.assertEqual(hashlib.sha256((SOURCE / name).read_bytes()).hexdigest(), digest)

    def test_modular_source_is_complete_current_export(self):
        modules = json.loads((SOURCE / 'modules.js').read_text()[len('window.SenseModules='):-2])
        for organ in ('eye', 'ear'):
            self.assertEqual(standalone(SOURCE / organ)[0], modules[organ])
        html = standalone(SOURCE)[0].encode()
        self.assertEqual(html, (SOURCE / 'Sinnblick.html').read_bytes())
        self.assertEqual(html, (SOURCE / 'Sinnblick-Nah-Fern.html').read_bytes())

    def test_real_zip_and_repeatability(self):
        subprocess.run(['python3', 'scripts/prepare-sinnblick.py'], cwd=ROOT, check=True)
        subprocess.run(['node', 'scripts/build.mjs', 'configs/sinnblick.json'], cwd=ROOT, check=True)
        package = ROOT / 'dist/Sinnblick-SCORM-1.2.zip'
        before = package.read_bytes()
        report = validate_package(package)
        self.assertTrue(report['xsd'])
        self.assertEqual(report['launch'], 'index.html')
        with zipfile.ZipFile(package) as archive:
            info = json.loads(archive.read('__scorm/package-info.json'))
            expected = {p.relative_to(ROOT / '.build/sinnblick-web').as_posix()
                        for p in (ROOT / '.build/sinnblick-web').rglob('*') if p.is_file()}
            self.assertEqual(set(info['source_sha256']), expected)
            self.assertFalse(info['classroomMode'])
            self.assertIsNone(info['classroomAdapter'])
            for name in archive.namelist():
                self.assertNotIn(Path(name).suffix, ('.zip', '.py', '.cjs', '.md'))
                self.assertNotIn('tests/', name)
            for name in ('eye/app.js', 'ear/models.js', 'ear/bone-geometry.js', 'ear/content.js',
                         'three.min.js', 'eye/three.min.js', 'ear/three.min.js'):
                if name == 'eye/app.js':
                    self.assertEqual(archive.read(name).decode().replace(
                        'bridge.ready({resume(){resize();lastDrawTime=0;requestDraw();},activate()',
                        'bridge.ready({activate()').replace(
                        'spacing=Math.max(38,...items.map(p=>p.node.offsetHeight+6));', 'spacing=38;').replace(
                        'endY=y+p.node.offsetHeight/2;', 'endY=y+16;'), (SOURCE / name).read_text())
                else:
                    self.assertEqual(archive.read(name), (SOURCE / name).read_bytes())
        subprocess.run(['python3', 'scripts/prepare-sinnblick.py'], cwd=ROOT, check=True)
        subprocess.run(['node', 'scripts/build.mjs', 'configs/sinnblick.json'], cwd=ROOT, check=True)
        self.assertEqual(before, package.read_bytes())

    def test_source_release_remains_self_contained(self):
        subprocess.run(['python3', 'scripts/release.py'], cwd=ROOT, check=True, capture_output=True)
        with zipfile.ZipFile(ROOT / 'dist/SCORM-Universalvorlage.zip') as archive:
            for name in ('modelle/sinnblick/eye/app.js', 'modelle/sinnblick/ear/models.js',
                         'configs/sinnblick.json', 'playwright.sinnblick.config.js',
                         'docs/modelle/sinnblick/quellstand.json'):
                self.assertEqual(archive.read(name), (ROOT / name).read_bytes())
            self.assertFalse(any('.DS_Store' in p or p.startswith('.build/') for p in archive.namelist()))
