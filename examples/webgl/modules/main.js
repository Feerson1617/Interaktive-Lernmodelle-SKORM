import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { turn, current, classroomMode } from './classroom.js';

const { readLesson } = await import('./lesson.js');
document.querySelector('#lesson').textContent = (await readLesson()).text;
const status = document.querySelector('#render-status');
const memory = document.querySelector('#memory');
const updateMemory = () => { memory.textContent = `${classroomMode ? 'Flüchtiger Unterrichtsmodus' : 'Lokaler Gerätespeicher'} · Drehungen: ${current()}`; };
updateMemory();
try {
  const canvas = document.querySelector('#scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor('#123744');
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4.5;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8090b0, 3));
  const loader = new GLTFLoader();
  const models = await Promise.all([
    loader.loadAsync(new URL('../assets/triangle.glb', import.meta.url).href),
    loader.loadAsync(new URL('../assets/triangle.gltf', import.meta.url).href)
  ]);
  models.forEach((model, i) => { model.scene.position.x = i ? 0.9 : -0.9; scene.add(model.scene); });
  function render() {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  const rotate = () => { const angle = turn() * 0.3; models.forEach(m => { m.scene.rotation.y = angle; }); render(); updateMemory(); };
  document.querySelector('#rotate').addEventListener('click', rotate);
  canvas.addEventListener('pointerup', rotate);
  new ResizeObserver(render).observe(canvas);
  window.addEventListener('scorm:session', event => { if (event.detail.phase === 'finished') renderer.setAnimationLoop(null); });
  render(); status.textContent = 'GLB und GLTF mit lokaler Textur geladen'; status.dataset.ready = 'true';
} catch (error) {
  status.textContent = `3D-Darstellung nicht verfügbar: ${error.message}`; status.dataset.ready = 'false';
}
