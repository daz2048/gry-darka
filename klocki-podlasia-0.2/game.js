import * as THREE from 'three';
import { PointerLockControls } from './vendor/PointerLockControls.js';
import { World, BLOCKS, chunkGeometry, pick } from './world.js';
import { createPlayer, collides, stepPlayer } from './player.js';

const ui = Object.fromEntries(['viewport', 'overlay', 'heading', 'intro', 'start', 'drag-start',
  'pause', 'recover', 'new-world', 'fullscreen', 'palette', 'target', 'notice', 'crosshair',
  'load-status', 'metrics', 'sensitivity', 'low-quality', 'controls-hint',
  'reset-confirm', 'confirm-reset', 'cancel-reset'].map(id => [id, document.getElementById(id)]));
const bootTime = performance.now();
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setClearColor(0xb7dfe3);
ui.viewport.append(renderer.domElement);
renderer.domElement.tabIndex = -1;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb7dfe3, 35, 83);
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 100);
camera.rotation.order = 'YXZ';
const controls = new PointerLockControls(camera, renderer.domElement);
controls.minPolarAngle = 0.1;
controls.maxPolarAngle = Math.PI - 0.1;
const material = new THREE.MeshBasicMaterial({ vertexColors: true });
const chunks = new Map();
const outline = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006, 1.006, 1.006)),
  new THREE.LineBasicMaterial({ color: 0xfff1a4 })
);
outline.visible = false;
scene.add(outline);
let world = new World();
let player = createPlayer(world);
let selected = 7;
let playing = false;
let dragMode = false;
let dragging = false;
let lastTime = performance.now();
let accumulator = 0;
let frameCount = 0;
let frameStart = lastTime;
let fps = 0;
let edits = 0;
let noticeUntil = 0;
let firstFrameMs = 0;
const keys = new Set();
const direction = new THREE.Vector3();
let target = null;
const frames = [];

function notice(message) {
  ui.notice.textContent = message;
  ui.notice.hidden = false;
  noticeUntil = performance.now() + 5000;
}

function resize() {
  renderer.setPixelRatio(ui['low-quality'].checked ? 1 : Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}

function rebuild() {
  for (const key of world.dirty) {
    const data = chunkGeometry(world, ...key.split(',').map(Number));
    const old = chunks.get(key);
    if (old) { scene.remove(old); old.geometry.dispose(); chunks.delete(key); }
    if (!data.indices.length) continue;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
    geometry.setIndex(data.indices);
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    chunks.set(key, mesh);
  }
  world.dirty.clear();
}

function syncCamera() {
  camera.position.set(player.x, player.y + 1.6, player.z);
}

function select(id) {
  selected = id;
  for (const button of ui.palette.children) button.setAttribute('aria-pressed', String(Number(button.dataset.id) === id));
}

for (let id = 1; id < BLOCKS.length; id++) {
  const button = document.createElement('button');
  button.className = 'slot';
  button.dataset.id = id;
  button.title = `${id}: ${BLOCKS[id].name}`;
  button.setAttribute('aria-label', button.title);
  const swatch = document.createElement('span');
  swatch.className = 'swatch';
  swatch.style.background = BLOCKS[id].color;
  const key = document.createElement('kbd');
  key.textContent = id;
  button.append(key, swatch, BLOCKS[id].name);
  button.addEventListener('click', () => { select(id); button.blur(); });
  ui.palette.append(button);
}
select(selected);

function pause() {
  playing = false;
  dragging = false;
  keys.clear();
  accumulator = 0;
  if (document.pointerLockElement === renderer.domElement) controls.unlock();
  ui.overlay.hidden = false;
  ui.crosshair.hidden = true;
  ui.pause.disabled = true;
  ui.heading.textContent = 'Chwila pod lipą';
  ui.intro.textContent = 'Twoja budowla czeka. Wznów spacer lub wróć bezpiecznie na start.';
  outline.visible = false;
}

function play(useDrag) {
  dragMode = useDrag;
  playing = true;
  keys.clear();
  lastTime = performance.now();
  accumulator = 0;
  ui.overlay.hidden = true;
  ui.crosshair.hidden = false;
  ui.pause.disabled = false;
  ui['reset-confirm'].hidden = true;
  renderer.domElement.focus({ preventScroll: true });
  ui['controls-hint'].textContent = useDrag ?
    'Przeciągaj myszą · widok | WASD · ruch | Spacja · skok | Q / E · usuń / dodaj | P · pauza' :
    'WASD · ruch | Spacja · skok | LPM / Q · usuń | PPM / E · dodaj | Esc · pauza';
}

async function requestPlay() {
  ui['load-status'].textContent = 'Kliknij „Zezwól”, jeśli przeglądarka pyta o przechwycenie myszy.';
  try {
    if (!renderer.domElement.requestPointerLock) {
      ui['load-status'].textContent = 'Przechwytywanie myszy niedostępne. Wybierz tryb bez przechwytywania.';
      return;
    }
    // r180 controls.lock discards the browser promise, leaving denials unhandled.
    await renderer.domElement.requestPointerLock();
  }
  catch (error) {
    console.error('Pointer lock:', error);
    pause();
    ui['load-status'].textContent = 'Nie można przechwycić myszy. Wybierz tryb bez przechwytywania.';
  }
}

function updateTarget() {
  camera.getWorldDirection(direction);
  target = pick(world, camera.position, direction);
  outline.visible = playing && Boolean(target);
  if (target) {
    outline.position.set(...target.cell.map(n => n + 0.5));
    ui.target.textContent = `${BLOCKS[world.get(...target.cell)].name} · Q usuń / E dodaj ${BLOCKS[selected].name.toLowerCase()}`;
  } else ui.target.textContent = 'Podejdź bliżej — zasięg budowania: 5 klocków.';
}

let lastEdit = -Infinity;
function edit(place) {
  if (!playing || performance.now() - lastEdit < 140) return;
  lastEdit = performance.now();
  updateTarget();
  if (!target) { notice('Podejdź bliżej klocka (zasięg: 5).'); return; }
  const cell = target.cell.map((n, axis) => n + (place ? target.normal[axis] : 0));
  const error = world.edit(...cell, place ? selected : 0, player);
  if (error) { notice(error); return; }
  edits++;
  rebuild();
  updateTarget();
}

function recover() {
  let found = null;
  for (let radius = 0; radius <= 30 && !found; radius++) {
    for (let x = 32 - radius; x <= 32 + radius && !found; x++) {
      for (let z = 39 - radius; z <= 39 + radius && !found; z++) {
        if (x < 1 || x > 62 || z < 1 || z > 62) continue;
        for (let y = 1; y < 30; y++) {
          const candidate = { x: x + 0.5, y, z: z + 0.5, vy: 0, grounded: false };
          if (world.get(x, y - 1, z) && !collides(world, candidate)) { found = candidate; break; }
        }
      }
    }
  }
  if (!found) { notice('Brak bezpiecznego miejsca. Usuń przeszkody lub utwórz nową łąkę.'); return; }
  player = found;
  camera.rotation.set(-0.13, 0, 0);
  syncCamera();
  notice('Jesteś w bezpiecznym miejscu. Świat pozostał bez zmian.');
}

ui.start.addEventListener('click', requestPlay);
ui['drag-start'].addEventListener('click', () => play(true));
ui.pause.addEventListener('click', pause);
ui.recover.addEventListener('click', recover);
ui['new-world'].addEventListener('click', () => {
  ui['reset-confirm'].hidden = false;
  ui['cancel-reset'].focus();
});
ui['cancel-reset'].addEventListener('click', () => {
  ui['reset-confirm'].hidden = true;
  ui['new-world'].focus();
});
ui['confirm-reset'].addEventListener('click', () => {
  ui['reset-confirm'].hidden = true;
  for (const mesh of chunks.values()) { scene.remove(mesh); mesh.geometry.dispose(); }
  chunks.clear();
  world = new World(crypto.getRandomValues(new Uint32Array(1))[0]);
  player = createPlayer(world);
  camera.rotation.set(-0.13, 0, 0);
  edits = 0;
  rebuild();
  syncCamera();
  ui['load-status'].textContent = 'Nowa łąka gotowa. Wybierz sposób sterowania.';
  ui['drag-start'].focus();
});
ui.fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else notice('Ta przeglądarka nie udostępnia pełnego ekranu. Graj w oknie.');
  } catch (error) {
    console.error('Fullscreen:', error);
    notice('Pełny ekran niedostępny. Gra nadal działa w oknie.');
  }
});
ui.sensitivity.addEventListener('input', () => { controls.pointerSpeed = Number(ui.sensitivity.value); });
ui['low-quality'].addEventListener('change', resize);
controls.addEventListener('lock', () => play(false));
controls.addEventListener('unlock', () => { if (playing && !dragMode) pause(); });
document.addEventListener('pointerlockerror', () => {
  pause();
  ui['load-status'].textContent = 'Przeglądarka odmówiła przechwycenia. Spróbuj ponownie lub wybierz tryb bez przechwytywania.';
});
window.addEventListener('blur', () => { if (playing) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });
window.addEventListener('resize', resize);
window.addEventListener('keydown', event => {
  if (event.target instanceof HTMLElement &&
      event.target.closest('input, button, a, summary')) return;
  if (event.code === 'KeyH') { location.href = '../index.html'; return; }
  if ((event.code === 'KeyP' || event.code === 'Escape') && playing) {
    event.preventDefault(); pause(); return;
  }
  if (!playing) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (/^Digit[1-8]$/.test(event.code)) select(Number(event.code.slice(-1)));
  if (!event.repeat && event.code === 'KeyQ') edit(false);
  if (!event.repeat && event.code === 'KeyE') edit(true);
});
window.addEventListener('keyup', event => keys.delete(event.code));
renderer.domElement.addEventListener('pointerdown', event => {
  if (!playing) return;
  if (dragMode) {
    dragging = true;
    renderer.domElement.setPointerCapture(event.pointerId);
  } else if (event.button === 0 || event.button === 2) edit(event.button === 2);
});
renderer.domElement.addEventListener('pointermove', event => {
  if (!playing || !dragMode || !dragging) return;
  const speed = Number(ui.sensitivity.value) * 0.002;
  camera.rotation.y -= event.movementX * speed;
  camera.rotation.x = Math.max(-1.47, Math.min(1.47, camera.rotation.x - event.movementY * speed));
});
renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
renderer.domElement.addEventListener('lostpointercapture', () => { dragging = false; });
renderer.domElement.addEventListener('contextmenu', event => { if (playing) event.preventDefault(); });
renderer.domElement.addEventListener('wheel', event => {
  if (!playing) return;
  event.preventDefault();
  select(((selected - 1 + (event.deltaY > 0 ? 1 : 7)) % 8) + 1);
}, { passive: false });
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  pause();
  ui['load-status'].textContent = 'Utracono WebGL. Odśwież stronę, aby uruchomić ponownie (budowla nie jest zapisana).';
  for (const id of ['start', 'drag-start', 'recover', 'new-world']) ui[id].disabled = true;
});

function frame(now) {
  const elapsed = Math.max(0, now - lastTime);
  lastTime = now;
  if (playing) {
    frames.push(elapsed);
    if (frames.length > 3600) frames.shift();
    accumulator = Math.min(accumulator + elapsed / 1000, 5 / 60);
    while (accumulator >= 1 / 60) {
      stepPlayer(world, player, {
        forward: keys.has('KeyW') || keys.has('ArrowUp'),
        back: keys.has('KeyS') || keys.has('ArrowDown'),
        left: keys.has('KeyA') || keys.has('ArrowLeft'),
        right: keys.has('KeyD') || keys.has('ArrowRight'),
        jump: keys.has('Space')
      }, camera.rotation.y, 1 / 60);
      accumulator -= 1 / 60;
    }
    syncCamera();
    updateTarget();
  }
  renderer.render(scene, camera);
  if (!firstFrameMs) firstFrameMs = performance.now() - bootTime;
  frameCount++;
  if (now - frameStart >= 1000) {
    fps = Math.round(frameCount * 1000 / (now - frameStart));
    frameCount = 0;
    frameStart = now;
    const sorted = [...frames].sort((a, b) => a - b);
    ui.metrics.textContent = `Three.js r${THREE.REVISION} · WebGL2\nŚwiat: 64 × 32 × 64 · seed: ${world.seed}\nFPS: ${fps} · draw calls: ${renderer.info.render.calls} · geometrie: ${renderer.info.memory.geometries}\nPierwsza klatka (lokalnie): ${Math.round(firstFrameMs)} ms\nPróbki gry: ${sorted.length} · mediana: ${(sorted[Math.floor(sorted.length / 2)] || 0).toFixed(1)} ms · p95: ${(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1)} ms\nEdycje: ${edits} · pozycja: ${player.x.toFixed(1)}, ${player.y.toFixed(1)}, ${player.z.toFixed(1)}`;
  }
  if (!ui.notice.hidden && now > noticeUntil) ui.notice.hidden = true;
}

resize();
rebuild();
syncCamera();
camera.rotation.x = -0.13;
ui['load-status'].textContent = 'Łąka gotowa. Buduj bez limitu materiałów. Ten model nie zapisuje postępu.';
for (const id of ['start', 'drag-start', 'recover', 'new-world']) ui[id].disabled = false;
renderer.setAnimationLoop(frame);
