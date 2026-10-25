/** Prepare a disposable copy of the approved application; never edit upstream. */
import {readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {parse} from 'acorn';
export const AQUARIUM_COMMIT = 'cbbd20b44f3b14199d4f01170824a6cc78db651d';
const source = resolve(process.argv[2] || '.build/aquarium-source');
const output = resolve('.build/aquarium-web');
if (execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim() !== AQUARIUM_COMMIT) throw Error('Unapproved Aquarium commit');
if (execFileSync('git', ['-C', source, 'status', '--porcelain', '--untracked-files=all'], {encoding:'utf8'}).trim()) throw Error('Upstream checkout is modified');
rmSync(output, {recursive:true, force:true}); mkdirSync(output, {recursive:true});
const copied = [];
function copy(path) {
  const target = resolve(output, path); mkdirSync(dirname(target), {recursive:true});
  copyFileSync(resolve(source, path), target); copied.push(path);
}
for (const path of readdirSync(source)) if (/\.(mjs|css)$/.test(path) || path === 'index.html') copy(path);
function assets(path) {
  for (const entry of readdirSync(resolve(source,path), {withFileTypes:true})) {
    const next = path + '/' + entry.name;
    if (entry.isDirectory()) continue; // authored sources, reviews and previous evidence are not runtime
    if (/\.(glb|gltf|bin|webp|png|jpe?g|svg|md|txt|LICENSE)$/.test(next)) copy(next);
  }
}
for (const path of ['assets/catalog','assets/species','assets/realism','vendor']) assets(path);
copy('vendor/lz-string.mjs');
for (const name of ['TEACHER.md','MISSIONS.md']) copy('docs/single-aquarium/' + name);
// Pin-specific storage substitution in executable JS only (not string data).
function adapt(code) {
  const tree = parse(code, {ecmaVersion:'latest', sourceType:'module'}), edits=[];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Identifier' && node.name === 'localStorage') edits.push([node.start,node.end,'aquariumStorage']);
    if (node.type === 'FunctionDeclaration' && ['download','Ff','createStandaloneDocument'].includes(node.id?.name)) {
      edits.push([node.body.start,node.body.end,'{ return; }']); return;
    }
    for (const [key,value] of Object.entries(node)) if (key !== 'start' && key !== 'end') {
      if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(tree);
  for (const [start,end,value] of edits.sort((a,b)=>b[0]-a[0])) code=code.slice(0,start)+value+code.slice(end);
  if (edits.length) code="import {aquariumStorage} from './classroom-storage.mjs';\n"+code;
  if (/\b(localStorage|sessionStorage|indexedDB)\b/.test(code)) throw Error('Unadapted persistent storage');
  return code;
}
for (const path of copied.filter(p=>p.endsWith('.mjs'))) writeFileSync(resolve(output,path),adapt(readFileSync(resolve(output,path),'utf8')));
let html = readFileSync(resolve(output,'index.html'),'utf8');
html=html.replace(/(<script type="module">)([\s\S]*?)(<\/script>)/g, (_,start,code,end)=>start+adapt(code)+end);
// Reuse the upstream bounded lifecycle without embedding the standalone bundle.
const nav = parse(readFileSync(resolve(source,'standalone-navigation.mjs'),'utf8'),{ecmaVersion:'latest',sourceType:'module'});
const runtime = nav.body[0].declaration.body.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='frameRuntime');
const wire=readFileSync(resolve(source,'standalone-navigation.mjs'),'utf8').slice(runtime.start,runtime.end);
writeFileSync(resolve(output,'classroom-lifecycle.js'),`window.__aquariumStandaloneRoute=location.href;\n(${wire})();`);
html=html.replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; connect-src \'self\' blob: data:; object-src \'none\'; form-action \'none\'"><script src="./classroom-lifecycle.js"></script>');
// An application link must remain relative in the packaged copy.
html=html.replaceAll('${gameURL().pathname}', './index.html');
writeFileSync(resolve(output,'index.html'),html);
for (const file of ['host.mjs','classroom-storage.mjs']) copyFileSync(resolve('aquarium',file),resolve(output,file));
writeFileSync(resolve(output,'classroom.html'),'<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aquarium Unterricht</title><style>html,body{margin:0;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:0}</style></head><body><script type="module" src="./host.mjs"></script></body></html>');
writeFileSync(resolve(output,'aquarium-source.json'),JSON.stringify({repository:'Feerson1617/Simulation-Aquarium',commit:AQUARIUM_COMMIT,files:copied.sort()},null,2));
console.log(`Prepared ${copied.length} runtime files from ${AQUARIUM_COMMIT}`);
