import * as THREE from 'three';
import { PointerLockControls } from './vendor/PointerLockControls.js';
import { World, SIZE, CHUNK, BLOCKS, BIOMES, biomeAt, VILLAGES, BIOME_VILLAGES, STRUCTURES,
  nearbyChunks, chunkGeometry, waterGeometry, pick } from './world.js?v=3';
import { ATLAS_COLUMNS, ATLAS_ROWS, createBlockAtlas } from './textures.js?v=2';
import { createPlayer, collides, stepPlayer } from './player.js?v=2';
import { createMobs, createMobModel, stepMobs } from './mobs.js?v=3';
import { AmbientMusic } from './music.js?v=2';
import { applySnapshot, CorruptSaveError, createSnapshot, SaveConflictError, SaveMigrationError, WorldSaveStore } from './saves.js?v=3';

const ui = Object.fromEntries(['viewport', 'overlay', 'heading', 'intro', 'start', 'drag-start',
  'pause', 'recover', 'new-world', 'fullscreen', 'palette', 'palette-pages', 'target', 'notice', 'crosshair',
  'load-status', 'metrics', 'sensitivity', 'low-quality', 'music-on', 'music-volume', 'controls-hint',
  'reset-confirm', 'reset-message', 'confirm-reset', 'cancel-reset', 'coordinates', 'destinations', 'biome-destinations',
  'structure-destinations', 'save-status', 'save-now', 'reload-save', 'session-note', 'save-recovery',
  'save-recovery-message', 'restore-backup', 'leave-confirm', 'stay-in-game', 'leave-unsaved']
  .map(id => [id, document.getElementById(id)]));
const bootTime = performance.now();
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setClearColor(0xc9e7e5);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
ui.viewport.append(renderer.domElement);
renderer.domElement.tabIndex = -1;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xc9e7e5, 36, 62);
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 140);
camera.rotation.order = 'YXZ';
const controls = new PointerLockControls(camera, renderer.domElement);
controls.minPolarAngle = 0.1;
controls.maxPolarAngle = Math.PI - 0.1;
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(130, 32, 20),
  new THREE.ShaderMaterial({
    uniforms: {
      skyTop: { value: new THREE.Color('#66b9df') },
      skyHorizon: { value: new THREE.Color('#c9e7e5') },
      sunDirection: { value: new THREE.Vector3(-0.39, 0.72, 0.57).normalize() },
      sunColor: { value: new THREE.Color('#fff0c4') }
    },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(mat3(modelMatrix) * position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 skyTop;
      uniform vec3 skyHorizon;
      uniform vec3 sunDirection;
      uniform vec3 sunColor;
      varying vec3 vDirection;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 cell = floor(p);
        vec2 blend = fract(p);
        blend = blend * blend * (3.0 - 2.0 * blend);
        return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
          mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), blend.x), blend.y);
      }

      void main() {
        vec3 direction = normalize(vDirection);
        float height = smoothstep(-0.12, 0.82, direction.y);
        vec3 color = mix(skyHorizon, skyTop, height);
        float cloudHeight = max(direction.y + 0.18, 0.08);
        vec2 cloudUv = direction.xz / cloudHeight * 5.0;
        float cloudNoise = noise(cloudUv) * 0.58 + noise(cloudUv * 2.0) * 0.29 +
          noise(cloudUv * 4.0) * 0.13;
        float cloudBand = smoothstep(0.03, 0.34, direction.y) *
          (1.0 - smoothstep(0.42, 0.72, direction.y));
        float clouds = smoothstep(0.54, 0.7, cloudNoise) * cloudBand;
        color = mix(color, vec3(1.0, 0.98, 0.91), clouds * 0.52);
        float sun = max(dot(direction, normalize(sunDirection)), 0.0);
        color += sunColor * (pow(sun, 180.0) * 0.85 + pow(sun, 18.0) * 0.2);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    depthWrite: false
  })
);
sky.renderOrder = -1;
scene.add(sky);
scene.add(new THREE.HemisphereLight(0xe4f6ff, 0x746044, 1.25));
const sunlight = new THREE.DirectionalLight(0xfff0d7, 2.1);
sunlight.position.set(-32, 54, 38);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -42;
sunlight.shadow.camera.right = 42;
sunlight.shadow.camera.top = 42;
sunlight.shadow.camera.bottom = -42;
sunlight.shadow.camera.near = 1;
sunlight.shadow.camera.far = 140;
sunlight.shadow.normalBias = 0.025;
sunlight.shadow.bias = -0.00015;
sunlight.shadow.radius = 3;
scene.add(sunlight);
scene.add(sunlight.target);
const atlasCanvas = createBlockAtlas(BLOCKS);
const atlas = new THREE.CanvasTexture(atlasCanvas);
atlas.colorSpace = THREE.SRGBColorSpace;
atlas.magFilter = THREE.NearestFilter;
atlas.minFilter = THREE.NearestFilter;
atlas.generateMipmaps = false;
const atlasUrl = atlasCanvas.toDataURL();
const material = new THREE.MeshLambertMaterial({ vertexColors: true, map: atlas });
const waterCanvas = document.createElement('canvas');
waterCanvas.width = waterCanvas.height = 64;
const waterContext = waterCanvas.getContext('2d');
if (!waterContext) throw new Error('Nie można utworzyć tekstury wody.');
waterContext.fillStyle = '#4a9fb0';
waterContext.fillRect(0, 0, 64, 64);
for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 16) {
  const offset = (y * 7 + x * 3) % 12;
  waterContext.fillStyle = '#79c5cc';
  waterContext.fillRect((x + offset) % 64, y + 2, 8, 1);
  waterContext.fillStyle = '#328396';
  waterContext.fillRect((x + offset + 5) % 64, y + 5, 6, 1);
}
const waterTexture = new THREE.CanvasTexture(waterCanvas);
waterTexture.colorSpace = THREE.SRGBColorSpace;
waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
waterTexture.magFilter = THREE.NearestFilter;
waterTexture.minFilter = THREE.NearestFilter;
waterTexture.generateMipmaps = false;
const waterMaterial = new THREE.MeshPhongMaterial({
  map: waterTexture, color: 0xffffff, transparent: true, opacity: 0.78,
  side: THREE.DoubleSide, depthWrite: false, shininess: 90, specular: 0xb9e8e8
});
const chunks = new Map();
const waterChunks = new Map();
const loadedChunks = new Set();
let visibleChunks = new Set();
let chunkCenter = '';
const outline = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006, 1.006, 1.006)),
  new THREE.LineBasicMaterial({ color: 0xfff1a4 })
);
outline.visible = false;
scene.add(outline);
let world = new World();
let player = createPlayer(world);
let mobs = [];
let mobModels = [];
let selected = 7;
let palettePage = 0;
const saveStore = new WorldSaveStore();
let worldId = crypto.randomUUID();
let saveExpected = { exists: false, revision: null };
let saveInitialized = false;
let saveDirty = false;
let saveGeneration = 0;
let saveGate = null;
let saveInProgress = null;
let autosaveTimer = null;
let lastSavedAt = 0;
let lastTrackedState = null;
let allowUnsavedNavigation = false;
let pendingHomeHref = null;
let recoveryRecord = null;
const PALETTE_STARTS = [1, 9, 17, 25, 32, BLOCKS.length];
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
const music = new AmbientMusic();
ui.destinations.textContent = VILLAGES.map(village => `${village.name}: X ${village.x}, Z ${village.z}`).join(' · ');
ui['biome-destinations'].textContent = BIOME_VILLAGES.map(village =>
  `${BIOMES[village.biome].name} — ${village.name}: X ${village.x}, Z ${village.z}`).join(' · ');
ui['structure-destinations'].textContent = STRUCTURES.map(site => `${site.name}: X ${site.x}, Z ${site.z}`).join(' · ');

function notice(message) {
  ui.notice.textContent = message;
  ui.notice.hidden = false;
  noticeUntil = performance.now() + 5000;
}

function updateSaveControls() {
  const blocked = ['recovery', 'corrupt', 'conflict', 'migration'].includes(saveGate);
  ui['save-now'].disabled = !saveInitialized || Boolean(saveInProgress) || blocked ||
    (!saveDirty && !lastSavedAt);
  ui['reload-save'].hidden = !['conflict', 'migration'].includes(saveGate);
  ui['reload-save'].textContent = saveGate === 'migration' ? 'Ponów migrację zapisu' : 'Wczytaj aktualny zapis';
}

function setSaveStatus(message, state = 'normal') {
  ui['save-status'].textContent = message;
  ui['save-status'].dataset.state = state;
  updateSaveControls();
}

function currentSettings() {
  return {
    sensitivity: Number(ui.sensitivity.value),
    lowQuality: ui['low-quality'].checked,
    musicEnabled: ui['music-on'].checked,
    musicVolume: Number(ui['music-volume'].value) / 100
  };
}

function applySettings(settings) {
  ui.sensitivity.value = String(settings.sensitivity);
  controls.pointerSpeed = settings.sensitivity;
  ui['low-quality'].checked = settings.lowQuality;
  ui['music-on'].checked = settings.musicEnabled;
  ui['music-volume'].value = String(Math.round(settings.musicVolume * 100));
  ui['music-volume'].disabled = !settings.musicEnabled;
  music.setVolume(settings.musicVolume);
  resize();
}

function currentSnapshot() {
  return createSnapshot(world, player, camera.rotation.y, camera.rotation.x,
    selected, currentSettings(), worldId);
}

function scheduleAutosave() {
  if (!saveInitialized || !saveDirty || saveInProgress || autosaveTimer ||
      ['recovery', 'corrupt', 'conflict', 'migration'].includes(saveGate)) return;
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    saveWorld().catch(error => notice(error.message));
  }, 3000);
}

function markDirty() {
  const wasDirty = saveDirty;
  saveDirty = true;
  saveGeneration++;
  if (!wasDirty) {
    setSaveStatus(
      ['recovery', 'corrupt', 'conflict', 'migration'].includes(saveGate) ?
        'Zmiany nie zapisane — wybierz odzyskiwanie lub nowy świat.' : 'Niezapisane zmiany',
      saveGate ? 'error' : 'dirty'
    );
  }
  scheduleAutosave();
}

function trackPersistentState() {
  const state = [player.x, player.y, player.z, camera.rotation.y, camera.rotation.x];
  if (!lastTrackedState || state.some((value, index) => value !== lastTrackedState[index])) {
    lastTrackedState = state;
    markDirty();
  }
}

function savedLabel(timestamp) {
  return `Zapisano ${new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(timestamp))}`;
}

async function saveWorld({ snapshot = null, replaceCorrupt = false } = {}) {
  if (!saveInitialized) throw new Error('Zapis jest jeszcze wczytywany.');
  if (['recovery', 'corrupt', 'conflict', 'migration'].includes(saveGate) && !replaceCorrupt) {
    throw new Error('Najpierw rozwiąż problem z poprzednim zapisem.');
  }
  if (saveInProgress) {
    await saveInProgress;
    if (!snapshot && !saveDirty) return lastSavedAt ? { savedAt: lastSavedAt } : null;
    return saveWorld({ snapshot, replaceCorrupt });
  }
  const generation = saveGeneration;
  const payload = snapshot || currentSnapshot();
  const expected = { ...saveExpected };
  const attempt = (async () => {
    setSaveStatus('Zapisywanie…', 'saving');
    try {
      const record = await saveStore.save(payload, expected, { replaceCorrupt });
      saveExpected = { exists: true, revision: record.revision };
      lastSavedAt = record.savedAt;
      if (snapshot || generation === saveGeneration) saveDirty = false;
      saveGate = null;
      ui['save-recovery'].hidden = true;
      ui['session-note'].textContent = 'Zapis lokalny w tym profilu Chrome. To nie jest kopia zapasowa.';
      setSaveStatus(saveDirty ? 'Niezapisane zmiany' : savedLabel(record.savedAt), saveDirty ? 'dirty' : 'saved');
      if (saveDirty) scheduleAutosave();
      return record;
    } catch (error) {
      if (error instanceof SaveConflictError) {
        saveGate = 'conflict';
        setSaveStatus('Konflikt zapisu — wczytaj aktualną wersję.', 'conflict');
      } else {
        if (error instanceof CorruptSaveError) saveGate = 'corrupt';
        setSaveStatus('Nie zapisano — ponów próbę.', 'error');
      }
      throw error;
    } finally {
      saveInProgress = null;
      updateSaveControls();
    }
  })();
  saveInProgress = attempt;
  updateSaveControls();
  return attempt;
}

function prepareMusic() {
  if (!ui['music-on'].checked) return;
  music.prepare().catch(error => {
    console.error('Muzyka:', error);
    notice('Nie można uruchomić muzyki. Graj bez niej lub spróbuj ponownie.');
  });
}

function resize() {
  renderer.setPixelRatio(ui['low-quality'].checked ? 1 : Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}

function rebuild() {
  for (const key of world.dirty) {
    if (!visibleChunks.has(key)) continue;
    const coordinates = key.split(',').map(Number);
    const data = chunkGeometry(world, ...coordinates);
    const old = chunks.get(key);
    if (old) { scene.remove(old); old.geometry.dispose(); chunks.delete(key); }
    if (data.indices.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
      geometry.setIndex(data.indices);
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      chunks.set(key, mesh);
    }
    const water = waterGeometry(world, ...coordinates);
    const oldWater = waterChunks.get(key);
    if (oldWater) { scene.remove(oldWater); oldWater.geometry.dispose(); waterChunks.delete(key); }
    if (water.indices.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(water.positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(water.normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(water.uvs, 2));
      geometry.setIndex(water.indices);
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, waterMaterial);
      scene.add(mesh);
      waterChunks.set(key, mesh);
    }
    loadedChunks.add(key);
    world.dirty.delete(key);
  }
  renderer.shadowMap.needsUpdate = true;
}

function updateChunks() {
  const center = `${Math.floor(player.x / CHUNK)},${Math.floor(player.z / CHUNK)}`;
  if (center === chunkCenter) return;
  chunkCenter = center;
  visibleChunks = nearbyChunks(player.x, player.z);
  for (const key of loadedChunks) {
    if (visibleChunks.has(key)) continue;
    for (const collection of [chunks, waterChunks]) {
      const mesh = collection.get(key);
      if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); collection.delete(key); }
    }
    loadedChunks.delete(key);
  }
  for (const key of visibleChunks) if (!loadedChunks.has(key)) world.dirty.add(key);
  sunlight.target.position.set(player.x, 8, player.z);
  sunlight.position.set(player.x - 32, 62, player.z + 38);
  sunlight.target.updateMatrixWorld();
  rebuild();
}

function resetMobs() {
  for (const model of mobModels) {
    scene.remove(model.group);
    const geometries = new Set();
    for (const material of model.materials.values()) {
      if (material.map) material.map.dispose();
      material.dispose();
    }
    model.group.traverse(object => {
      if (object.geometry && !geometries.has(object.geometry)) {
        geometries.add(object.geometry);
        object.geometry.dispose();
      }
    });
  }
  mobs = createMobs(world);
  mobModels = mobs.map(mob => createMobModel(THREE, mob));
  for (let index = 0; index < mobs.length; index++) {
    mobs[index].model = mobModels[index];
    scene.add(mobModels[index].group);
  }
}
resetMobs();

function syncCamera() {
  camera.position.set(player.x, player.y + 1.6, player.z);
}

function select(id, persist = true) {
  if (!Number.isInteger(id) || id < 1 || id >= BLOCKS.length) return;
  selected = id;
  palettePage = PALETTE_STARTS.findIndex((first, page) => id >= first && id < PALETTE_STARTS[page + 1]);
  renderPalette();
  for (const button of ui['palette-pages'].children) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.page) === palettePage));
  }
  if (persist) markDirty();
}

function renderPalette() {
  ui.palette.replaceChildren();
  const first = PALETTE_STARTS[palettePage];
  for (let id = first; id < PALETTE_STARTS[palettePage + 1]; id++) {
    const slot = id - first + 1;
    const button = document.createElement('button');
    button.className = 'slot';
    button.dataset.id = id;
    button.title = `${slot}: ${BLOCKS[id].name}`;
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', String(id === selected));
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = BLOCKS[id].color;
    swatch.style.backgroundImage = `url("${atlasUrl}")`;
    swatch.style.backgroundSize = `${ATLAS_COLUMNS * 100}% ${ATLAS_ROWS * 100}%`;
    swatch.style.backgroundPosition = `${id % ATLAS_COLUMNS / (ATLAS_COLUMNS - 1) * 100}% ${Math.floor(id / ATLAS_COLUMNS) / (ATLAS_ROWS - 1) * 100}%`;
    const key = document.createElement('kbd');
    key.textContent = slot;
    const name = document.createElement('span');
    name.className = 'slot-name';
    name.textContent = BLOCKS[id].name;
    button.append(key, swatch, name);
    button.addEventListener('click', () => { select(id); button.blur(); });
    ui.palette.append(button);
  }
}
for (const button of ui['palette-pages'].children) {
  button.addEventListener('click', () => {
    select(PALETTE_STARTS[Number(button.dataset.page)]);
    button.blur();
  });
}
select(selected, false);

function pause() {
  playing = false;
  music.stop();
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
  if (saveDirty) saveWorld().catch(error => notice(error.message));
}

function play(useDrag) {
  dragMode = useDrag;
  playing = true;
  if (ui['music-on'].checked) music.start();
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
    prepareMusic();
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
    const block = BLOCKS[world.get(...target.cell)];
    const height = block.height ?? 1;
    outline.scale.y = height;
    outline.position.set(target.cell[0] + 0.5, target.cell[1] + height / 2, target.cell[2] + 0.5);
    ui.target.textContent = `${block.name} · Q usuń / E dodaj ${BLOCKS[selected].name.toLowerCase()}`;
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
  markDirty();
  rebuild();
  updateTarget();
}

function findSafePlayer(targetWorld) {
  let found = null;
  for (let radius = 0; radius <= 30 && !found; radius++) {
    for (let x = 32 - radius; x <= 32 + radius && !found; x++) {
      for (let z = 39 - radius; z <= 39 + radius && !found; z++) {
        if (x < 1 || x >= SIZE[0] - 1 || z < 1 || z >= SIZE[2] - 1) continue;
        for (let y = 1; y < SIZE[1] - 2; y++) {
          const candidate = { x: x + 0.5, y, z: z + 0.5, vy: 0, grounded: false };
          if (targetWorld.get(x, y - 1, z) && !collides(targetWorld, candidate)) { found = candidate; break; }
        }
      }
    }
  }
  return found;
}

function installWorld(nextWorld, nextPlayer, yaw, pitch) {
  for (const mesh of chunks.values()) { scene.remove(mesh); mesh.geometry.dispose(); }
  chunks.clear();
  for (const mesh of waterChunks.values()) { scene.remove(mesh); mesh.geometry.dispose(); }
  waterChunks.clear();
  loadedChunks.clear();
  visibleChunks = new Set();
  chunkCenter = '';
  world = nextWorld;
  player = nextPlayer;
  camera.rotation.set(pitch, yaw, 0);
  resetMobs();
  syncCamera();
  updateChunks();
  lastTrackedState = [player.x, player.y, player.z, camera.rotation.y, camera.rotation.x];
}

function recover() {
  const found = findSafePlayer(world);
  if (!found) { notice('Brak bezpiecznego miejsca. Usuń przeszkody lub utwórz nową łąkę.'); return; }
  player = found;
  camera.rotation.set(-0.13, 0, 0);
  syncCamera();
  updateChunks();
  markDirty();
  notice('Jesteś w bezpiecznym miejscu. Świat pozostał bez zmian.');
}

ui.start.addEventListener('click', requestPlay);
ui['drag-start'].addEventListener('click', () => { prepareMusic(); play(true); });
ui.pause.addEventListener('click', pause);
ui.recover.addEventListener('click', recover);
ui['new-world'].addEventListener('click', () => {
  ui['reset-message'].textContent = saveGate === 'recovery' ?
    'Uszkodzony bieżący zapis zostanie zastąpiony; odzyskana kopia pozostanie zachowana. Kontynuować?' :
    saveGate === 'corrupt' ?
      'Nie można odzyskać poprzedniego świata. Potwierdź, aby zastąpić uszkodzony zapis nowym światem.' :
      saveGate === 'migration' ?
        'Nie można przenieść poprzedniego świata. Jego baza pozostanie zachowana. Potwierdź, aby rozpocząć nowy świat.' :
      'Bieżący świat zostanie zachowany jako poprzedni zapis, a nowa łąka zastąpi bieżącą. Kontynuować?';
  ui['reset-confirm'].hidden = false;
  ui['cancel-reset'].focus();
});
ui['cancel-reset'].addEventListener('click', () => {
  ui['reset-confirm'].hidden = true;
  ui['new-world'].focus();
});
ui['confirm-reset'].addEventListener('click', async () => {
  ui['confirm-reset'].disabled = true;
  const replaceDamaged = ['recovery', 'corrupt', 'migration'].includes(saveGate);
  try {
    if (!replaceDamaged && saveDirty) await saveWorld();
    const nextWorld = new World(crypto.getRandomValues(new Uint32Array(1))[0]);
    const nextPlayer = createPlayer(nextWorld);
    const nextWorldId = crypto.randomUUID();
    const nextSnapshot = createSnapshot(nextWorld, nextPlayer, -0.13, 0,
      selected, currentSettings(), nextWorldId);
    const record = await saveWorld({ snapshot: nextSnapshot, replaceCorrupt: replaceDamaged });
    ui['reset-confirm'].hidden = true;
    worldId = nextWorldId;
    installWorld(nextWorld, nextPlayer, 0, -0.13);
    saveDirty = false;
    saveGate = null;
    saveGeneration++;
    lastSavedAt = record.savedAt;
    edits = 0;
    setSaveStatus(savedLabel(record.savedAt), 'saved');
    ui['save-recovery'].hidden = true;
    ui['load-status'].textContent = 'Nowa łąka zapisana. Wybierz sposób sterowania.';
    ui['drag-start'].focus();
  } catch (error) {
    console.error('Nowa łąka:', error);
    ui['load-status'].textContent = 'Nie udało się bezpiecznie zapisać nowej łąki. Poprzedni świat pozostał aktywny.';
    notice(error.message);
  } finally {
    ui['confirm-reset'].disabled = false;
  }
});
ui['restore-backup'].addEventListener('click', async () => {
  ui['restore-backup'].disabled = true;
  try {
    const record = await saveWorld({ snapshot: recoveryRecord, replaceCorrupt: true });
    saveGate = null;
    saveDirty = false;
    saveGeneration++;
    lastSavedAt = record.savedAt;
    ui['save-recovery'].hidden = true;
    setSaveStatus(savedLabel(record.savedAt), 'saved');
    ui['start'].disabled = false;
    ui['drag-start'].disabled = false;
    ui['load-status'].textContent = 'Poprzedni zapis odzyskany. Wybierz sposób sterowania.';
    ui['drag-start'].focus();
  } catch (error) {
    console.error('Odzyskiwanie zapisu:', error);
    notice(error.message);
  } finally {
    ui['restore-backup'].disabled = false;
  }
});
ui['save-now'].addEventListener('click', () => {
  saveWorld().catch(error => notice(error.message));
});
ui['reload-save'].addEventListener('click', () => {
  allowUnsavedNavigation = true;
  location.reload();
});
ui['stay-in-game'].addEventListener('click', () => {
  ui['leave-confirm'].hidden = true;
  pendingHomeHref = null;
  ui['save-now'].focus();
});
ui['leave-unsaved'].addEventListener('click', () => {
  allowUnsavedNavigation = true;
  if (pendingHomeHref) location.href = pendingHomeHref;
});

async function navigateHome(href) {
  if (playing) pause();
  try {
    if (saveDirty) await saveWorld();
    location.href = href;
  } catch (error) {
    if (playing) pause();
    pendingHomeHref = href;
    ui['leave-confirm'].hidden = false;
    notice(error.message);
  }
}

for (const link of document.querySelectorAll('a[href="../index.html"]')) {
  link.addEventListener('click', event => {
    event.preventDefault();
    navigateHome(link.href);
  });
}
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
ui.sensitivity.addEventListener('input', () => {
  controls.pointerSpeed = Number(ui.sensitivity.value);
  markDirty();
});
ui['low-quality'].addEventListener('change', () => {
  resize();
  markDirty();
});
ui['music-on'].addEventListener('change', () => {
  ui['music-volume'].disabled = !ui['music-on'].checked;
  if (playing && ui['music-on'].checked) music.start();
  else music.stop();
  markDirty();
});
ui['music-volume'].addEventListener('input', () => {
  music.setVolume(Number(ui['music-volume'].value) / 100);
  markDirty();
});
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
  if (event.code === 'KeyH') { navigateHome('../index.html'); return; }
  if ((event.code === 'KeyP' || event.code === 'Escape') && playing) {
    event.preventDefault(); pause(); return;
  }
  if (!playing) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (/^Digit[1-8]$/.test(event.code)) {
    const id = PALETTE_STARTS[palettePage] + Number(event.code.slice(-1)) - 1;
    if (id < PALETTE_STARTS[palettePage + 1]) select(id);
  }
  if (!event.repeat && event.code === 'KeyQ') edit(false);
  if (!event.repeat && event.code === 'KeyE') edit(true);
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('beforeunload', event => {
  if (saveDirty && !allowUnsavedNavigation) {
    event.preventDefault();
    event.returnValue = '';
  }
});
window.addEventListener('pagehide', () => {
  if (saveDirty && !allowUnsavedNavigation) {
    saveWorld().catch(error => console.error('Zapis przy zamykaniu strony:', error));
  }
});

function installRecord(record) {
  const nextWorld = applySnapshot(new World(record.seed), record);
  const savedPlayer = { ...record.player, vy: 0, grounded: false };
  let nextPlayer = savedPlayer;
  let recoveredPosition = false;
  if (collides(nextWorld, savedPlayer)) {
    nextPlayer = findSafePlayer(nextWorld);
    if (!nextPlayer) throw new CorruptSaveError('Nie znaleziono bezpiecznego miejsca w zapisanym świecie.');
    recoveredPosition = true;
  }
  installWorld(nextWorld, nextPlayer, record.player.yaw, record.player.pitch);
  worldId = record.worldId;
  select(record.selectedBlock, false);
  applySettings(record.settings);
  edits = 0;
  return recoveredPosition;
}

async function initializeSave() {
  ui['load-status'].textContent = 'Wczytujemy świat i zapis…';
  try {
    const result = await saveStore.load();
    saveExpected = result.expected;
    if (result.status === 'current') {
      const recoveredPosition = installRecord(result.record);
      lastSavedAt = result.record.savedAt;
      setSaveStatus(savedLabel(lastSavedAt), 'saved');
      ui['load-status'].textContent = recoveredPosition ?
        'Pozycja była zablokowana. Znaleźliśmy bezpieczne miejsce; zapisz, aby zachować ją na przyszłość.' :
        result.migrated ?
          'Poprzedni zapis został bezpiecznie przeniesiony. Wybierz sposób sterowania.' :
          'Zapisany świat gotowy. Wybierz sposób sterowania.';
      if (recoveredPosition) markDirty();
    } else if (result.status === 'recovery') {
      installRecord(result.record);
      recoveryRecord = currentSnapshot();
      lastSavedAt = result.record.savedAt;
      saveGate = 'recovery';
      ui['save-recovery'].hidden = false;
      ui['save-recovery-message'].textContent = result.migrated ?
        'Poprzedni zapis został przeniesiony. Bieżące dane są uszkodzone; potwierdź odzyskanie poprzedniej kopii przed dalszą grą.' :
        'Bieżący zapis jest uszkodzony. Wczytaliśmy poprzednią kopię; potwierdź jej odzyskanie przed dalszą grą.';
      setSaveStatus('Odzyskano kopię — potwierdź zapis.', 'error');
      ui['load-status'].textContent = 'Poprzednia kopia jest gotowa do odzyskania.';
      ui['start'].disabled = true;
      ui['drag-start'].disabled = true;
    } else if (result.status === 'corrupt') {
      saveGate = 'corrupt';
      saveDirty = true;
      ui['load-status'].textContent =
        'Zapis jest uszkodzony. Możesz zagrać w tej sesji bez zapisu albo po potwierdzeniu utworzyć nowy świat.';
      setSaveStatus('Uszkodzony zapis — nie nadpisujemy go.', 'error');
      ui['session-note'].textContent = 'Ta tymczasowa sesja nie zapisuje zmian; stary zapis jest chroniony.';
    } else {
      saveDirty = true;
      saveGeneration++;
      setSaveStatus('Nowy świat — zapisujemy…', 'dirty');
      ui['load-status'].textContent = 'Nowa łąka gotowa. Zapisujemy pierwszy punkt kontrolny.';
    }
  } catch (error) {
    console.error('Wczytywanie zapisu:', error);
    if (error instanceof SaveMigrationError) saveGate = 'migration';
    else if (error instanceof CorruptSaveError && saveExpected.exists) saveGate = 'corrupt';
    saveDirty = true;
    saveGeneration++;
    setSaveStatus(saveGate === 'migration' ?
      'Nie można przenieść zapisu — stara kopia jest zachowana.' : saveGate === 'corrupt' ?
      'Uszkodzony zapis — nie nadpisujemy go.' : 'Nie można wczytać zapisu — sesja tymczasowa.', 'error');
    ui['session-note'].textContent = saveGate === 'migration' ?
      'Poprzedni świat jest zachowany. Ponów migrację albo potwierdź utworzenie nowego świata.' :
      'Nie można potwierdzić zapisu; zmiany mogą zniknąć po zamknięciu.';
    ui['load-status'].textContent = saveGate === 'migration' ?
      'Nie udało się przenieść poprzedniego zapisu. Możesz ponowić próbę lub potwierdzić rozpoczęcie nowego świata.' :
      'Gra działa bez zapisu. Sprawdź dostęp do pamięci przeglądarki i spróbuj ponownie.';
    notice(error.message);
  } finally {
    saveInitialized = true;
    ui['recover'].disabled = saveGate === 'recovery';
    ui['new-world'].disabled = false;
    if (saveGate !== 'recovery') {
      ui['start'].disabled = false;
      ui['drag-start'].disabled = false;
    }
    if (saveDirty && !saveGate) scheduleAutosave();
    updateSaveControls();
  }
}

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
  const count = BLOCKS.length - 1;
  select(((selected - 1 + (event.deltaY > 0 ? 1 : count - 1)) % count) + 1);
}, { passive: false });
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  pause();
  ui['load-status'].textContent = 'Utracono WebGL. Sprawdź stan zapisu przed odświeżeniem strony.';
  for (const id of ['start', 'drag-start', 'recover', 'new-world']) ui[id].disabled = true;
});

function frame(now) {
  const elapsed = Math.max(0, now - lastTime);
  lastTime = now;
  stepMobs(world, mobs, elapsed / 1000);
  for (const mob of mobs) {
    const bob = mob.walking ? Math.abs(Math.sin(mob.animation * 9 + mob.phase)) * 0.035 : 0;
    mob.model.group.position.set(mob.x, mob.groundY + bob, mob.z);
    mob.model.group.rotation.y = mob.yaw;
    const gait = mob.walking ? Math.sin(mob.animation * 9 + mob.phase) * 0.48 : 0;
    mob.model.legs.forEach((leg, index) => {
      const direction = mob.model.legs.length === 4 && index >= 2 ? -1 : 1;
      leg.rotation.x = gait * (index % 2 ? -direction : direction);
    });
    mob.model.arms.forEach((arm, index) => {
      arm.rotation.x = gait * (index % 2 ? 1 : -1) * (mob.kind === 'ironGolem' ? 0.45 : 0.7);
    });
  }
  if (playing) {
    try {
      music.tick();
    } catch (error) {
      console.error('Muzyka:', error);
      music.stop();
      notice('Muzyka została zatrzymana z powodu błędu. Gra działa dalej.');
    }
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
    updateChunks();
    updateTarget();
    trackPersistentState();
  }
  if (!firstFrameMs) firstFrameMs = performance.now() - bootTime;
  frameCount++;
  if (now - frameStart >= 1000) {
    fps = Math.round(frameCount * 1000 / (now - frameStart));
    frameCount = 0;
    frameStart = now;
    const sorted = [...frames].sort((a, b) => a - b);
    ui.metrics.textContent = `Three.js r${THREE.REVISION} · WebGL2\nŚwiat: ${SIZE.join(' × ')} · seed: ${world.seed}\nFPS: ${fps} · draw calls: ${renderer.info.render.calls} · geometrie: ${renderer.info.memory.geometries}\nPierwsza klatka (lokalnie): ${Math.round(firstFrameMs)} ms\nPróbki gry: ${sorted.length} · mediana: ${(sorted[Math.floor(sorted.length / 2)] || 0).toFixed(1)} ms · p95: ${(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1)} ms\nEdycje: ${edits} · pozycja: ${player.x.toFixed(1)}, ${player.y.toFixed(1)}, ${player.z.toFixed(1)}`;
    ui.coordinates.textContent = `${BIOMES[biomeAt(player.x, player.z)].name} · X ${Math.floor(player.x)} · Z ${Math.floor(player.z)}`;
  }
  if (!ui.notice.hidden && now > noticeUntil) ui.notice.hidden = true;
  waterTexture.offset.set(now * 0.000006 % 1, now * 0.000002 % 1);
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
}

resize();
syncCamera();
updateChunks();
camera.rotation.x = -0.13;
renderer.setAnimationLoop(frame);
await initializeSave();
