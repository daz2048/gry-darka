'use strict';

const WIDTH = 360;
const HEIGHT = 640;
const GROUND = 576;
const SPEED = 140;
const GAP = 180;
const SPACING = 230;
const STORAGE_KEY = 'flappy-podlasie-v2';
const SKINS = [
  { id: 'classic', name: 'Zloty ptak', price: 0, colors: [0xffd34f, 0xfff2ac, 0xe9a43c, 0xfff0b5] },
  { id: 'mint', name: 'Mieta', price: 0, colors: [0x73d9b0, 0xc7ffe0, 0x399c82, 0xd8fff0] },
  { id: 'blue', name: 'Blekit', price: 0, colors: [0x70b9ee, 0xccefff, 0x397bb9, 0xe4f6ff] },
  { id: 'rose', name: 'Roza', price: 0, colors: [0xf08eb0, 0xffd5e6, 0xb95180, 0xffe6ef] },
  { id: 'ember', name: 'Iskierka', price: 10, colors: [0xff9454, 0xffdc9a, 0xc55037, 0xffe5b6] },
  { id: 'ice', name: 'Lodowy', price: 10, colors: [0x8fe6ec, 0xe0ffff, 0x4aa6bc, 0xf0ffff] },
  { id: 'plum', name: 'Sliwka', price: 15, colors: [0xb891df, 0xe9d5ff, 0x7b55ac, 0xf5eaff] },
  { id: 'lime', name: 'Limonka', price: 15, colors: [0xb9df58, 0xeeffb0, 0x78972f, 0xf0ffd1] },
  { id: 'robin', name: 'Rudzik', price: 20, colors: [0xbc8a65, 0xf1d1ac, 0x88573e, 0xe87955] },
  { id: 'canary', name: 'Kanarek', price: 20, colors: [0xffe879, 0xfffbd1, 0xd4b33b, 0xffffff] },
  { id: 'raven', name: 'Kruk', price: 25, colors: [0x60657c, 0x9ca8c6, 0x383c50, 0x8894af] },
  { id: 'snow', name: 'Sniezka', price: 25, colors: [0xe8eef2, 0xffffff, 0xa2b4c4, 0xd2dfe9] },
  { id: 'ninja', name: 'Ninja', price: 30, colors: [0x555f74, 0x909db5, 0x343b50, 0x737e93], outfit: 'ninja' },
  { id: 'pirate', name: 'Pirat', price: 35, colors: [0xe7b56b, 0xffdfac, 0xb77b44, 0xffedc9], outfit: 'pirate' },
  { id: 'aviator', name: 'Pilot', price: 35, colors: [0xdaaa78, 0xffdbac, 0x98633e, 0xf8e2c5], outfit: 'aviator' },
  { id: 'wizard', name: 'Czarodziej', price: 40, colors: [0x9c9ae8, 0xdcdcff, 0x6666ae, 0xe7e6ff], outfit: 'wizard' },
  { id: 'royal', name: 'Krol', price: 50, colors: [0xe3aa55, 0xffe3a8, 0xa86a38, 0xfff0cf], outfit: 'royal' },
  { id: 'astronaut', name: 'Astronauta', price: 50, colors: [0xdbe8e9, 0xffffff, 0x8da7b7, 0xf0ffff], outfit: 'astronaut' },
  { id: 'robot', name: 'Robot', price: 60, colors: [0x93abbc, 0xd4e7ef, 0x5d768f, 0xb3cad8], outfit: 'robot' },
  { id: 'bee', name: 'Pszczolka', price: 30, colors: [0xffcc48, 0xffed9a, 0xd39733, 0xf0fbff], outfit: 'bee' },
  { id: 'ladybug', name: 'Biedronka', price: 30, colors: [0xee695d, 0xffb7a3, 0xb83f44, 0xef8275], outfit: 'ladybug' },
  { id: 'sailor', name: 'Marynarz', price: 35, colors: [0xa3d1ef, 0xe0f3ff, 0x5e99c2, 0xffffff], outfit: 'sailor' },
  { id: 'santa', name: 'Mikolaj', price: 40, colors: [0xe88172, 0xffd6b8, 0xb75553, 0xffead9], outfit: 'santa' },
  { id: 'pumpkin', name: 'Dynia', price: 45, colors: [0xee9946, 0xffd58a, 0xb46132, 0xffc36e], outfit: 'pumpkin' },
  { id: 'unicorn', name: 'Jednorozec', price: 60, colors: [0xf4c6ee, 0xffefff, 0xc18dbd, 0xd5f3ff], outfit: 'unicorn' },
  { id: 'flower', name: 'Kwiatuszek', price: 45, colors: [0xf4b288, 0xffe4bd, 0xc57866, 0xffe8cd], outfit: 'flower' },
  { id: 'chef', name: 'Kucharz', price: 40, colors: [0xeed5aa, 0xfff3d9, 0xba946d, 0xffffff], outfit: 'chef' },
  { id: 'cowboy', name: 'Kowboj', price: 45, colors: [0xc79d6c, 0xf4d8ac, 0x8c633e, 0xffe8c9], outfit: 'cowboy' },
  { id: 'detective', name: 'Detektyw', price: 50, colors: [0xa6b6a1, 0xdce9ca, 0x72816c, 0xe1e7d2], outfit: 'detective' },
  { id: 'cyber', name: 'Neon', price: 70, colors: [0x6acbb8, 0xbaffeb, 0x348e88, 0xa0e7e1], outfit: 'cyber' },
  { id: 'phoenix', name: 'Feniks', price: 100, colors: [0xf38c48, 0xffe18c, 0xc44e3a, 0xffcf56], outfit: 'phoenix' },
  { id: 'gentleman', name: 'Golab elegant', price: 120, outfit: 'pigeon' }
];
const FREE_SKINS = SKINS.filter(skin => skin.price === 0).map(skin => skin.id);
const ui = Object.fromEntries(['score', 'best', 'overlay', 'eyebrow', 'title', 'result', 'primary', 'sound', 'pause', 'immortal', 'notice', 'fatal', 'wallet', 'shop', 'shop-open', 'shop-close', 'shop-grid', 'shop-wallet', 'shop-status', 'filter-all', 'filter-owned'].map(id => [id, document.getElementById(id)]));
let preferences = { best: 0, muted: false, coins: 0, owned: [...FREE_SKINS], equipped: 'classic' };
let shopFilter = 'all';
let scene;
let audio;
const music = { timer: null, step: 0, nextTime: 0, output: null, voices: new Set() };
const MUSIC_STEP = 60 / 108 / 2;
const MUSIC_MELODY = [
  [76, 79, 81, 79, 76, null, 74, 72],
  [76, 81, 84, 83, 81, null, 79, 76],
  [77, 81, 79, 77, 76, null, 74, 77],
  [79, 83, 81, 79, 74, null, 71, 74],
  [76, 79, 84, 83, 81, 79, 76, null],
  [81, 84, 88, 84, 83, 81, 79, 76],
  [77, 81, 84, 81, 79, 77, 76, 74],
  [79, 83, 81, 79, 76, 74, 72, null]
];
const MUSIC_CHORDS = [
  [48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62],
  [48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]
];

function musicNote(note, time, duration, waveform, level) {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  const voice = { oscillator, envelope };
  oscillator.type = waveform;
  oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
  envelope.gain.value = .0001;
  envelope.gain.setValueAtTime(.0001, time);
  envelope.gain.exponentialRampToValueAtTime(level, time + .012);
  envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
  oscillator.connect(envelope);
  envelope.connect(music.output);
  music.voices.add(voice);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
    music.voices.delete(voice);
  };
  oscillator.start(time);
  oscillator.stop(time + duration + .01);
}

function stopMusic() {
  if (music.timer !== null) clearInterval(music.timer);
  music.timer = null;
  for (const voice of music.voices) {
    voice.envelope.gain.cancelScheduledValues(audio.currentTime);
    voice.envelope.gain.setTargetAtTime(.0001, audio.currentTime, .008);
    voice.oscillator.stop(audio.currentTime + .03);
  }
  music.voices.clear();
}

function scheduleMusic() {
  if (preferences.muted || scene?.state !== 'playing' || document.hidden || audio?.state !== 'running') {
    stopMusic();
    return;
  }
  music.nextTime = Math.max(music.nextTime, audio.currentTime + .02);
  while (music.nextTime < audio.currentTime + .18) {
    const bar = Math.floor(music.step / 8);
    const beat = music.step % 8;
    const melody = MUSIC_MELODY[bar][beat];
    const chord = MUSIC_CHORDS[bar];
    if (melody !== null) musicNote(melody, music.nextTime, MUSIC_STEP * .82, 'square', .024);
    musicNote(chord[1 + beat % 3], music.nextTime, MUSIC_STEP * .65, 'triangle', .025);
    if (beat % 2 === 0) musicNote(chord[0] + (beat === 4 ? 7 : 0), music.nextTime, MUSIC_STEP * 1.6, 'sine', .07);
    music.nextTime += MUSIC_STEP;
    music.step = (music.step + 1) % (MUSIC_MELODY.length * 8);
  }
}

function syncMusic() {
  if (preferences.muted || scene?.state !== 'playing' || document.hidden || audio?.state !== 'running') {
    stopMusic();
    return;
  }
  if (music.timer !== null) return;
  if (!music.output) {
    music.output = audio.createGain();
    music.output.gain.value = .5;
    music.output.connect(audio.destination);
  }
  music.nextTime = audio.currentTime + .04;
  scheduleMusic();
  music.timer = setInterval(scheduleMusic, 60);
}

function storageFailure(error) {
  ui.notice.textContent = `Nie mozna zapisac postepu gry i sklepu: localStorage/${STORAGE_KEY}. ${error.name || 'Blad pamieci'}. Gra dziala bez zapisu.`;
  ui.notice.hidden = false;
}

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved && typeof saved === 'object') {
    preferences.best = Number.isSafeInteger(saved.best) && saved.best >= 0 ? saved.best : 0;
    preferences.muted = saved.muted === true;
    preferences.coins = Number.isSafeInteger(saved.coins) && saved.coins >= 0 ? saved.coins : 0;
    preferences.owned = [...new Set([...FREE_SKINS, ...(Array.isArray(saved.owned) ? saved.owned.filter(id => SKINS.some(skin => skin.id === id)) : [])])];
    preferences.equipped = preferences.owned.includes(saved.equipped) ? saved.equipped : 'classic';
  }
} catch (error) {
  storageFailure(error);
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }
  catch (error) { storageFailure(error); }
}

function unlockAudio() {
  if (preferences.muted) { stopMusic(); return; }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    audio ||= new AudioContext();
    if (audio.state === 'suspended') audio.resume().then(syncMusic).catch(() => {});
    else syncMusic();
  } catch { audio = null; }
}

function tone(frequency, duration, endFrequency = frequency) {
  if (preferences.muted || !audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator();
  const volume = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, audio.currentTime + duration);
  volume.gain.setValueAtTime(.055, audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(volume);
  volume.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
  oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
}

function renderSound() {
  ui.sound.setAttribute('aria-pressed', String(!preferences.muted));
  ui.sound.style.opacity = preferences.muted ? '.5' : '1';
}

function drawSkinBody(pen, colors, frame) {
  const paint = (path, color) => {
    pen.fillStyle = typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color;
    pen.fill(new Path2D(path));
  };
  paint('M12 16H4v4H2v6h12Z', '#4b3b32');
  paint('M10 18H6v4H4v2h8Z', '#e6a23d');
  paint('M16 4h14v2h6v4h4v6h2v10h-4v4h-6v2H16v-2h-6v-4H6V14h4V8h6Z', '#4b3b32');
  paint('M16 6h14v2h6v4h2v12h-2v4h-6v2H16v-2h-4v-4H8V14h4v-4h4Z', colors[0]);
  paint('M16 6h12v2H16ZM12 10h8v2h-8ZM10 14h4v2h-4Z', colors[1]);
  paint('M10 22h6v4h16v-2h6v2h-2v2h-6v2H16v-2h-4v-4h-2Z', colors[2]);
  paint('M20 24h14v2h-4v2H18v-2h2Z', colors[3]);
  paint('M28 8h6v2h4v12H26V10h2Z', '#4b3b32');
  paint('M28 10h6v2h2v8h-8Z', '#fffdf1');
  paint('M32 12h4v6h-4Z', '#34382f');
  paint('M32 12h2v2h-2Z', '#ffffff');
  paint('M38 18h6v2h4v6H36v-2h-2v-4h4Z', '#4b3b32');
  paint('M38 20h6v2h2v2H36v-2h2Z', '#ed8550');
  paint('M38 20h6v2h-6Z', '#ffb36b');
  paint('M26 22h4v2h-4Z', '#edaa55');
  const wings = [
    ['M12 18h8v2h2v6h-4v2h-6v-2h-2v-6h2Z', 'M12 20h8v4h-4v2h-4Z', 'M12 24h4v2h-4Z'],
    ['M10 16h10v2h2v6H10v-2H8v-4h2Z', 'M10 18h10v4H10Z', 'M10 20h4v2h-4Z'],
    ['M10 10h6v2h4v4h2v6H12v-4h-2Z', 'M12 12h2v2h4v4h2v2h-6v-4h-2Z', 'M14 18h6v2h-6Z']
  ];
  paint(wings[frame][0], '#805337');
  paint(wings[frame][1], colors[3]);
  paint(wings[frame][2], '#e9bf69');
}

function createSkinTextures(owner) {
  for (const skin of SKINS) {
    const canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 36;
    const pen = canvas.getContext('2d');
    pen.imageSmoothingEnabled = false;
    if (skin.outfit === 'pigeon') pen.drawImage(owner.textures.get('pigeon-sheet').getSourceImage(), 0, 0);
    for (let frame = 0; frame < 3; frame++) {
      pen.save();
      pen.translate(frame * 48, 0);
      if (skin.colors) drawSkinBody(pen, skin.colors, frame);
      const block = (color, left, top, width, height) => { pen.fillStyle = color; pen.fillRect(left, top, width, height); };
      switch (skin.outfit) {
        case 'ninja': block('#d45257', 7, 8, 30, 4); block('#d45257', 1, 10, 8, 3); block('#34382f', 24, 18, 14, 6); break;
        case 'pirate': block('#34382f', 12, 2, 22, 8); block('#34382f', 7, 8, 32, 4); block('#fff5d5', 22, 4, 4, 4); block('#34382f', 31, 12, 6, 6); break;
        case 'aviator': block('#79533d', 14, 3, 21, 6); block('#79533d', 10, 8, 6, 8); block('#34382f', 23, 10, 16, 8); block('#8bd9df', 26, 12, 10, 4); break;
        case 'wizard': block('#55598e', 10, 8, 28, 4); block('#55598e', 16, 4, 16, 4); block('#55598e', 22, 0, 7, 4); block('#ffdf70', 24, 5, 3, 3); break;
        case 'royal': block('#a96b2f', 12, 6, 24, 6); block('#ffdb55', 14, 4, 20, 6); block('#ffdb55', 14, 0, 4, 5); block('#ffdb55', 22, 0, 4, 5); block('#ffdb55', 30, 0, 4, 5); block('#df6674', 22, 6, 4, 3); break;
        case 'astronaut': block('#607e9a', 22, 3, 19, 21); block('#e4faff', 24, 5, 15, 17); block('#8bd9df', 26, 8, 11, 12); block('#fff', 27, 8, 3, 7); block('#df6674', 10, 23, 7, 5); break;
        case 'robot': block('#485e74', 25, 7, 14, 15); block('#6bf5b0', 28, 12, 8, 4); block('#485e74', 23, 0, 3, 7); block('#df6674', 21, 0, 7, 3); break;
        case 'bee': block('#34382f', 10, 12, 4, 14); block('#34382f', 20, 23, 4, 6); block('#34382f', 14, 0, 2, 7); block('#34382f', 25, 0, 2, 5); break;
        case 'ladybug': block('#34382f', 10, 10, 4, 4); block('#34382f', 18, 7, 4, 4); block('#34382f', 21, 25, 4, 4); block('#34382f', 10, 24, 4, 4); break;
        case 'sailor': block('#fff9ec', 12, 3, 23, 5); block('#416eab', 11, 8, 25, 3); block('#416eab', 25, 23, 12, 4); block('#e47063', 30, 26, 4, 6); break;
        case 'santa': block('#cb4f50', 15, 3, 18, 6); block('#cb4f50', 21, 0, 10, 3); block('#fff9ec', 12, 8, 25, 4); block('#fff9ec', 31, 1, 6, 6); block('#fff9ec', 26, 24, 10, 6); break;
        case 'pumpkin': block('#5b8f4b', 22, 0, 5, 7); block('#5b8f4b', 27, 2, 7, 3); block('#a96532', 11, 13, 2, 10); block('#a96532', 21, 24, 2, 5); break;
        case 'unicorn': block('#f1ce65', 25, 0, 4, 10); block('#fff2bc', 26, 0, 2, 6); block('#c98ac0', 12, 5, 8, 4); block('#8bd9df', 8, 9, 6, 5); break;
        case 'flower': block('#e888ad', 15, 2, 18, 6); block('#e888ad', 20, 0, 7, 10); block('#ffe380', 21, 3, 5, 4); block('#70a876', 10, 8, 6, 3); break;
        case 'chef': block('#b0bdc4', 14, 4, 22, 8); block('#fffdf2', 16, 1, 18, 9); block('#fffdf2', 12, 3, 6, 6); block('#fffdf2', 32, 3, 6, 6); block('#d36a60', 28, 24, 8, 4); break;
        case 'cowboy': block('#79533d', 9, 8, 30, 4); block('#a77b48', 15, 2, 18, 7); block('#e4bd6f', 17, 7, 14, 2); block('#bf5752', 28, 23, 9, 6); break;
        case 'detective': block('#596756', 9, 8, 29, 4); block('#9bac86', 15, 3, 17, 6); block('#596756', 16, 6, 15, 3); block('#e1d7b4', 29, 24, 5, 8); break;
        case 'cyber': block('#343c55', 23, 10, 17, 10); block('#f186bc', 25, 12, 13, 3); block('#87fff0', 10, 6, 8, 3); break;
        case 'phoenix': block('#e96e43', 12, 4, 7, 6); block('#e96e43', 17, 0, 5, 7); block('#ffdf70', 19, 2, 3, 6); block('#f19c45', 1, 18, 7, 6); break;
      }
      pen.restore();
    }
    owner.textures.addSpriteSheet(`skin-${skin.id}`, canvas, { frameWidth: 48, frameHeight: 36 });
  }
}

function renderWallet() {
  ui.wallet.textContent = preferences.coins;
  ui['shop-wallet'].textContent = preferences.coins;
}

function renderShop() {
  renderWallet();
  ui['filter-all'].setAttribute('aria-pressed', String(shopFilter === 'all'));
  ui['filter-owned'].setAttribute('aria-pressed', String(shopFilter === 'owned'));
  const scroll = ui['shop-grid'].scrollTop;
  const fragment = document.createDocumentFragment();
  for (const skin of SKINS) {
    const owned = preferences.owned.includes(skin.id);
    if (shopFilter === 'owned' && !owned) continue;
    const selected = preferences.equipped === skin.id;
    const card = document.createElement('article');
    card.className = `skin-card${selected ? ' selected' : ''}`;
    card.dataset.skin = skin.id;
    card.tabIndex = -1;
    card.innerHTML = '<canvas width="144" height="90" aria-hidden="true"></canvas><h3></h3><span class="skin-price"></span><button type="button"></button>';
    const preview = card.querySelector('canvas').getContext('2d');
    preview.imageSmoothingEnabled = false;
    preview.drawImage(scene.textures.get(`skin-${skin.id}`).getSourceImage(), 48, 0, 48, 36, 24, 9, 96, 72);
    card.querySelector('h3').textContent = skin.name;
    card.querySelector('.skin-price').textContent = owned ? 'W kolekcji' : `${skin.price} monet`;
    const button = card.querySelector('button');
    button.dataset.skin = skin.id;
    button.textContent = selected ? 'Wybrana' : owned ? 'Wybierz' : 'Kup';
    button.disabled = selected || (!owned && preferences.coins < skin.price);
    button.setAttribute('aria-label', `${button.textContent}: ${skin.name}${owned ? '' : `, ${skin.price} monet`}`);
    if (!owned && preferences.coins < skin.price) button.title = 'Za malo monet';
    fragment.append(card);
  }
  ui['shop-grid'].replaceChildren(fragment);
  ui['shop-grid'].scrollTop = scroll;
}

function openShop() {
  if (!scene?.bird || ui.shop.open) return;
  scene.pauseFlight();
  renderShop();
  ui['shop-status'].textContent = '';
  ui.shop.showModal();
  ui['shop-close'].focus();
}

function closeShop() {
  ui.shop.close();
  ui['shop-open'].focus();
}

function selectSkin(id) {
  const skin = SKINS.find(skin => skin.id === id);
  if (!skin || !ui.shop.open) return;
  if (!preferences.owned.includes(id)) {
    if (preferences.coins < skin.price) return;
    preferences.coins -= skin.price;
    preferences.owned.push(id);
  }
  preferences.equipped = id;
  scene.applySkin();
  save();
  renderShop();
  ui['shop-status'].textContent = `Wybrano: ${skin.name}`;
  ui['shop-grid'].querySelector(`article[data-skin="${id}"]`).focus({ preventScroll: true });
}

function showOverlay(title, result, button, eyebrow) {
  ui.title.textContent = title;
  ui.result.textContent = result;
  ui.primary.textContent = button;
  ui.eyebrow.textContent = eyebrow;
  ui.overlay.hidden = false;
}

function boot() {
  if (!window.Phaser) { ui.fatal.hidden = false; return; }

  class FlightScene extends Phaser.Scene {
    constructor() { super('flight'); }

    preload() {
      this.load.image('bird-sheet', 'assets/bird.svg');
      this.load.image('pigeon-sheet', 'assets/pigeon.svg');
      this.load.image('landscape', 'assets/landscape.svg');
      this.load.on('loaderror', () => { ui.fatal.hidden = false; });
    }

    create() {
      scene = this;
      this.state = 'ready';
      this.points = 0;
      this.immortal = false;
      this.lastGap = 290;
      this.background = this.add.tileSprite(180, 320, WIDTH, HEIGHT, 'landscape');
      this.textures.addSpriteSheet('bird', this.textures.get('bird-sheet').getSourceImage(), { frameWidth: 48, frameHeight: 36 });
      this.textures.addSpriteSheet('pigeon', this.textures.get('pigeon-sheet').getSourceImage(), { frameWidth: 48, frameHeight: 36 });
      createSkinTextures(this);
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0x324d35).fillRect(0, 0, 58, 640);
      graphics.fillStyle(0x527f38).fillRect(3, 0, 52, 640);
      graphics.fillStyle(0x82bd45).fillRect(6, 0, 37, 640);
      graphics.fillStyle(0xbde66b).fillRect(9, 0, 8, 640);
      graphics.fillStyle(0x9bd654).fillRect(20, 0, 6, 640);
      graphics.fillStyle(0x669f3b).fillRect(43, 0, 6, 640);
      graphics.generateTexture('pipe', 58, 640);
      graphics.clear();
      graphics.fillStyle(0x324d35).fillRect(0, 0, 70, 18);
      graphics.fillStyle(0x82bd45).fillRect(3, 3, 64, 12);
      graphics.fillStyle(0xbde66b).fillRect(6, 3, 8, 12).fillRect(6, 3, 55, 3);
      graphics.fillStyle(0x527f38).fillRect(58, 6, 9, 9);
      graphics.generateTexture('cap', 70, 18);
      graphics.clear();
      graphics.fillStyle(0xe8d8a1).fillRect(0, 0, 360, 64);
      graphics.fillStyle(0x324d35).fillRect(0, 0, 360, 3);
      graphics.fillStyle(0xc4e77b).fillRect(0, 3, 360, 6);
      graphics.fillStyle(0x82bd45).fillRect(0, 9, 360, 12);
      graphics.fillStyle(0x5c963c);
      for (let position = -12; position < 360; position += 24) {
        graphics.fillRect(position, 9, 9, 3).fillRect(position + 3, 12, 9, 3).fillRect(position + 6, 15, 9, 3).fillRect(position + 9, 18, 9, 3);
      }
      graphics.fillStyle(0x8e8857).fillRect(0, 21, 360, 3);
      graphics.fillStyle(0xf6edbf).fillRect(0, 24, 360, 3);
      graphics.generateTexture('ground', 360, 64);
      graphics.destroy();
      this.ground = this.add.tileSprite(180, 608, WIDTH, 64, 'ground').setDepth(4);
      this.obstacles = [];
      this.bird = this.physics.add.sprite(104, 285, `skin-${preferences.equipped}`).setDepth(3);
      this.bird.body.setSize(29, 23).setOffset(7, 7);
      this.bird.body.setAllowGravity(false);
      this.input.on('pointerdown', () => this.flap());
      this.input.keyboard.addCapture(['SPACE', 'UP']);
      this.input.keyboard.on('keydown', event => {
        if (ui.shop.open) return;
        if (event.repeat || event.target.closest('button, a, input')) return;
        if (event.code === 'Space' || event.code === 'ArrowUp') this.flap();
        if (event.code === 'KeyP') this.togglePause();
        if (event.code === 'KeyM') this.toggleImmortality();
        if (event.code === 'KeyS') ui.sound.click();
        if (event.code === 'KeyB') openShop();
        if (event.code === 'KeyH' || event.code === 'Escape') window.location.href = '../index.html';
      });
      this.game.events.on(Phaser.Core.Events.BLUR, () => this.pauseFlight());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pauseFlight();
      });
      ui.best.textContent = preferences.best;
      renderWallet();
      ui['shop-open'].disabled = false;
      ui.primary.disabled = false;
      window.dispatchEvent(new Event('flappy-ready'));
    }

    startFlight() {
      unlockAudio();
      this.obstacles.forEach(pair => { pair.parts.forEach(part => part.destroy()); });
      this.obstacles = [];
      this.points = 0;
      this.lastGap = 290;
      ui.score.textContent = '0';
      ui.overlay.hidden = true;
      ui.pause.disabled = false;
      ui.pause.setAttribute('aria-pressed', 'false');
      this.state = 'playing';
      music.step = 0;
      syncMusic();
      this.physics.world.resume();
      this.bird.setPosition(104, 285).setAngle(-15);
      this.bird.body.reset(104, 285);
      this.bird.body.setAllowGravity(true);
      this.bird.body.setVelocity(0, -310);
      this.addPair(460);
      this.addPair(460 + SPACING);
      this.addPair(460 + SPACING * 2);
      tone(600, .1, 850);
    }

    addPair(position) {
      const center = Phaser.Math.Clamp(this.lastGap + Phaser.Math.Between(-45, 45), 190, 390);
      this.lastGap = center;
      const upperEdge = center - GAP / 2;
      const lowerEdge = center + GAP / 2;
      const top = this.add.image(position, upperEdge, 'pipe').setOrigin(.5, 1);
      const bottom = this.add.image(position, lowerEdge, 'pipe').setOrigin(.5, 0);
      const upperCap = this.add.image(position, upperEdge - 9, 'cap');
      const lowerCap = this.add.image(position, lowerEdge + 9, 'cap');
      this.obstacles.push({ x: position, upperEdge, lowerEdge, scored: false, parts: [top, bottom, upperCap, lowerCap] });
    }

    flap() {
      if (this.state !== 'playing') return;
      unlockAudio();
      this.bird.body.setVelocityY(-310);
      tone(560, .075, 780);
    }

    toggleImmortality() {
      this.immortal = !this.immortal;
      this.applySkin();
      ui.immortal.hidden = !this.immortal;
    }

    applySkin() {
      this.bird.setTexture(this.immortal ? 'pigeon' : `skin-${preferences.equipped}`, this.bird.frame.name);
    }

    pauseFlight() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      syncMusic();
      this.physics.world.pause();
      ui.pause.setAttribute('aria-pressed', 'true');
      showOverlay('Chwila oddechu', `Wynik: ${this.points}`, 'Wracamy', 'PAUZA');
    }

    togglePause() {
      if (this.state === 'playing') this.pauseFlight();
      else if (this.state === 'paused') {
        this.state = 'playing';
        unlockAudio();
        this.physics.world.resume();
        ui.overlay.hidden = true;
        ui.pause.setAttribute('aria-pressed', 'false');
      }
    }

    endFlight() {
      if (this.state !== 'playing') return;
      this.state = 'over';
      syncMusic();
      this.physics.world.pause();
      ui.pause.disabled = true;
      const newBest = this.points > preferences.best;
      if (newBest) { preferences.best = this.points; save(); }
      ui.best.textContent = preferences.best;
      this.cameras.main.shake(100, .003);
      tone(180, .2, 65);
      showOverlay('Jeszcze jeden lot?', `Wynik: ${this.points} / Rekord: ${preferences.best}`, 'Jeszcze raz', newBest ? 'NOWY REKORD!' : 'KONIEC LOTU');
      ui.primary.disabled = true;
      this.time.delayedCall(350, () => { ui.primary.disabled = false; });
    }

    update(time, delta) {
      if (!this.bird) return;
      if (this.state === 'ready') this.bird.y = 345 + Math.sin(time / 300) * 7;
      if (this.state === 'playing' || this.state === 'ready') this.bird.setFrame(Math.floor(time / 110) % 3);
      if (this.state !== 'playing') return;
      const movement = SPEED * (this.immortal ? 4 : 1) * delta / 1000;
      this.background.tilePositionX += movement * .18;
      this.ground.tilePositionX += movement;
      this.bird.angle = Phaser.Math.Clamp(this.bird.body.velocity.y / 9, -25, 70);
      const body = this.bird.body;
      if (body.top <= 0 || body.bottom >= GROUND) {
        if (!this.immortal) { this.endFlight(); return; }
        body.reset(this.bird.x, this.bird.y);
        const correction = body.top < 0 ? -body.top : Math.min(0, GROUND - body.bottom);
        body.reset(this.bird.x, this.bird.y + correction);
        body.setVelocityY(0);
      }
      for (const pair of this.obstacles) {
        pair.x -= movement;
        pair.parts.forEach(part => { part.x = pair.x; });
        if (!this.immortal && body.right > pair.x - 35 && body.left < pair.x + 35 && (body.top < pair.upperEdge || body.bottom > pair.lowerEdge)) {
          this.endFlight();
          return;
        }
        if (!pair.scored && pair.x + 35 < body.left) {
          pair.scored = true;
          this.points += 1;
          preferences.coins = Math.min(Number.MAX_SAFE_INTEGER, preferences.coins + 5);
          renderWallet();
          save();
          ui.score.textContent = this.points;
          tone(880, .13, 1320);
        }
      }
      if (this.obstacles[0].x < -40) {
        const old = this.obstacles.shift();
        old.parts.forEach(part => part.destroy());
        this.addPair(this.obstacles[this.obstacles.length - 1].x + SPACING);
      }
    }
  }

  ui.primary.disabled = true;
  window.flappyGame = new Phaser.Game({
    type: Phaser.CANVAS, parent: 'game', width: WIDTH, height: HEIGHT,
    backgroundColor: '#78c6ce', render: { antialias: false, pixelArt: true, roundPixels: true },
    loader: { imageLoadType: 'HTMLImageElement', crossOrigin: null },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 950 }, fixedStep: false } },
    scene: FlightScene, audio: { noAudio: true }
  });
}

ui.primary.addEventListener('click', () => {
  if (!scene || ui.primary.disabled) return;
  if (scene.state === 'paused') scene.togglePause();
  else scene.startFlight();
  ui.primary.blur();
});
ui.pause.addEventListener('click', () => { scene?.togglePause(); ui.pause.blur(); });
ui.sound.addEventListener('click', () => {
  preferences.muted = !preferences.muted;
  unlockAudio();
  renderSound();
  save();
  ui.sound.blur();
});
ui['shop-open'].addEventListener('click', openShop);
ui['shop-close'].addEventListener('click', closeShop);
ui.shop.addEventListener('cancel', event => { event.preventDefault(); closeShop(); });
ui.shop.addEventListener('click', event => {
  if (event.target !== ui.shop) return;
  const bounds = ui.shop.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeShop();
});
ui['shop-grid'].addEventListener('click', event => {
  const button = event.target.closest('button[data-skin]');
  if (button && !button.disabled) selectSkin(button.dataset.skin);
});
for (const filter of ['all', 'owned']) {
  ui[`filter-${filter}`].addEventListener('click', () => { shopFilter = filter; renderShop(); });
}
window.addEventListener('error', () => { ui.fatal.hidden = false; });
renderSound();
boot();