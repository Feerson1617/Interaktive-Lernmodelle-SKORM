"""Publish exactly the tested PIF, then verify downloaded release bytes."""
import hashlib
import os
from pathlib import Path
import subprocess
import tempfile

name = 'Aquarium-1.0-itslearning-SCORM12.zip'
package = Path('.build/release') / name
digest = hashlib.sha256(package.read_bytes()).hexdigest()
tag = os.environ['RELEASE_TAG']
repository = os.environ['GH_REPO']
def run(*args):
    return subprocess.check_output(args, text=True).strip()

notes = Path('.build/release-notes.txt')
notes.write_text('Aquarium 1.0, Quellcommit cbbd20b44f3b14199d4f01170824a6cc78db651d.\n\n'
                 'Die ZIP direkt in itslearning importieren; nicht entpacken oder neu verpacken.\n'
                 'SCORM-1.2-Asset ohne Runtime-Aufrufe. Flüchtige Unterrichtssitzung.\n'
                 'Realer itslearning-Import und physischer iPad-Test sind weiterhin offen.\n\n'
                 f'{package.stat().st_size} Bytes; SHA-256: {digest}\n')
# Unique run tag: never silently overwrite an existing published artifact.
run('gh','release','create',tag,str(package),'--repo',repository,'--target',os.environ['GITHUB_SHA'],
    '--draft','--prerelease','--title','Aquarium 1.0 – SCORM 1.2 Unterricht','--notes-file',str(notes))
with tempfile.TemporaryDirectory() as directory:
    run('gh','release','download',tag,'--repo',repository,'--pattern',name,'--dir',directory)
    if hashlib.sha256((Path(directory)/name).read_bytes()).hexdigest() != digest:
        raise RuntimeError('Release asset hash mismatch')
run('gh','release','edit',tag,'--repo',repository,'--draft=false','--prerelease')
url = f'https://github.com/{repository}/releases/download/{tag}/{name}'
with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as out:
    out.write(f'\n[Direkte itslearning-Import-ZIP]({url})\n\n{package.stat().st_size} Bytes\n\nSHA-256: `{digest}`\n\nRelease-Rückdownload bytegleich geprüft.\n')
print(url)
