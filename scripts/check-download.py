"""Validate the directly downloadable ZIP after Actions download, including byte equality."""
import hashlib
import json
from pathlib import Path
from validate import ROOT, validate_package
name = json.loads((ROOT / '.build/selected.json').read_text())['output']
downloaded = ROOT / '.build/download' / name
if {p.name for p in downloaded.parent.iterdir()} != {name}: raise ValueError('Unexpected download wrapper contents')
if downloaded.read_bytes() != (ROOT / 'dist' / name).read_bytes(): raise ValueError('Downloaded ZIP differs')
report = validate_package(downloaded)
(ROOT / 'test-results/download.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'Passed: directly downloaded {name} is ready for itslearning without unpacking or recompression.')
