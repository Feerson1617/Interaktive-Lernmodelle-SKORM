"""Export this project independently; no parent repository or hidden environment data."""
import hashlib
import json
from pathlib import Path
import zipfile
from build import write_zip
from validate import ROOT

TOP_FILES = ['README.md', 'AGENTS.md', 'package.json', 'package-lock.json', 'requirements.txt',
             'scorm.config.json', 'playwright.config.js', 'playwright.smoke.config.js',
             '.gitignore', '.gitattributes', 'THIRD-PARTY-NOTICES.txt']
TOP_DIRS = ['runtime', 'schemas', 'scripts', 'tests', 'examples', 'docs', '.github']
EXCLUDED = {'__pycache__', 'node_modules', '.git', '.build', 'test-results', 'dist'}


def release():
    files = {name: (ROOT / name).read_bytes() for name in TOP_FILES}
    for directory in TOP_DIRS:
        for path in sorted((ROOT / directory).rglob('*')):
            relative = path.relative_to(ROOT)
            if path.is_symlink(): raise ValueError(f'Symlink in template: {relative}')
            if not path.is_file() or any(part in EXCLUDED for part in relative.parts) or path.suffix == '.pyc': continue
            files[relative.as_posix()] = path.read_bytes()
    output = ROOT / 'dist/SCORM-Universalvorlage.zip'
    output.parent.mkdir(exist_ok=True)
    write_zip(files, output)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() or archive.namelist() != sorted(files): raise ValueError('Invalid template archive')
        if 'README.md' not in archive.namelist() or '.github/workflows/export.yml' not in archive.namelist(): raise ValueError('Incomplete template')
    report = {'status': 'passed', 'zip': output.name, 'files': len(files), 'bytes': output.stat().st_size,
              'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'type': 'source-template-not-an-LMS-package'}
    (ROOT / 'dist/template-validation.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__': release()
