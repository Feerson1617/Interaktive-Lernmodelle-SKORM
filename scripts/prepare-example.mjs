// Reproducible, local example assets. Three.js is copied from the pinned npm lock.
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = root + 'examples/webgl/';
for (const dir of ['vendor/three', 'assets', 'pages', 'modules', 'styles']) await mkdir(target + dir, { recursive: true });
for (const file of ['three.core.js', 'three.module.js']) await copyFile(root + 'node_modules/three/build/' + file, target + 'vendor/three/' + file);
await copyFile(root + 'node_modules/three/LICENSE', target + 'vendor/three/LICENSE.txt');
for (const [source, dest] of [['loaders/GLTFLoader.js', 'GLTFLoader.js'], ['utils/BufferGeometryUtils.js', 'BufferGeometryUtils.js']]) {
  const code = (await readFile(root + 'node_modules/three/examples/jsm/' + source, 'utf8'))
    .replaceAll("from 'three'", "from './three.module.js'")
    .replaceAll("from '../utils/BufferGeometryUtils.js'", "from './BufferGeometryUtils.js'");
  await writeFile(target + 'vendor/three/' + dest, code);
}
const positions = new Float32Array([-0.8, -0.7, 0, 0.8, -0.7, 0, 0, 0.8, 0]);
const uv = new Float32Array([0, 0, 1, 0, 0.5, 1]);
const binary = Buffer.concat([Buffer.from(positions.buffer), Buffer.from(uv.buffer)]);
const model = {
  asset: { version: '2.0', generator: 'SCORM Universal local fixture' }, scene: 0,
  scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 }] }],
  buffers: [{ byteLength: binary.length, uri: 'triangle.bin' }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 24 }],
  accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-0.8, -0.7, 0], max: [0.8, 0.8, 0] }, { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' }],
  images: [{ uri: 'texture.png' }], textures: [{ source: 0 }],
  materials: [{ doubleSided: true, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 } }]
};
await writeFile(target + 'assets/triangle.bin', binary);
await writeFile(target + 'assets/triangle.gltf', JSON.stringify(model));
delete model.buffers[0].uri;
let json = Buffer.from(JSON.stringify(model));
json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + binary.length, 8); header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length); binHeader.writeUInt32LE(0x004e4942, 4);
await writeFile(target + 'assets/triangle.glb', Buffer.concat([header, json, binHeader, binary]));
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]), size = Buffer.alloc(4), crc = Buffer.alloc(4);
  size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(body)); return Buffer.concat([size, body, crc]);
}
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2); ihdr.writeUInt32BE(2, 4); ihdr[8] = 8; ihdr[9] = 2;
const pixels = Buffer.from([0, 255, 80, 30, 20, 160, 210, 0, 255, 210, 0, 50, 200, 130]);
await writeFile(target + 'assets/texture.png', Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]));
console.log('Prepared pinned Three.js, GLB, GLTF, binary buffer and PNG texture.');
