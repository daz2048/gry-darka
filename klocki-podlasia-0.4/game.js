import * as THREE from 'three';
import { PointerLockControls } from './vendor/PointerLockControls.js';
import { World, SIZE, CHUNK, BLOCKS, biomeAt, VILLAGES, BIOME_VILLAGES, STRUCTURES,
  nearbyChunks, chunkGeometry, waterGeometry, pick } from './world.js?v=4';
import { ATLAS_COLUMNS, ATLAS_ROWS, createBlockAtlas } from './textures.js?v=3';
import { createPlayer, collides, stepPlayer } from './player.js?v=2';
import { createMobs, createMobModel, stepMobs } from './mobs.js?v=3';
import { loadMusicCatalogue, MusicPlayer } from './music-player.js?v=3';
import { applySnapshot, CorruptSaveError, createSnapshot, saveDataSize, SAVE_DATABASE, WORLD_STORE,
  MAX_WORLDS, SaveConflictError, SaveMigrationError, WorldLimitError, WorldSaveStore,
  suggestUniqueWorldName } from './saves.js?v=11';
import { backupFileName, encodeWorldBackup, readWorldBackup } from './backups.js?v=2';
import { biomeName, blockName, hasMessage, LANGUAGES, locale, MESSAGES, onLanguageChange, setText, structureName, t } from './i18n.js?v=15';
import { initDiagnostics, readSaveStorageStatus } from './diagnostics.js?v=12';

initDiagnostics();

const ui = Object.fromEntries(['viewport', 'overlay', 'heading', 'intro', 'start', 'drag-start',
  'pause', 'recover', 'new-world', 'choose-world', 'fullscreen', 'world-picker', 'world-picker-status',
  'world-list', 'world-continue', 'world-create', 'world-import', 'world-import-file', 'world-transfer-status',
  'world-action-confirm', 'world-action-message',
  'world-action-name-label', 'world-action-name', 'confirm-world-action', 'cancel-world-action',
  'play-actions', 'secondary-actions',
  'palette', 'palette-pages', 'selected-material', 'target', 'notice', 'crosshair',
  'show-coordinates', 'pause-coordinates', 'save-warning', 'save-warning-text', 'save-warning-pause', 'pause-save-warning',
  'load-status', 'metrics', 'sensitivity', 'low-quality', 'music-on', 'music-choice', 'music-status', 'music-volume', 'controls-hint',
  'reset-confirm', 'reset-message', 'world-name-input', 'world-name', 'confirm-reset', 'cancel-reset', 'coordinates', 'destinations', 'biome-destinations',
  'structure-destinations', 'save-status', 'save-details', 'save-now', 'reload-save', 'session-note', 'save-recovery',
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
if (!waterContext) throw new Error('Cannot create the water texture.');
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
// An unnamed world stores no name, so its label follows the chosen language.
const DEFAULT_WORLD_NAMES = new Set(LANGUAGES.map(language => MESSAGES[language]['world.defaultName']));
const customWorldName = name => (name && !DEFAULT_WORLD_NAMES.has(name) ? name : undefined);
const displayWorldName = name => customWorldName(name) ?? t('world.defaultName');
let worldName;
let savedWorlds = [];
let worldPickerUnavailable = false;
let selectingWorld = false;
let transferringWorld = false;
let mutatingWorld = false;
let worldFeedback = null;
let returnToWorldPicker = false;
let pendingWorldAction = null;
let saveDetails = null;
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
let noticeTimer = null;
let controlsHintUntil = 0;
const introducedControlModes = new Set();
let firstFrameMs = 0;
const keys = new Set();
const direction = new THREE.Vector3();
let target = null;
const frames = [];
const music = new MusicPlayer([], {
  onError: error => {
    console.error('Music:', error);
    notice(t('music.failed'));
  },
  onFallback: (error, selection) => {
    console.error('Music fallback:', error);
    ui['music-choice'].value = selection;
    const key = selection === 'random' ? 'music.fallbackRandom' : 'music.fallbackOriginal';
    setText(ui['music-status'], key);
    ui['music-status'].hidden = false;
    notice(t(key));
    if (playing) markDirty();
  }
});
ui['world-name'].textContent = displayWorldName(worldName);

function renderDestinations() {
  ui.destinations.textContent = VILLAGES.map(village => `${village.name}: X ${village.x}, Z ${village.z}`).join(' · ');
  ui['biome-destinations'].textContent = BIOME_VILLAGES.map(village =>
    `${biomeName(village.biome)} — ${village.name}: X ${village.x}, Z ${village.z}`).join(' · ');
  ui['structure-destinations'].textContent = STRUCTURES.map((site, index) =>
    `${structureName(index)}: X ${site.x}, Z ${site.z}`).join(' · ');
}
renderDestinations();

function renderWorldPicker() {
  const busy = selectingWorld || transferringWorld || mutatingWorld ||
    Boolean(pendingWorldAction) || !ui['reset-confirm'].hidden;
  const validWorlds = savedWorlds.filter(entry => !entry.corrupt);
  const mostRecent = validWorlds[0];
  const atWorldLimit = !worldPickerUnavailable && savedWorlds.length >= MAX_WORLDS;
  ui['world-continue'].hidden = !mostRecent;
  ui['world-continue'].disabled = busy;
  if (mostRecent) {
    ui['world-continue'].textContent = t('worldPicker.continue', {
      world: displayWorldName(mostRecent.worldName)
    });
  }
  ui['world-picker-status'].textContent = worldPickerUnavailable
    ? t('worldPicker.unavailable')
    : atWorldLimit ? t('worldPicker.limitReached', { count: MAX_WORLDS })
      : savedWorlds.length ? t('worldPicker.choosePrompt') : t('worldPicker.empty');
  ui['world-create'].disabled = busy || atWorldLimit;
  ui['world-import'].disabled = busy || atWorldLimit || worldPickerUnavailable;
  ui['new-world'].disabled = busy || atWorldLimit;
  ui['world-transfer-status'].hidden = !worldFeedback;
  if (worldFeedback) setText(ui['world-transfer-status'], worldFeedback.key, {
    ...worldFeedback.params,
    ...(Object.hasOwn(worldFeedback, 'worldName') ? { world: displayWorldName(worldFeedback.worldName) } : {}),
    ...(worldFeedback.error ? { error: errorText(worldFeedback.error) } : {})
  });
  ui['world-list'].replaceChildren();
  for (const entry of savedWorlds) {
    const item = document.createElement('div');
    item.setAttribute('role', 'listitem');
    item.className = 'world-card';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'world-option';
    button.dataset.worldId = entry.worldId;
    button.disabled = busy || entry.corrupt;
    button.dataset.damaged = String(Boolean(entry.corrupt));
    button.setAttribute('aria-pressed', String(entry.worldId === worldId));
    button.setAttribute('aria-label', entry.corrupt
      ? `${displayWorldName(entry.worldName)}. ${t('worldPicker.damaged')}`
      : t('worldPicker.play', { world: displayWorldName(entry.worldName) }));
    const name = document.createElement('strong');
    name.textContent = displayWorldName(entry.worldName);
    const detail = document.createElement('small');
    const savedLabel = entry.corrupt
      ? t('worldPicker.damaged')
      : t('worldPicker.lastSaved', {
        time: new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' })
          .format(new Date(entry.savedAt))
      });
    detail.textContent = entry.worldId === worldId
      ? `${savedLabel} · ${t('worldPicker.current')}`
      : savedLabel;
    button.append(name, detail);
    if (!entry.corrupt) button.addEventListener('click', () => selectSavedWorld(entry.worldId).catch(reportError));
    const actions = document.createElement('div');
    actions.className = 'world-actions';
    const rename = document.createElement('button');
    rename.type = 'button';
    rename.dataset.worldAction = 'rename';
    rename.dataset.worldId = entry.worldId;
    rename.textContent = t('worldPicker.rename');
    rename.disabled = busy || entry.corrupt;
    rename.setAttribute('aria-label', t('worldPicker.renameNamed', {
      world: displayWorldName(entry.worldName)
    }));
    rename.addEventListener('click', () => openWorldAction('rename', entry));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.worldAction = 'delete';
    remove.dataset.worldId = entry.worldId;
    remove.textContent = t('worldPicker.delete');
    remove.disabled = busy;
    remove.setAttribute('aria-label', t('worldPicker.deleteNamed', {
      world: displayWorldName(entry.worldName)
    }));
    remove.addEventListener('click', () => openWorldAction('delete', entry));
    const exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.className = 'world-export-button';
    exportButton.textContent = t('backup.export');
    exportButton.disabled = busy || entry.corrupt;
    exportButton.setAttribute('aria-label', t('backup.exportNamed', {
      world: displayWorldName(entry.worldName)
    }));
    exportButton.addEventListener('click', () => transferWorld(() => exportSavedWorld(entry.worldId)));
    actions.append(exportButton, rename, remove);
    item.append(button, actions);
    ui['world-list'].append(item);
  }
}

function focusWorldOption(preferredId = worldId) {
  const options = [...ui['world-list'].querySelectorAll('.world-option:not(:disabled)')];
  const preferred = options.find(button => button.dataset.worldId === preferredId);
  (preferred || options[0] || ui['world-create']).focus();
}

async function transferWorld(operation) {
  if (selectingWorld || transferringWorld || mutatingWorld || pendingWorldAction) return;
  transferringWorld = true;
  worldFeedback = { key: 'backup.working' };
  renderWorldPicker();
  try {
    await operation();
  } catch (error) {
    console.error('World backup:', error);
    worldFeedback = { key: 'backup.failed', error };
  } finally {
    transferringWorld = false;
    renderWorldPicker();
    ui['world-transfer-status'].focus({ preventScroll: true });
  }
}

async function exportSavedWorld(selectedId) {
  if (selectedId === worldId) {
    if (saveInProgress) await saveInProgress;
    if (saveGate) throw codedError('save-blocked');
    if (saveDirty) await saveWorld();
  }
  const result = await saveStore.load(selectedId);
  if (result.status !== 'current') throw new CorruptSaveError();
  const text = await encodeWorldBackup(result.record);
  const filename = backupFileName(displayWorldName(result.record.worldName));
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  worldFeedback = { key: 'backup.download', params: { filename } };
}

async function importWorldFile(file) {
  const snapshot = await readWorldBackup(file);
  const record = await saveStore.importWorld(snapshot);
  worldFeedback = { key: 'backup.imported', worldName: record.worldName };
  try {
    savedWorlds = await saveStore.listWorlds();
  } catch (error) {
    console.error('Imported world, but cannot refresh the world list:', error);
    worldFeedback = { key: 'backup.importedRefreshFailed', error, worldName: record.worldName };
  }
}

function codedError(code) {
  return Object.assign(new Error(code), { code });
}

function errorText(error) {
  if (error instanceof SaveConflictError) return t('error.conflict');
  if (error instanceof SaveMigrationError) return t('error.migration');
  if (error?.code && hasMessage(`error.${error.code}`)) return t(`error.${error.code}`);
  if (error instanceof CorruptSaveError) return t('error.corrupt');
  if (error instanceof WorldLimitError) return t('worldPicker.limitReached', { count: MAX_WORLDS });
  if (error?.name === 'QuotaExceededError') return t('error.quota');
  return t('error.unexpected');
}

function reportError(error) {
  console.error(error);
  notice(errorText(error));
}

function notice(message, duration = 5000, state = 'normal') {
  clearTimeout(noticeTimer);
  ui.notice.textContent = message;
  ui.notice.hidden = false;
  ui.notice.dataset.state = state;
  noticeTimer = setTimeout(() => { ui.notice.hidden = true; }, duration);
}

function savedPauseNotice() {
  notice('', 3000, 'saved');
  const card = document.createElement('span');
  card.className = 'save-confirmation';
  const heading = document.createElement('strong');
  heading.className = 'save-confirmation-heading';
  const details = document.createElement('span');
  details.className = 'save-confirmation-details';
  card.append(heading, details);
  ui.notice.replaceChildren(card);
  renderSavedPauseNotice();
}

function renderSavedPauseNotice() {
  if (ui.notice.hidden || ui.notice.dataset.state !== 'saved') return;
  const heading = ui.notice.querySelector('.save-confirmation-heading');
  const details = ui.notice.querySelector('.save-confirmation-details');
  if (!heading || !details || saveDetails?.state !== 'saved') return;
  const { record } = saveDetails;
  heading.textContent = t('notice.pauseSaved');
  details.textContent = `${ui['save-details'].textContent}\n${t('notice.saveDebug', {
    id: record.worldId,
    revision: record.revision,
    time: new Date(record.savedAt).toLocaleString(locale())
  })}`;
}

function updateSaveControls() {
  const blocked = ['recovery', 'corrupt', 'conflict', 'migration'].includes(saveGate);
  ui['save-now'].disabled = !saveInitialized || Boolean(saveInProgress) || mutatingWorld || blocked ||
    (!saveDirty && !lastSavedAt);
  ui['reload-save'].hidden = !['conflict', 'migration'].includes(saveGate);
  setText(ui['reload-save'], saveGate === 'migration' ? 'button.retryMigration' : 'button.reloadSave');
}

function setSaveStatus(key, state = 'normal', params) {
  setText(ui['save-status'], key, params);
  ui['save-status'].dataset.state = state;
  if (state === 'error' || state === 'conflict') {
    setText(ui['save-warning-text'], key, params);
    setText(ui['pause-save-warning'], key, params);
    ui['save-warning'].hidden = false;
  } else if (state === 'saved' || state === 'normal') {
    ui['save-warning'].hidden = true;
  }
  ui['pause-save-warning'].hidden = ui['save-warning'].hidden;
  updateSaveControls();
}

function currentSettings() {
  return {
    sensitivity: Number(ui.sensitivity.value),
    lowQuality: ui['low-quality'].checked,
    musicEnabled: ui['music-on'].checked,
    musicVolume: Number(ui['music-volume'].value) / 100,
    musicSelection: music.selection
  };
}

function applySettings(settings) {
  ui.sensitivity.value = String(settings.sensitivity);
  controls.pointerSpeed = settings.sensitivity;
  ui['low-quality'].checked = settings.lowQuality;
  ui['music-on'].checked = settings.musicEnabled;
  ui['music-volume'].value = String(Math.round(settings.musicVolume * 100));
  ui['music-volume'].disabled = !settings.musicEnabled;
  ui['music-choice'].disabled = !settings.musicEnabled;
  music.setVolume(settings.musicVolume);
  if (music.tracks.length) ui['music-status'].hidden = true;
  music.restoreSelection(settings.musicSelection);
  ui['music-choice'].value = music.selection;
  resize();
}

function currentSnapshot() {
  return createSnapshot(world, player, camera.rotation.y, camera.rotation.x,
    selected, currentSettings(), worldId, worldName);
}

function scheduleAutosave() {
  if (!saveInitialized || !saveDirty || saveInProgress || autosaveTimer ||
      ['recovery', 'corrupt', 'conflict', 'migration'].includes(saveGate)) return;
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    saveWorld().catch(reportError);
  }, 3000);
}

function markDirty() {
  const wasDirty = saveDirty;
  saveDirty = true;
  saveGeneration++;
  if (!wasDirty) {
    setSaveStatus(
      ['recovery', 'corrupt', 'conflict', 'migration'].includes(saveGate) ?
        'save.dirtyBlocked' : 'save.dirty',
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

function savedTime(timestamp) {
  return new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit', hour12: false })
    .format(new Date(timestamp));
}

function setSavedStatus(timestamp) {
  setSaveStatus('save.saved', 'saved', { time: savedTime(timestamp) });
}

function saveLocation(recordWorldId = worldId) {
  return `${location.origin} → IndexedDB → ${SAVE_DATABASE} → ${WORLD_STORE} → world:${recordWorldId}`;
}

function renderSaveDetails() {
  const element = ui['save-details'];
  if (!saveDetails) { element.hidden = true; return; }
  const location = saveLocation(saveDetails.worldId ?? saveDetails.record?.worldId ?? worldId);
  if (saveDetails.state === 'saving') {
    element.textContent = t('details.saving', { location });
  } else if (saveDetails.state === 'error') {
    element.textContent = t('details.error', { error: errorText(saveDetails.error), location });
  } else {
    const { record, labelKey, pending } = saveDetails;
    const bytes = saveDataSize(record);
    element.textContent = t('details.saved', {
      label: t(labelKey),
      name: displayWorldName(record.worldName),
      time: savedTime(record.savedAt),
      location,
      size: new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(bytes / 1024 / 1024),
      bytes: bytes.toLocaleString(locale()),
      backup: t(`details.backup.${saveDetails.backup}`),
      persistence: t(`details.persistence.${saveDetails.persistence}`)
    }) + (pending ? `\n${t('details.pending')}` : '');
  }
  element.dataset.state = saveDetails.state;
  element.hidden = false;
  renderSavedPauseNotice();
}

function showSavedDetails(record, labelKey = 'details.labelSaved') {
  const details = {
    state: 'saved', record, labelKey, pending: saveDirty,
    backup: 'checking', persistence: 'checking'
  };
  saveDetails = details;
  renderSaveDetails();
  readSaveStorageStatus(saveStore, record.worldId).then(status => {
    if (saveDetails !== details) return;
    Object.assign(details, status);
    renderSaveDetails();
  });
}

async function saveWorld({ snapshot = null, replaceCorrupt = false, expected: expectedOverride = null } = {}) {
  if (!saveInitialized) throw codedError('save-loading');
  if (['recovery', 'corrupt', 'conflict', 'migration'].includes(saveGate) && !replaceCorrupt) {
    throw codedError('save-blocked');
  }
  if (saveInProgress) {
    await saveInProgress;
    if (!snapshot && !saveDirty) return lastSavedAt ? { savedAt: lastSavedAt } : null;
    return saveWorld({ snapshot, replaceCorrupt, expected: expectedOverride });
  }
  const generation = saveGeneration;
  const payload = snapshot || currentSnapshot();
  const expected = { ...(expectedOverride || saveExpected) };
  const attempt = (async () => {
    setSaveStatus('save.saving', 'saving');
    saveDetails = { state: 'saving', worldId: payload.worldId };
    renderSaveDetails();
    try {
      const record = await saveStore.save(payload, expected, { replaceCorrupt });
      saveExpected = { exists: true, revision: record.revision, worldId: record.worldId };
      lastSavedAt = record.savedAt;
      if (snapshot || generation === saveGeneration) saveDirty = false;
      saveGate = null;
      ui['save-recovery'].hidden = true;
      setText(ui['session-note'], 'session.local');
      if (saveDirty) setSaveStatus('save.dirty', 'dirty');
      else setSavedStatus(record.savedAt);
      showSavedDetails(record);
      if (saveDirty) scheduleAutosave();
      return record;
    } catch (error) {
      if (error instanceof SaveConflictError) {
        saveGate = 'conflict';
        setSaveStatus('save.conflict', 'conflict');
      } else {
        if (error instanceof CorruptSaveError) saveGate = 'corrupt';
        setSaveStatus('save.failed', 'error');
      }
      saveDetails = { state: 'error', error };
      renderSaveDetails();
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

function renderWorldAction() {
  if (!pendingWorldAction) return;
  const { type, worldName: name } = pendingWorldAction;
  ui['world-action-message'].textContent = type === 'delete'
    ? t('worldPicker.deleteQuestion', { world: displayWorldName(name) })
    : t('worldPicker.renameQuestion', { world: displayWorldName(name) });
  ui['world-action-name-label'].hidden = type !== 'rename';
  ui['world-action-name'].hidden = type !== 'rename';
  ui['world-action-name'].setCustomValidity('');
  ui['confirm-world-action'].textContent = t(`worldPicker.${type}`);
  ui['world-action-confirm'].classList.toggle('delete-confirm-active', type === 'delete');
  ui['confirm-world-action'].classList.toggle('delete-confirm-flash', type === 'delete');
  ui['world-action-confirm'].hidden = false;
}

function openWorldAction(type, entry) {
  if (selectingWorld || transferringWorld || mutatingWorld || pendingWorldAction) return;
  worldFeedback = null;
  pendingWorldAction = {
    type,
    worldId: entry.worldId,
    worldName: entry.worldName,
    revision: entry.revision
  };
  renderWorldPicker();
  renderWorldAction();
  if (type === 'rename') {
    ui['world-action-name'].value = entry.worldName || t('world.newDefault');
    ui['world-action-name'].focus();
  } else {
    ui['confirm-world-action'].focus();
  }
}

function closeWorldAction() {
  if (mutatingWorld) return;
  const action = pendingWorldAction;
  ui['world-action-confirm'].hidden = true;
  pendingWorldAction = null;
  renderWorldPicker();
  const trigger = [...ui['world-list'].querySelectorAll('[data-world-action]')]
    .find(button => button.dataset.worldAction === action?.type && button.dataset.worldId === action?.worldId);
  if (trigger) trigger.focus();
  else focusWorldOption();
}

async function confirmWorldAction() {
  if (!pendingWorldAction || mutatingWorld) return;
  const action = pendingWorldAction;
  const name = ui['world-action-name'].value.trim();
  if (action.type === 'rename' && !name) {
    ui['world-action-name'].setCustomValidity(t('world.nameRequired'));
    ui['world-action-name'].reportValidity();
    return;
  }
  const deletingCurrent = action.type === 'delete' && action.worldId === worldId;
  let committed = false;
  mutatingWorld = true;
  ui['confirm-world-action'].disabled = true;
  ui['cancel-world-action'].disabled = true;
  ui['world-action-name'].disabled = true;
  updateSaveControls();
  renderWorldPicker();
  try {
    if (action.type === 'rename') {
      if (action.worldId === worldId && saveDirty && !saveGate) await saveWorld();
      const expected = action.worldId === worldId
        ? saveExpected
        : { worldId: action.worldId, revision: action.revision };
      const record = await saveStore.renameWorld(action.worldId, name, expected);
      worldFeedback = { key: 'worldPicker.renamed', worldName: record.worldName };
      if (action.worldId === worldId) {
        saveExpected = { exists: true, revision: record.revision, worldId };
        worldName = customWorldName(record.worldName);
        ui['world-name'].textContent = displayWorldName(worldName);
        lastSavedAt = record.savedAt;
        setSavedStatus(record.savedAt);
        showSavedDetails(record);
      }
    } else {
      if (deletingCurrent) {
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
        if (saveInProgress) await saveInProgress;
      }
      const deleted = await saveStore.deleteWorld(action.worldId);
      if (!deleted) throw codedError('world-not-found');
      worldFeedback = { key: 'worldPicker.deleted', worldName: action.worldName };
    }

    committed = true;
    if (deletingCurrent) {
      saveDirty = false;
      saveGate = null;
      saveExpected = { exists: false, revision: null, worldId: null };
      lastSavedAt = 0;
      recoveryRecord = null;
      ui['save-recovery'].hidden = true;
      saveDetails = null;
      renderSaveDetails();
      worldId = crypto.randomUUID();
      worldName = undefined;
      ui['world-name'].textContent = displayWorldName(worldName);
      const emptyWorld = new World();
      installWorld(emptyWorld, createPlayer(emptyWorld), 0, -0.13);
      ui['world-picker'].hidden = false;
      ui['play-actions'].hidden = true;
      ui['secondary-actions'].hidden = true;
      setSaveStatus('save.noWorld');
      setText(ui['load-status'], 'load.noWorld');
    }
    savedWorlds = await saveStore.listWorlds();
    if (deletingCurrent) {
      const nextWorld = savedWorlds.find(entry => !entry.corrupt);
      if (nextWorld) await selectSavedWorld(nextWorld.worldId, { keepPickerOpen: true });
    }
  } catch (error) {
    worldFeedback = {
      key: committed ? 'worldPicker.changedRefreshFailed' : 'worldPicker.actionFailed',
      error
    };
    reportError(error);
  } finally {
    mutatingWorld = false;
    ui['confirm-world-action'].disabled = false;
    ui['cancel-world-action'].disabled = false;
    ui['world-action-name'].disabled = false;
    updateSaveControls();
    if (committed) closeWorldAction();
    else {
      renderWorldPicker();
      ui['confirm-world-action'].focus();
    }
  }
}

async function selectSavedWorld(selectedId, { keepPickerOpen = false } = {}) {
  if (selectingWorld || transferringWorld || (!keepPickerOpen && (mutatingWorld || pendingWorldAction))) return;
  selectingWorld = true;
  renderWorldPicker();
  try {
    if (saveGate === 'conflict') throw codedError('save-blocked');
    if (saveDirty && !saveGate) await saveWorld();
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    const result = await saveStore.load(selectedId);
    if (result.status === 'empty') throw codedError('world-not-found');
    saveExpected = result.expected;
    await saveStore.activateWorld(selectedId);
    if (result.status === 'corrupt') {
      worldId = selectedId;
      saveGate = 'corrupt';
      saveDirty = false;
      ui['save-recovery'].hidden = true;
      setSaveStatus('save.corrupt', 'error');
      setText(ui['load-status'], 'load.corrupt');
      const damaged = savedWorlds.find(entry => entry.worldId === selectedId);
      if (damaged) damaged.corrupt = true;
      worldName = customWorldName(damaged?.worldName);
      ui['world-name'].textContent = displayWorldName(worldName);
      return;
    }

    const recoveredPosition = installRecord(result.record);
    saveDirty = false;
    saveGate = result.status === 'recovery' ? 'recovery' : null;
    lastSavedAt = result.record.savedAt;
    if (result.status === 'recovery') {
      recoveryRecord = currentSnapshot();
      ui['save-recovery'].hidden = false;
      setText(ui['save-recovery-message'], result.migrated ? 'recovery.migrated' : 'recovery.current');
      setSaveStatus('save.recoveryPending', 'error');
      setText(ui['load-status'], 'load.recoveryReady');
    } else {
      ui['save-recovery'].hidden = true;
      setSavedStatus(lastSavedAt);
      showSavedDetails(result.record, 'details.labelLoaded');
      setText(ui['load-status'], recoveredPosition ? 'load.recoveredPosition' : 'load.ready');
      if (recoveredPosition) markDirty();
    }
    savedWorlds = await saveStore.listWorlds();
    worldPickerUnavailable = false;
    ui['start'].disabled = saveGate === 'recovery';
    ui['drag-start'].disabled = saveGate === 'recovery';
    ui['world-picker'].hidden = !keepPickerOpen;
    ui['play-actions'].hidden = keepPickerOpen;
    ui['secondary-actions'].hidden = keepPickerOpen;
  } catch (error) {
    if (error?.code === 'world-not-found') savedWorlds = await saveStore.listWorlds();
    reportError(error);
  } finally {
    selectingWorld = false;
    renderWorldPicker();
  }
}

async function openWorldPicker() {
  if (selectingWorld || transferringWorld || mutatingWorld || pendingWorldAction) return;
  if (saveGate === 'conflict') throw codedError('save-blocked');
  if (saveDirty && !saveGate) await saveWorld();
  savedWorlds = await saveStore.listWorlds();
  worldPickerUnavailable = false;
  ui['world-picker'].hidden = false;
  ui['play-actions'].hidden = true;
  ui['secondary-actions'].hidden = true;
  renderWorldPicker();
}

function prepareMusic() {
  if (!ui['music-on'].checked) return;
  music.start();
}

async function initializeMusic() {
  try {
    const tracks = await loadMusicCatalogue();
    music.tracks = tracks;
    for (const track of tracks) {
      const option = document.createElement('option');
      option.value = `track:${track.file}`;
      option.textContent = track.title;
      ui['music-choice'].append(option);
    }
    ui['music-choice'].options[0].disabled = !tracks.length;
    if (tracks.length) {
      music.setSelection('random');
      ui['music-status'].hidden = true;
    } else {
      setText(ui['music-status'], 'music.empty');
    }
  } catch (error) {
    console.error('Music catalogue:', error);
    ui['music-choice'].options[0].disabled = true;
    setText(ui['music-status'], 'music.catalogueFailed');
  }
  ui['music-choice'].value = music.selection;
  ui['music-choice'].disabled = !ui['music-on'].checked;
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
  ui['selected-material'].textContent = blockName(selected);
  ui.palette.replaceChildren();
  const first = PALETTE_STARTS[palettePage];
  for (let id = first; id < PALETTE_STARTS[palettePage + 1]; id++) {
    const slot = id - first + 1;
    const button = document.createElement('button');
    button.className = 'slot';
    button.dataset.id = id;
    button.title = `${slot}: ${blockName(id)}`;
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
    name.textContent = blockName(id);
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
  document.body.classList.remove('playing');
  music.stop();
  dragging = false;
  keys.clear();
  accumulator = 0;
  if (document.pointerLockElement === renderer.domElement) controls.unlock();
  ui.overlay.hidden = false;
  ui.crosshair.hidden = true;
  ui.pause.disabled = true;
  setText(ui.heading, 'pause.heading');
  setText(ui.intro, 'pause.intro');
  outline.visible = false;
  if (saveDirty) {
    saveWorld()
      .then(record => {
        if (record && !playing && !saveDirty && !saveGate) savedPauseNotice();
      })
      .catch(reportError);
  } else if (saveInitialized && !saveGate && lastSavedAt) {
    savedPauseNotice();
  }
}

function play(useDrag) {
  dragMode = useDrag;
  playing = true;
  document.body.classList.add('playing');
  if (ui['music-on'].checked) music.start();
  keys.clear();
  lastTime = performance.now();
  accumulator = 0;
  ui.overlay.hidden = true;
  ui.crosshair.hidden = false;
  ui.pause.disabled = false;
  ui['reset-confirm'].hidden = true;
  renderer.domElement.focus({ preventScroll: true });
  setText(ui['controls-hint'], useDrag ? 'hint.drag' : 'hint.pointer');
  ui['controls-hint'].hidden = introducedControlModes.has(useDrag);
  if (!ui['controls-hint'].hidden) {
    controlsHintUntil = performance.now() + 8000;
    introducedControlModes.add(useDrag);
  }
}

async function requestPlay() {
  setText(ui['load-status'], 'load.allowPrompt');
  try {
    if (!renderer.domElement.requestPointerLock) {
      setText(ui['load-status'], 'load.lockUnavailable');
      return;
    }
    prepareMusic();
    // r180 controls.lock discards the browser promise, leaving denials unhandled.
    await renderer.domElement.requestPointerLock();
  }
  catch (error) {
    console.error('Pointer lock:', error);
    pause();
    setText(ui['load-status'], 'load.lockFailed');
  }
}

function updateTarget() {
  camera.getWorldDirection(direction);
  target = pick(world, camera.position, direction);
  outline.visible = playing && Boolean(target);
  ui.target.hidden = !target;
  if (target) {
    const blockId = world.get(...target.cell);
    const block = BLOCKS[blockId];
    const height = block.height ?? 1;
    outline.scale.y = height;
    outline.position.set(target.cell[0] + 0.5, target.cell[1] + height / 2, target.cell[2] + 0.5);
    ui.target.textContent = blockName(blockId);
  }
}

let lastEdit = -Infinity;
function edit(place) {
  if (!playing || performance.now() - lastEdit < 140) return;
  lastEdit = performance.now();
  updateTarget();
  if (!target) { notice(t('notice.tooFar')); return; }
  const cell = target.cell.map((n, axis) => n + (place ? target.normal[axis] : 0));
  const error = world.edit(...cell, place ? selected : 0, player);
  if (error) { notice(t(error)); return; }
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
  if (!found) { notice(t('notice.noSafeSpot')); return; }
  player = found;
  camera.rotation.set(-0.13, 0, 0);
  syncCamera();
  updateChunks();
  markDirty();
  notice(t('notice.safe'));
}

ui['world-continue'].addEventListener('click', () => {
  const recent = savedWorlds.find(entry => !entry.corrupt);
  if (recent) selectSavedWorld(recent.worldId).catch(reportError);
});
ui['world-create'].addEventListener('click', () => ui['new-world'].click());
ui['world-import'].addEventListener('click', () => {
  ui['world-import-file'].value = '';
  ui['world-import-file'].click();
});
ui['world-import-file'].addEventListener('change', () => {
  const file = ui['world-import-file'].files[0];
  if (file) transferWorld(() => importWorldFile(file));
});
ui['choose-world'].addEventListener('click', () => openWorldPicker().catch(reportError));
ui['confirm-world-action'].addEventListener('click', () => confirmWorldAction());
ui['cancel-world-action'].addEventListener('click', closeWorldAction);
ui.start.addEventListener('click', requestPlay);
ui['drag-start'].addEventListener('click', () => { prepareMusic(); play(true); });
ui.pause.addEventListener('click', pause);
ui.recover.addEventListener('click', recover);
ui['new-world'].addEventListener('click', () => {
  if (selectingWorld || transferringWorld || mutatingWorld || pendingWorldAction ||
      !ui['reset-confirm'].hidden) return;
  returnToWorldPicker = !ui['world-picker'].hidden;
  worldFeedback = null;
  ui['world-picker'].hidden = true;
  ui['play-actions'].hidden = true;
  ui['secondary-actions'].hidden = true;
  setText(ui['reset-message'], ['recovery', 'corrupt', 'migration'].includes(saveGate) ?
    `reset.${saveGate}` : 'reset.normal');
  ui['reset-confirm'].hidden = false;
  ui['world-name-input'].value = suggestUniqueWorldName(
    savedWorlds.map(entry => entry.worldName || ''),
    new Date(),
    t('world.newDefault').toLocaleLowerCase(locale())
  );
  ui['world-name-input'].setCustomValidity('');
  renderWorldPicker();
  ui['world-name-input'].focus();
});
ui['cancel-reset'].addEventListener('click', () => {
  if (mutatingWorld) return;
  ui['reset-confirm'].hidden = true;
  ui['play-actions'].hidden = returnToWorldPicker;
  ui['secondary-actions'].hidden = returnToWorldPicker;
  renderWorldPicker();
  if (returnToWorldPicker) {
    ui['world-picker'].hidden = false;
    ui['world-create'].focus();
  } else {
    ui['new-world'].focus();
  }
  returnToWorldPicker = false;
});
ui['confirm-reset'].addEventListener('click', async () => {
  if (mutatingWorld || ui['reset-confirm'].hidden) return;
  const nextWorldName = ui['world-name-input'].value.trim();
  if (!nextWorldName) {
    ui['world-name-input'].setCustomValidity(t('world.nameRequired'));
    ui['world-name-input'].reportValidity();
    return;
  }
  ui['world-name-input'].setCustomValidity('');
  const returnToPicker = returnToWorldPicker;
  let created = false;
  mutatingWorld = true;
  ui['confirm-reset'].disabled = true;
  ui['cancel-reset'].disabled = true;
  ui['world-name-input'].disabled = true;
  updateSaveControls();
  renderWorldPicker();
  const replaceDamaged = ['recovery', 'corrupt', 'migration'].includes(saveGate);
  try {
    if (!replaceDamaged && saveDirty) await saveWorld();
    const nextWorld = new World(crypto.getRandomValues(new Uint32Array(1))[0]);
    const nextPlayer = createPlayer(nextWorld);
    const nextWorldId = crypto.randomUUID();
    const nextSnapshot = createSnapshot(nextWorld, nextPlayer, -0.13, 0,
      selected, { ...currentSettings(), musicSelection: 'random' },
      nextWorldId, customWorldName(nextWorldName));
    const record = await saveWorld({
      snapshot: nextSnapshot,
      replaceCorrupt: replaceDamaged,
      expected: { exists: false, revision: null, worldId: nextWorldId }
    });
    worldId = nextWorldId;
    worldName = customWorldName(nextWorldName);
    ui['world-name'].textContent = displayWorldName(worldName);
    installWorld(nextWorld, nextPlayer, 0, -0.13);
    applySettings(record.settings);
    created = true;
    saveDirty = false;
    saveGate = null;
    saveGeneration++;
    lastSavedAt = record.savedAt;
    edits = 0;
    setSavedStatus(record.savedAt);
    ui['save-recovery'].hidden = true;
    setText(ui['load-status'], 'load.newSaved');
    ui['start'].disabled = false;
    ui['drag-start'].disabled = false;
    savedWorlds = await saveStore.listWorlds();
    worldFeedback = { key: 'worldPicker.created', worldName };
  } catch (error) {
    console.error('New world:', error);
    worldFeedback = {
      key: created ? 'worldPicker.changedRefreshFailed' : 'worldPicker.actionFailed',
      error
    };
    if (!created) {
      setText(ui['load-status'], 'load.newFailed');
      setText(ui['reset-message'], 'worldPicker.actionFailed', { error: errorText(error) });
    }
    notice(errorText(error));
  } finally {
    mutatingWorld = false;
    ui['confirm-reset'].disabled = false;
    ui['cancel-reset'].disabled = false;
    ui['world-name-input'].disabled = false;
    if (created) {
      returnToWorldPicker = false;
      ui['reset-confirm'].hidden = true;
      ui['world-picker'].hidden = !returnToPicker;
      ui['play-actions'].hidden = returnToPicker;
      ui['secondary-actions'].hidden = returnToPicker;
    }
    updateSaveControls();
    renderWorldPicker();
    if (created) {
      if (returnToPicker) focusWorldOption();
      else ui['drag-start'].focus();
    } else ui['world-name-input'].focus();
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
    setSavedStatus(record.savedAt);
    ui['start'].disabled = false;
    ui['drag-start'].disabled = false;
    setText(ui['load-status'], 'load.restored');
    ui['drag-start'].focus();
  } catch (error) {
    console.error('Save recovery:', error);
    notice(errorText(error));
  } finally {
    ui['restore-backup'].disabled = false;
  }
});
ui['save-now'].addEventListener('click', () => {
  saveWorld()
    .then(() => notice(t('details.labelSaved'), 3000))
    .catch(error => {
      console.error(error);
      notice(t('notice.saveFailed', { error: errorText(error) }));
    });
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
    reportError(error);
  }
}

for (const link of document.querySelectorAll('a[href="../index.html"]')) {
  link.addEventListener('click', event => {
    event.preventDefault();
    navigateHome(link.href);
  });
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else notice(t('notice.noFullscreen'));
  } catch (error) {
    console.error('Fullscreen:', error);
    notice(t('notice.fullscreenFailed'));
  }
}
ui.fullscreen.addEventListener('click', toggleFullscreen);
ui['save-warning-pause'].addEventListener('click', pause);
ui['show-coordinates'].addEventListener('change', () => {
  document.body.classList.toggle('show-coordinates', ui['show-coordinates'].checked);
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
  ui['music-choice'].disabled = !ui['music-on'].checked;
  if (playing && ui['music-on'].checked) music.start();
  else music.stop();
  markDirty();
});
ui['music-choice'].addEventListener('change', () => {
  music.setSelection(ui['music-choice'].value);
  if (music.tracks.length) ui['music-status'].hidden = true;
  if (playing && ui['music-on'].checked) music.start();
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
  setText(ui['load-status'], 'load.lockDenied');
});
window.addEventListener('blur', () => { if (playing) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });
window.addEventListener('resize', resize);
window.addEventListener('keydown', event => {
  if (event.target instanceof HTMLElement &&
      event.target.closest('input, select, button, a, summary')) return;
  if (event.code === 'KeyF' && !event.repeat) {
    event.preventDefault();
    toggleFullscreen();
    return;
  }
  if (event.code === 'KeyH') { navigateHome('../index.html#top'); return; }
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
    saveWorld().catch(error => console.error('Save on page close:', error));
  }
});

function installRecord(record) {
  const nextWorld = applySnapshot(new World(record.seed), record);
  const savedPlayer = { ...record.player, vy: 0, grounded: false };
  let nextPlayer = savedPlayer;
  let recoveredPosition = false;
  if (collides(nextWorld, savedPlayer)) {
    nextPlayer = findSafePlayer(nextWorld);
    if (!nextPlayer) throw new CorruptSaveError('No safe place was found in the saved world.');
    recoveredPosition = true;
  }
  installWorld(nextWorld, nextPlayer, record.player.yaw, record.player.pitch);
  worldId = record.worldId;
  worldName = customWorldName(record.worldName);
  ui['world-name'].textContent = displayWorldName(worldName);
  select(record.selectedBlock, false);
  applySettings(record.settings);
  edits = 0;
  return recoveredPosition;
}

async function initializeSave() {
  setText(ui['load-status'], 'load.loading');
  try {
    const result = await saveStore.load();
    saveExpected = result.expected;
    if (result.status === 'current') {
      const recoveredPosition = installRecord(result.record);
      await saveStore.activateWorld(result.record.worldId);
      lastSavedAt = result.record.savedAt;
      setSavedStatus(lastSavedAt);
      showSavedDetails(result.record, 'details.labelLoaded');
      setText(ui['load-status'], recoveredPosition ? 'load.recoveredPosition' :
        result.migrated ? 'load.migrated' : 'load.ready');
      if (recoveredPosition) markDirty();
    } else if (result.status === 'recovery') {
      installRecord(result.record);
      await saveStore.activateWorld(result.record.worldId);
      recoveryRecord = currentSnapshot();
      lastSavedAt = result.record.savedAt;
      saveGate = 'recovery';
      ui['save-recovery'].hidden = false;
      setText(ui['save-recovery-message'], result.migrated ? 'recovery.migrated' : 'recovery.current');
      setSaveStatus('save.recoveryPending', 'error');
      setText(ui['load-status'], 'load.recoveryReady');
      ui['start'].disabled = true;
      ui['drag-start'].disabled = true;
    } else if (result.status === 'corrupt') {
      saveGate = 'corrupt';
      saveDirty = false;
      setText(ui['load-status'], 'load.corrupt');
      setSaveStatus('save.corrupt', 'error');
      setText(ui['session-note'], 'session.temporary');
    } else {
      saveDirty = false;
      saveGeneration++;
      setSaveStatus('save.noWorld');
      setText(ui['load-status'], 'load.noWorld');
    }
    savedWorlds = await saveStore.listWorlds();
  } catch (error) {
    console.error('Loading save:', error);
    if (error instanceof SaveMigrationError) saveGate = 'migration';
    else if (error instanceof CorruptSaveError && saveExpected.exists) saveGate = 'corrupt';
    saveDirty = true;
    saveGeneration++;
    setSaveStatus(saveGate === 'migration' ? 'save.migrationFailed' :
      saveGate === 'corrupt' ? 'save.corrupt' : 'save.loadFailed', 'error');
    setText(ui['session-note'], saveGate === 'migration' ? 'session.migration' : 'session.unconfirmed');
    setText(ui['load-status'], saveGate === 'migration' ? 'load.migrationFailed' : 'load.saveUnavailable');
    worldPickerUnavailable = true;
    notice(errorText(error));
  } finally {
    saveInitialized = true;
    ui['recover'].disabled = saveGate === 'recovery';
    ui['new-world'].disabled = false;
    ui['world-picker'].hidden = false;
    ui['play-actions'].hidden = true;
    ui['secondary-actions'].hidden = true;
    renderWorldPicker();
    if (worldPickerUnavailable && !saveGate) {
      ui['world-picker'].hidden = true;
      ui['play-actions'].hidden = false;
      ui['secondary-actions'].hidden = false;
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
  setText(ui['load-status'], 'load.webglLost');
  for (const id of ['start', 'drag-start', 'recover', 'new-world']) ui[id].disabled = true;
});

function updateCoordinates() {
  ui.coordinates.textContent =
    `${biomeName(biomeAt(player.x, player.z))} · X ${Math.floor(player.x)} · Z ${Math.floor(player.z)}`;
  ui['pause-coordinates'].textContent = ui.coordinates.textContent;
}

onLanguageChange(() => {
  renderPalette();
  renderDestinations();
  renderWorldPicker();
  renderWorldAction();
  renderSaveDetails();
  updateCoordinates();
  ui['world-name'].textContent = displayWorldName(worldName);
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
      console.error('Music:', error);
      music.stop();
      notice(t('music.stopped'));
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
    ui.metrics.textContent = t('metrics.text', {
      revision: THREE.REVISION,
      size: SIZE.join(' × '),
      seed: world.seed,
      fps,
      calls: renderer.info.render.calls,
      geometries: renderer.info.memory.geometries,
      resolution: `${renderer.domElement.width} × ${renderer.domElement.height}`,
      pixelRatio: renderer.getPixelRatio().toFixed(2),
      first: Math.round(firstFrameMs),
      samples: sorted.length,
      median: (sorted[Math.floor(sorted.length / 2)] || 0).toFixed(1),
      p95: (sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1),
      edits,
      position: `${player.x.toFixed(1)}, ${player.y.toFixed(1)}, ${player.z.toFixed(1)}`
    });
    updateCoordinates();
  }
  if (!ui['controls-hint'].hidden && now > controlsHintUntil) ui['controls-hint'].hidden = true;
  waterTexture.offset.set(now * 0.000006 % 1, now * 0.000002 % 1);
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
}

resize();
syncCamera();
updateChunks();
camera.rotation.x = -0.13;
renderer.setAnimationLoop(frame);
await initializeMusic();
await initializeSave();
