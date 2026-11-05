'use strict';

const TILE = 48;
const LEVEL_BLUEPRINTS = [
  { name: 'Pierwszy szlak', world: 'ZIELONE WZGORZA', sky: 0x8fe3f2, dirt: 0x9b6244, top: 0x4ab86f, width: 100,
    ground: [[0, 17], [20, 17], [40, 20], [63, 18], [84, 16]],
    ledges: [[8, 7, 3], [14, 6, 3], [25, 7, 4], [34, 6, 3], [44, 7, 3], [53, 6, 4], [65, 7, 4], [75, 6, 3], [88, 7, 4]],
    enemies: [
      { column: 12, type: 'mossling' }, { column: 24, type: 'beetle' }, { column: 27, type: 'mossling' },
      { column: 34, type: 'flutter', row: 5 }, { column: 46, type: 'mossling' }, { column: 56, type: 'beetle' },
      { column: 66, type: 'flutter', row: 5 }, { column: 70, type: 'mossling' }, { column: 91, type: 'beetle' },
      { column: 95, type: 'mossling' }
    ], movers: [[18, 8], [38, 8], [61, 8], [82, 8]], checkpoint: 49, shield: [10, 6], secrets: [[15, 4], [55, 4], [76, 4]] },
  { name: 'Krysztalowe jaskinie', world: 'PODZIEMNY SZLAK', sky: 0x263552, dirt: 0x66527c, top: 0x54c4b8, width: 106,
    ground: [[0, 13], [17, 15], [36, 16], [56, 16], [76, 14], [94, 12]],
    ledges: [[7, 7, 3], [20, 7, 3], [28, 6, 3], [38, 7, 4], [48, 6, 3], [59, 7, 4], [68, 6, 3], [80, 7, 3], [97, 7, 4]],
    enemies: [
      { column: 10, type: 'mossling' }, { column: 20, type: 'flutter', row: 5 }, { column: 23, type: 'beetle' },
      { column: 29, type: 'mossling' }, { column: 40, type: 'beetle' }, { column: 48, type: 'flutter', row: 5 },
      { column: 50, type: 'mossling' }, { column: 61, type: 'flutter', row: 5 }, { column: 68, type: 'beetle' },
      { column: 82, type: 'mossling' }, { column: 86, type: 'beetle' }, { column: 99, type: 'flutter', row: 5 }
    ], movers: [[14, 8], [33, 8], [53, 8], [73, 8], [91, 8]], checkpoint: 43, shield: [8, 6], secrets: [[29, 4], [49, 4], [69, 4]] },
  { name: 'Brama na szczycie', world: 'TWIERDZA WIATRU', sky: 0xffc59c, dirt: 0x805674, top: 0xe6a951, width: 112,
    ground: [[0, 12], [16, 13], [33, 15], [52, 16], [72, 15], [91, 21]],
    ledges: [[6, 7, 3], [19, 7, 3], [26, 6, 3], [36, 7, 3], [44, 6, 3], [55, 7, 3], [64, 6, 3], [75, 7, 3], [83, 6, 3], [95, 7, 3], [103, 6, 3]],
    enemies: [
      { column: 9, type: 'mossling' }, { column: 19, type: 'flutter', row: 5 }, { column: 21, type: 'beetle' },
      { column: 26, type: 'mossling' }, { column: 37, type: 'beetle' }, { column: 44, type: 'flutter', row: 5 },
      { column: 57, type: 'mossling' }, { column: 64, type: 'beetle' }, { column: 78, type: 'flutter', row: 5 },
      { column: 83, type: 'mossling' }, { column: 96, type: 'beetle' }, { column: 101, type: 'flutter', row: 5 },
      { column: 105, type: 'mossling' }
    ], movers: [[13, 8], [30, 8], [49, 8], [69, 8], [88, 8]], checkpoint: 58, shield: [7, 6], secrets: [[27, 4], [65, 4], [104, 4]] }
];
const LEVEL_COUNT = 100;
const ENEMY_TYPES = ['mossling', 'beetle', 'flutter'];
const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, index) => {
  const theme = index % LEVEL_BLUEPRINTS.length;
  const round = Math.floor(index / LEVEL_BLUEPRINTS.length);
  const blueprint = LEVEL_BLUEPRINTS[theme];
  const difficulty = Math.min(8, Math.floor(index / 12));
  const name = `Poziom ${String(index + 1).padStart(3, '0')} - ${blueprint.name}`;
  if (index < LEVEL_BLUEPRINTS.length) return { ...blueprint, name, theme, difficulty };

  let seed = (index + 1) * 2654435761 >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const randomInt = limit => Math.floor(random() * limit);
  const width = 120 + index - LEVEL_BLUEPRINTS.length;
  const ground = [];
  let cursor = 0;
  while (cursor < width - 14) {
    const length = 12 + randomInt(7);
    ground.push([cursor, length]);
    cursor += length;
    if (cursor < width - 14) cursor += 2 + randomInt(3);
  }
  const lastGround = ground[ground.length - 1];
  lastGround[1] += width - lastGround[0] - lastGround[1];

  const ledges = [];
  const enemies = [];
  const movers = [];
  const occupiedEnemies = new Set();
  for (let segmentIndex = 0; segmentIndex < ground.length; segmentIndex++) {
    const [start, count] = ground[segmentIndex];
    const ledgeCount = count > 15 && random() < .45 ? 2 : 1;
    for (let ledge = 0; ledge < ledgeCount; ledge++) {
      ledges.push([start + 2 + randomInt(count - 6), 5 + randomInt(3), 2 + randomInt(3)]);
    }
    const enemyCount = 1 + Number(random() < .32 + Math.min(.3, difficulty * .03));
    for (let enemyIndex = 0; enemyIndex < enemyCount; enemyIndex++) {
      let column = start + 2 + randomInt(count - 4);
      while (occupiedEnemies.has(column)) column = start + 2 + (column - start - 1) % (count - 4);
      occupiedEnemies.add(column);
      const type = ENEMY_TYPES[randomInt(ENEMY_TYPES.length)];
      const enemy = { column, type };
      if (type === 'flutter') enemy.row = 4 + randomInt(3);
      enemies.push(enemy);
    }
    if (segmentIndex < ground.length - 1) {
      const gapStart = start + count;
      const gapWidth = ground[segmentIndex + 1][0] - gapStart;
      if (gapWidth >= 2) movers.push([gapStart + Math.floor(gapWidth / 2), 7 + randomInt(2)]);
    }
  }

  const checkpointSegment = ground[Math.floor(ground.length / 2)];
  const shieldSegment = ground[Math.min(1, ground.length - 1)];
  const secrets = [1, Math.floor(ground.length / 2), ground.length - 1].map((segmentIndex, secretIndex) => {
    const [start, count] = ground[segmentIndex];
    return [start + 2 + randomInt(count - 4), 4 + secretIndex % 2];
  });
  const checkpoint = checkpointSegment[0] + Math.floor(checkpointSegment[1] / 2);
  const shield = [shieldSegment[0] + 4, 6];
  return {
    ...blueprint,
    name,
    theme,
    difficulty,
    width,
    ground,
    ledges,
    enemies,
    movers,
    checkpoint,
    shield,
    secrets
  };
});
const HERO_SKINS = [
  { id: 'trail', name: 'Szlakowiec', price: 0, palette: { shadow: 0x214f53, mid: 0x2a6562, light: 0x3e9182, trim: 0xe8b458, accent: 0xc9755f } },
  { id: 'grove', name: 'Lesny zwiadowca', price: 30, palette: { shadow: 0x3d552e, mid: 0x57753a, light: 0x83a84c, trim: 0xe3bd61, accent: 0xd17c51 } },
  { id: 'sunset', name: 'Bursztynowy', price: 55, palette: { shadow: 0x713e58, mid: 0xb64f53, light: 0xe87955, trim: 0xf3c565, accent: 0xf1ad59 } },
  { id: 'crystal', name: 'Krysztalowy', price: 80, palette: { shadow: 0x344c79, mid: 0x566db0, light: 0x829cdb, trim: 0xb9e8d8, accent: 0xdfa1d3 } },
  { id: 'tide', name: 'Nadmorski', price: 110, palette: { shadow: 0x174c60, mid: 0x267d91, light: 0x62c5bd, trim: 0xf2cf76, accent: 0xec8d83 } },
  { id: 'ember', name: 'Pustynny wedrowiec', price: 145, palette: { shadow: 0x70412f, mid: 0xa65c36, light: 0xe58a45, trim: 0xffd06a, accent: 0x7d4958 } },
  { id: 'lilac', name: 'Lawendowy', price: 180, palette: { shadow: 0x583f72, mid: 0x8364a2, light: 0xb69bcf, trim: 0xe6d58f, accent: 0x79a89a } },
  { id: 'night', name: 'Nocny zwiadowca', price: 220, palette: { shadow: 0x233d57, mid: 0x345f7a, light: 0x578ca0, trim: 0xe8c86c, accent: 0xd78068 } },
  { id: 'cloud', name: 'Lodowy', price: 260, palette: { shadow: 0x586579, mid: 0xa7b9ca, light: 0xe5eee0, trim: 0xd8ad64, accent: 0x7da9ba } },
  { id: 'berry', name: 'Jagodowy', price: 305, palette: { shadow: 0x693957, mid: 0xa84670, light: 0xdd6f94, trim: 0xf3d07a, accent: 0x87b56a } },
  { id: 'meadow', name: 'Polny odkrywca', price: 355, palette: { shadow: 0x425c34, mid: 0x74944b, light: 0xb3c95c, trim: 0xf4d178, accent: 0xe59057 } },
  { id: 'magma', name: 'Wulkaniczny', price: 410, palette: { shadow: 0x4b3548, mid: 0x843d4b, light: 0xc65345, trim: 0xffc15e, accent: 0x53a9a0 } },
  { id: 'diamond', name: 'Diamentowy', price: 1000000000000000, priceLabel: '1 biliard monet', power: 'Niezniszczalnosc, szybki i wysoki skok, 3x monety, szczesliwy blok co 12 s', palette: { shadow: 0x4c7580, mid: 0x8bcbd5, light: 0xe4fdff, trim: 0x76ecf2, accent: 0xb7f8df } }
];
const DIAMOND_AURA_RADIUS = 176;
const DIAMOND_PULSE_INTERVAL = 1200;
const DIAMOND_LUCKY_BLOCK_INTERVAL = 12000;
const SHOP_STORAGE_KEY = 'maks-jump-quest-shop-v1';
const ui = Object.fromEntries(['coins', 'score', 'lives', 'world', 'level-name', 'overlay', 'eyebrow', 'overlay-title', 'overlay-copy', 'primary', 'pause', 'sound', 'notice', 'footer-status', 'shop', 'shop-grid', 'wallet-count', 'shop-open', 'shop-close'].map(id => [id, document.getElementById(id)]));
const touch = { left: false, right: false, jump: false };
let scene;
let audio;
let audioOutput;
let musicOutput;
let musicTimer;
let muted = false;
let noticeTimer;
let storageWarningShown = false;

const SOUNDS = {
  start: [[392, .12, 'triangle'], [523, .12, 'triangle', .12], [659, .12, 'triangle', .24], [784, .24, 'triangle', .36]],
  jump: [[220, .16, 'square', 0, 740]],
  coin: [[988, .07, 'sine'], [1319, .16, 'sine', .07]],
  star: [[659, .1, 'triangle'], [831, .1, 'triangle', .1], [988, .1, 'triangle', .2], [1319, .25, 'triangle', .3]],
  block: [[180, .1, 'square', 0, 100], [440, .12, 'triangle', .08]],
  shield: [[440, .12, 'triangle'], [659, .12, 'triangle', .1], [880, .28, 'sine', .2]],
  shieldBreak: [[520, .24, 'sawtooth', 0, 90]],
  stomp: [[260, .14, 'square', 0, 75]],
  checkpoint: [[523, .12, 'triangle'], [659, .12, 'triangle', .12], [784, .28, 'triangle', .24]],
  extraLife: [[523, .09, 'square'], [659, .09, 'square', .1], [784, .09, 'square', .2], [1047, .3, 'triangle', .3]],
  death: [[440, .16, 'triangle', 0, 330], [262, .18, 'triangle', .17], [131, .32, 'sawtooth', .35, 65]],
  gameOver: [[392, .2, 'triangle'], [330, .2, 'triangle', .22], [262, .2, 'triangle', .44], [131, .45, 'triangle', .66]],
  complete: [[523, .12, 'triangle'], [659, .12, 'triangle', .13], [784, .12, 'triangle', .26], [1047, .35, 'triangle', .39]],
  victory: [[523, .15, 'triangle'], [659, .15, 'triangle', .15], [784, .15, 'triangle', .3], [1047, .2, 'triangle', .45], [784, .12, 'triangle', .68], [1047, .5, 'triangle', .82]],
  land: [[95, .055, 'triangle', 0, 50]],
  resume: [[440, .08, 'triangle'], [660, .1, 'triangle', .08]]
};
const MUSIC = {
  step: .18,
  melody: [587, 0, 698, 784, 0, 698, 523, 0, 659, 0, 784, 880, 784, 0, 698, 0, 523, 0, 659, 784, 0, 880, 784, 659, 587, 0, 698, 880, 0, 784, 659, 523],
  bass: [131, 147, 165, 196, 175, 156, 147, 131]
};

function disableSound() {
  muted = true;
  stopMusic();
  if (audioOutput) audioOutput.gain.value = 0;
  ui.sound.setAttribute('aria-pressed', 'false');
  ui.sound.style.opacity = '.45';
  notify('Dzwiek niedostepny w tej przegladarce.');
}

function tone(frequency, duration = .1, type = 'square', delay = 0, endFrequency = frequency) {
  if (muted) return;
  try {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      audioOutput = audio.createGain();
      audioOutput.connect(audio.destination);
    }
    if (audio.state === 'suspended') audio.resume().catch(disableSound);
    const startTime = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
    gain.gain.setValueAtTime(.001, startTime);
    gain.gain.linearRampToValueAtTime(.055, startTime + .005);
    gain.gain.exponentialRampToValueAtTime(.001, startTime + duration);
    oscillator.connect(gain).connect(audioOutput);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  } catch (error) {
    disableSound();
  }
}

function playSound(name) {
  for (const note of SOUNDS[name]) tone(...note);
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

function startMusic() {
  if (muted || musicTimer || !audio || !audioOutput) return;
  try {
    if (!musicOutput) {
      musicOutput = audio.createGain();
      musicOutput.gain.value = .72;
      musicOutput.connect(audioOutput);
    }
    if (audio.state === 'suspended') audio.resume().catch(disableSound);
    let step = 0;
    let nextTime = audio.currentTime + .04;
    const scheduleNote = (frequency, startTime, duration, type, volume) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gain.gain.setValueAtTime(.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + .012);
      gain.gain.exponentialRampToValueAtTime(.001, startTime + duration);
      oscillator.connect(gain).connect(musicOutput);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    const schedule = () => {
      try {
        if (audio.state !== 'running') return;
        while (nextTime < audio.currentTime + .14) {
          const melodyNote = MUSIC.melody[step % MUSIC.melody.length];
          if (melodyNote) scheduleNote(melodyNote, nextTime, .14, 'square', .022);
          if (step % 2 === 0) scheduleNote(MUSIC.bass[Math.floor(step / 4) % MUSIC.bass.length], nextTime, .3, 'triangle', .018);
          step++;
          nextTime += MUSIC.step;
        }
      } catch (error) {
        disableSound();
      }
    };
    musicTimer = window.setInterval(schedule, 25);
    schedule();
  } catch (error) {
    disableSound();
  }
}

function notify(message) {
  clearTimeout(noticeTimer);
  ui.notice.textContent = message;
  ui.notice.classList.add('visible');
  noticeTimer = setTimeout(() => ui.notice.classList.remove('visible'), 2200);
}

class Quest extends Phaser.Scene {
  constructor() { super('Quest'); }
  create() {
    scene = this;
    this.level = 0;
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.phase = 'ready';
    this.loadShopState();
    this.makeTextures();
    this.keys = this.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', up: 'UP', a: 'A', d: 'D', w: 'W', space: 'SPACE' });
    this.input.keyboard.addCapture(['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.restartRun());
    this.input.keyboard.on('keydown-M', () => toggleSound());
    this.input.keyboard.on('keydown-S', () => this.openShop());
    this.input.keyboard.on('keydown-FIVE', () => this.activateUnlimitedFunds());
    this.input.keyboard.on('keydown-ESC', () => { if (ui.shop.hidden) location.href = '../index.html'; else this.closeShop(); });
    this.input.keyboard.on('keydown-H', () => { location.href = '../index.html'; });
    this.input.keyboard.on('keydown-ENTER', () => this.primary());
    this.buildLevel();
    this.scale.on('resize', () => this.resizeCamera());
    this.game.events.on('blur', () => { if (this.phase === 'playing') this.togglePause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.phase === 'playing') this.togglePause(); });
  }

  makeTextures() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const texture = (key, width, height, draw) => {
      graphics.clear(); draw(graphics); graphics.generateTexture(key, width, height);
    };
    for (const skin of HERO_SKINS) for (let frame = 0; frame < 2; frame++) texture(`hero-${skin.id}-${frame}`, 44, 56, pen => {
      const palette = skin.palette;
      pen.fillStyle(0x382e42).fillEllipse(22, 53, 32, 6);
      pen.fillStyle(0x423547).fillRoundedRect(frame ? 6 : 9, 46, 14, 9, 3).fillRoundedRect(frame ? 25 : 22, 46, 14, 9, 3);
      pen.fillStyle(0x55745d).fillRoundedRect(11, 38, 22, 10, 4);
      pen.fillStyle(0xd1a158).fillRoundedRect(7, 27, 30, 20, 7);
      pen.fillStyle(palette.light).fillRoundedRect(8, 26, 28, 19, 6);
      pen.fillStyle(palette.mid).fillRoundedRect(11, 31, 22, 14, 4);
      pen.fillStyle(palette.mid).fillRoundedRect(13, 25, 6, 12, 2).fillRoundedRect(25, 25, 6, 12, 2);
      pen.fillStyle(palette.light).fillRoundedRect(15, 32, 14, 7, 2);
      pen.fillStyle(palette.shadow).fillRoundedRect(4, 29, 8, 14, 4).fillRoundedRect(32, 29, 8, 14, 4);
      pen.fillStyle(palette.trim).fillRoundedRect(5, 38, 8, 6, 2).fillRoundedRect(31, 38, 8, 6, 2);
      pen.fillStyle(palette.trim).fillCircle(16, 29, 2).fillCircle(28, 29, 2);
      pen.fillStyle(palette.accent).fillRoundedRect(8, 36, 7, 8, 2);
      pen.fillStyle(palette.trim).fillCircle(11, 39, 1);
      pen.fillStyle(0x243f4b).fillRoundedRect(12, 12, 21, 21, 7);
      pen.fillStyle(0xe9b58e).fillRoundedRect(12, 14, 21, 20, 7);
      pen.fillStyle(0xf4c9a0).fillRoundedRect(15, 16, 15, 13, 5);
      pen.fillStyle(0x60423b).fillRoundedRect(10, 13, 7, 12, 3).fillRoundedRect(29, 13, 7, 13, 3);
      pen.fillStyle(0x423541).fillEllipse(18, 21, 3, 4).fillEllipse(28, 21, 3, 4);
      pen.fillStyle(0x253947).fillEllipse(19, 22, 1, 2).fillEllipse(29, 22, 1, 2);
      pen.fillStyle(0xc87867).fillRoundedRect(21, 28, 7, 2, 1);
      pen.fillStyle(palette.shadow).fillRoundedRect(7, 5, 30, 13, 6);
      pen.fillStyle(palette.light).fillRoundedRect(10, 6, 22, 7, 4);
      pen.fillStyle(palette.shadow).fillRoundedRect(5, 14, 34, 5, 2);
      pen.fillStyle(palette.trim).fillRoundedRect(11, 34, 22, 5, 2).fillCircle(22, 36, 2);
      pen.fillStyle(palette.accent).fillPoints([{x:22,y:5},{x:25,y:8},{x:22,y:11},{x:19,y:8}], true);
    });
    texture('enemy', 40, 34, pen => {
      pen.fillStyle(0x3d344e).fillEllipse(20, 30, 32, 6);
      pen.fillStyle(0x49385f).fillRoundedRect(4, 15, 32, 17, 8);
      pen.fillStyle(0x9a71a1).fillRoundedRect(6, 12, 28, 18, 8);
      pen.fillStyle(0xc295b4).fillRoundedRect(9, 15, 20, 12, 6);
      pen.fillStyle(0x478359).fillPoints([{x:9,y:16},{x:11,y:5},{x:18,y:11},{x:21,y:1},{x:26,y:11},{x:33,y:6},{x:31,y:18}], true);
      pen.fillStyle(0x77bb70).fillPoints([{x:13,y:14},{x:14,y:8},{x:19,y:12},{x:21,y:5},{x:25,y:13}], true);
      pen.fillStyle(0xfff2d7).fillEllipse(13, 17, 8, 10).fillEllipse(25, 17, 8, 10);
      pen.fillStyle(0x303047).fillEllipse(16, 20, 3, 5).fillEllipse(28, 20, 3, 5);
      pen.fillStyle(0xffffff).fillCircle(15, 18, 1).fillCircle(27, 18, 1);
      pen.fillStyle(0xe88785).fillEllipse(8, 24, 8, 4).fillEllipse(29, 24, 8, 4);
      pen.fillStyle(0x49385f).fillRoundedRect(7, 28, 12, 5, 2).fillRoundedRect(22, 28, 12, 5, 2);
    });
    texture('beetle', 40, 34, pen => {
      pen.fillStyle(0x3b344a).fillEllipse(20, 30, 34, 6);
      pen.fillStyle(0x493b48).fillRoundedRect(4, 16, 32, 15, 7);
      pen.fillStyle(0x52713f).fillRoundedRect(6, 10, 26, 20, 10);
      pen.fillStyle(0x83a84c).fillRoundedRect(8, 8, 21, 17, 9);
      pen.fillStyle(0xb7c968).fillEllipse(17, 12, 10, 9);
      pen.fillStyle(0xd2a55e).fillRoundedRect(25, 17, 13, 11, 5);
      pen.fillStyle(0x4f7040).fillRect(25, 12, 3, 13);
      pen.fillStyle(0xffefd0).fillCircle(31, 20, 3).fillCircle(37, 20, 3);
      pen.fillStyle(0x344047).fillCircle(32, 21, 1).fillCircle(38, 21, 1);
      pen.fillStyle(0xe8d69a).fillCircle(12, 14, 3).fillCircle(21, 21, 2).fillCircle(16, 25, 2);
      pen.fillStyle(0x493b48).fillRoundedRect(6, 27, 12, 5, 2).fillRoundedRect(23, 27, 12, 5, 2);
    });
    texture('flutter', 40, 34, pen => {
      pen.fillStyle(0x53416f).fillEllipse(7, 15, 16, 20).fillEllipse(33, 15, 16, 20);
      pen.fillStyle(0x9a75bf).fillEllipse(7, 13, 13, 18).fillEllipse(33, 13, 13, 18);
      pen.fillStyle(0xd5a9df).fillEllipse(8, 12, 7, 11).fillEllipse(32, 12, 7, 11);
      pen.fillStyle(0x4c7788).fillRoundedRect(15, 12, 10, 17, 5);
      pen.fillStyle(0x75b9ad).fillEllipse(20, 12, 12, 13);
      pen.fillStyle(0xffefcf).fillCircle(17, 15, 3).fillCircle(23, 15, 3);
      pen.fillStyle(0x384052).fillCircle(18, 16, 1).fillCircle(24, 16, 1);
      pen.fillStyle(0xe77f8b).fillRoundedRect(13, 25, 14, 6, 3);
      pen.fillStyle(0xf0d37d).fillCircle(16, 7, 2).fillCircle(25, 7, 2);
      pen.fillStyle(0x6c507e).fillRect(16, 5, 1, 5).fillRect(25, 5, 1, 5);
    });
    texture('coin', 20, 24, pen => {
      pen.fillStyle(0x985c32).fillEllipse(2, 1, 16, 22);
      pen.fillStyle(0xe59a38).fillEllipse(3, 1, 14, 21);
      pen.fillStyle(0xffdf68).fillEllipse(5, 3, 10, 17);
      pen.fillStyle(0xfff3b2).fillEllipse(6, 4, 4, 13);
      pen.fillStyle(0xf0ae42).fillEllipse(12, 5, 2, 13);
      pen.fillStyle(0xfff8d2).fillRect(7, 4, 2, 3);
    });
    texture('star', 28, 28, pen => {
      pen.fillStyle(0xfff4b7).fillPoints([{x:14,y:0},{x:18,y:9},{x:28,y:10},{x:21,y:17},{x:23,y:28},{x:14,y:22},{x:4,y:28},{x:6,y:17},{x:0,y:10},{x:10,y:9}], true);
      pen.fillStyle(0xd69b36).fillRect(11, 10, 2, 6).fillRect(17, 10, 2, 6);
    });
    texture('block', 48, 48, pen => {
      pen.fillStyle(0x744838).fillRoundedRect(1, 1, 46, 46, 7);
      pen.fillStyle(0xf0a943).fillRoundedRect(3, 3, 42, 42, 6);
      pen.fillStyle(0xffd66a).fillRoundedRect(6, 5, 36, 34, 5);
      pen.fillStyle(0xffedab).fillRoundedRect(9, 7, 28, 5, 2);
      pen.fillStyle(0xc57836).fillRoundedRect(7, 39, 34, 4, 2);
      pen.fillStyle(0xb66a38).fillRoundedRect(19, 14, 13, 5, 2).fillRoundedRect(27, 18, 5, 7, 2).fillRoundedRect(19, 23, 13, 5, 2).fillRoundedRect(19, 27, 5, 5, 2).fillEllipse(17, 34, 5, 5);
      pen.fillStyle(0xfff4c4).fillCircle(11, 16, 2).fillCircle(37, 30, 2);
    });
    texture('shield', 28, 32, pen => {
      pen.fillStyle(0xd9fff0).fillPoints([{x:1,y:2},{x:14,y:0},{x:27,y:2},{x:25,y:21},{x:14,y:32},{x:3,y:21}], true);
      pen.fillStyle(0x36a999).fillRect(7, 7, 14, 15);
      pen.fillStyle(0xf5df67).fillRect(12, 8, 4, 17).fillRect(8, 12, 12, 4);
    });
    texture('platform', 96, 20, pen => {
      pen.fillStyle(0x563e42).fillRoundedRect(0, 5, 96, 15, 4);
      pen.fillStyle(0x9b6244).fillRoundedRect(3, 8, 90, 9, 3);
      pen.fillStyle(0xc58850).fillRect(8, 10, 80, 2);
      pen.fillStyle(0x327c59).fillRoundedRect(0, 0, 96, 9, 4);
      pen.fillStyle(0x5fbd70).fillRoundedRect(4, 1, 88, 5, 3);
      pen.fillStyle(0xa5df78).fillRoundedRect(8, 2, 72, 2, 1);
      pen.fillStyle(0xf5d697).fillRect(17, 12, 6, 3).fillRect(45, 10, 5, 3).fillRect(72, 12, 7, 3);
      pen.fillStyle(0x327c59).fillPoints([{x:16,y:4},{x:20,y:0},{x:24,y:4}], true).fillPoints([{x:66,y:4},{x:70,y:0},{x:74,y:4}], true);
    });
    texture('particle', 5, 5, pen => pen.fillStyle(0xffdf6d).fillRect(0, 0, 5, 5));
    graphics.destroy();
  }

  buildLevel() {
    this.physics.world.colliders.destroy();
    this.children.removeAll(true);
    const data = LEVELS[this.level];
    this.dataLevel = data;
    this.checkpointX = 120;
    this.checkpointOn = false;
    this.shielded = false;
    this.invincibleUntil = 0;
    this.lastGround = -1000;
    this.jumpBuffered = -1000;
    this.jumpHeld = false;
    this.wasGrounded = true;
    this.nextLuckyBlockAt = 0;
    this.physics.world.setBounds(0, -400, data.width * TILE, 1200);
    this.cameras.main.setBackgroundColor(data.sky);
    this.drawScenery(data);
    this.solids = this.physics.add.staticGroup();
    for (const [start, count] of data.ground) this.addTerrain(start * TILE, 480, count * TILE, 120, data);
    for (const [start, row, count] of data.ledges) this.addTerrain(start * TILE, row * TILE, count * TILE, 30, data);
    this.blocks = this.physics.add.staticGroup();
    this.block = this.blocks.create(data.shield[0] * TILE, data.shield[1] * TILE, 'block');
    this.block.used = false;
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const [column, row] of data.movers) {
      const platform = this.movers.create(column * TILE, row * TILE + 24, 'platform');
      platform.startX = column * TILE;
      platform.body.setVelocityX(48);
      platform.body.setSize(96, 15).setOffset(0, 0);
      platform.body.checkCollision.down = false;
      platform.body.checkCollision.left = false;
      platform.body.checkCollision.right = false;
    }
    this.pickups = this.physics.add.staticGroup();
    for (const [start, row, count] of data.ledges) {
      for (let offset = 0; offset < count; offset++) this.pickups.create((start + offset + .5) * TILE, row * TILE - 30, 'coin').kind = 'coin';
    }
    for (const [start, count] of data.ground) {
      for (let offset = 4; offset < count - 2; offset += 3) this.pickups.create((start + offset) * TILE, 438, 'coin').kind = 'coin';
    }
    for (const [column, row] of data.secrets) this.pickups.create(column * TILE, row * TILE, 'star').kind = 'star';
    this.enemies = this.physics.add.group();
    for (const spawn of data.enemies) {
      const { column, type } = spawn;
      const enemyTexture = type === 'beetle' || type === 'flutter' ? type : 'enemy';
      const spawnY = type === 'flutter' ? spawn.row * TILE : 450;
      const enemy = this.enemies.create(column * TILE, spawnY, enemyTexture);
      const segment = data.ground.find(([start, count]) => column >= start && column < start + count);
      enemy.kind = type;
      enemy.minX = segment[0] * TILE + 22;
      enemy.maxX = (segment[0] + segment[1]) * TILE - 22;
      enemy.speed = (type === 'beetle' ? 38 : type === 'flutter' ? 72 : 62) + data.difficulty * 8;
      enemy.body.setVelocityX(-enemy.speed);
      enemy.body.setSize(type === 'flutter' ? 28 : 30, 24).setOffset(5, 6);
      if (type === 'flutter') {
        enemy.body.setAllowGravity(false);
        enemy.baseY = spawnY;
        enemy.flightPhase = column * .71;
      }
    }
    this.player = this.physics.add.sprite(120, 420, this.heroTexture(0)).setDepth(5);
    this.player.body.setSize(22, 40).setOffset(5, 4).setMaxVelocity(310, 900);
    this.player.setCollideWorldBounds(false);
    this.diamondAura = this.add.graphics().setDepth(6);
    this.nextDiamondPulse = 0;
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.blocks, (player, block) => {
      if (player.body.blocked.up && !block.used) {
        block.used = true; block.setTint(0x9b947b);
        const pickup = this.pickups.create(block.x, block.y - 48, 'shield');
        pickup.kind = 'shield'; playSound('block');
      }
    });
    this.physics.add.collider(this.player, this.movers);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.overlap(this.player, this.pickups, (player, pickup) => this.collect(pickup));
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => this.hitEnemy(enemy));
    this.drawCheckpoint(data.checkpoint * TILE);
    this.exitX = (data.width - 3) * TILE;
    this.drawExit(this.exitX);
    this.resizeCamera();
    this.cameras.main.setBounds(0, 0, data.width * TILE, 540);
    this.cameras.main.startFollow(this.player, true, .09, .09, -100, 0);
    this.physics.pause();
    this.syncHud();
  }

  addTerrain(worldX, worldY, width, height, data) {
    const graphics = this.add.graphics();
    graphics.fillStyle(data.dirt).fillRect(worldX, worldY, width, height);
    graphics.fillStyle(data.top).fillRect(worldX, worldY, width, 16);
    graphics.fillStyle(0xffffff, .22).fillRect(worldX, worldY, width, 3);
    graphics.fillStyle(0x332c42, .16).fillRect(worldX, worldY + 16, width, 4);
    graphics.fillStyle(0x302c3c, .12).fillRect(worldX, worldY + height - 11, width, 11);
    for (let offset = 8; offset < width; offset += 25 + Math.floor((worldX + offset) / 43) % 3 * 9) {
      const detail = Math.floor((worldX + offset + this.level * 31) / 13);
      const grassHeight = 4 + detail % 5;
      graphics.fillStyle(0x302c3c, .13).fillRoundedRect(worldX + offset + 8, worldY + 32 + detail % 23, 11 + detail % 9, 5, 2);
      graphics.fillStyle(0xffffff, .11).fillRoundedRect(worldX + offset + 10, worldY + 33 + detail % 23, 5, 2, 1);
      graphics.fillStyle(0x332c42, .14).fillEllipse(worldX + offset + 22, worldY + 68 + detail % 17, 17, 7);
      graphics.fillStyle(data.top).fillTriangle(worldX + offset, worldY + 3, worldX + offset + 4, worldY - grassHeight, worldX + offset + 8, worldY + 3);
      graphics.fillStyle(0xa6df78, .7).fillTriangle(worldX + offset + 2, worldY + 2, worldX + offset + 4, worldY - grassHeight + 2, worldX + offset + 5, worldY + 2);
    }
    const solid = this.add.rectangle(worldX + width / 2, worldY + height / 2, width, height, 0, 0);
    this.solids.add(solid);
  }

  drawScenery(data) {
    const worldWidth = data.width * TILE + 1800;
    const backdrop = this.add.graphics().setScrollFactor(.12).setDepth(-10);
    const middle = this.add.graphics().setScrollFactor(.28).setDepth(-5);
    const foreground = this.add.graphics().setDepth(1);
    const skyTop = [0x6ac9ec, 0x192847, 0xf39b83][data.theme];
    const skyBottom = [0xc4f3df, 0x64558b, 0xffd694][data.theme];
    backdrop.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1).fillRect(0, 0, worldWidth, 540);

    if (data.theme === 0) {
      backdrop.fillStyle(0xffed9b).fillCircle(735, 106, 43);
      backdrop.fillStyle(0xffed9b, .14).fillCircle(735, 106, 66);
      for (let index = 0; index < 18; index++) {
        const x = index * 310 + 35;
        const y = 82 + index % 3 * 38;
        backdrop.fillStyle(0xffffff, .82).fillEllipse(x, y + 9, 92, 26).fillEllipse(x + 24, y, 44, 34).fillEllipse(x + 51, y + 4, 55, 30);
      }
      for (let index = 0; index < 20; index++) {
        const x = index * 290 - 100;
        backdrop.fillStyle(index % 2 ? 0x7cc99e : 0x6fbd96).fillEllipse(x, 355 + index % 3 * 21, 380, 190);
        middle.fillStyle(index % 2 ? 0x4da981 : 0x5db48a).fillEllipse(x + 110, 415 + index % 2 * 18, 360, 140);
      }
    } else if (data.theme === 1) {
      for (let index = 0; index < 45; index++) {
        const x = index * 130;
        backdrop.fillStyle(index % 2 ? 0x3b416e : 0x34476d).fillTriangle(x, 0, x + 49, 112 + index % 4 * 23, x + 98, 0);
        backdrop.fillStyle(0x8be4dd, .7).fillPoints([{x: x + 38, y: 112 + index % 4 * 23}, {x: x + 49, y: 82 + index % 4 * 23}, {x: x + 58, y: 112 + index % 4 * 23}], true);
        if (index % 2 === 0) backdrop.fillStyle(0xe4b3ff, .75).fillPoints([{x: x + 80, y: 380}, {x: x + 101, y: 333 + index % 3 * 15}, {x: x + 119, y: 380}], true);
      }
      for (let index = 0; index < 16; index++) {
        const x = index * 330 + 45;
        middle.fillStyle(0x404675).fillEllipse(x, 460 + index % 2 * 20, 310, 170);
        middle.fillStyle(0x525487).fillEllipse(x + 48, 455 + index % 3 * 12, 198, 102);
      }
    } else {
      backdrop.fillStyle(0xffefb0).fillCircle(735, 116, 48);
      backdrop.fillStyle(0xffefb0, .13).fillCircle(735, 116, 72);
      for (let index = 0; index < 17; index++) {
        const x = index * 340 + 70;
        backdrop.fillStyle(0xf5c181, .82).fillEllipse(x, 164 + index % 3 * 28, 105, 28).fillEllipse(x + 30, 154 + index % 3 * 28, 54, 41).fillEllipse(x + 63, 164 + index % 3 * 28, 74, 30);
        middle.fillStyle(index % 2 ? 0x855b7b : 0x96617b).fillRoundedRect(x - 15, 315, 94, 185, 7);
        middle.fillStyle(0xb66e79).fillRoundedRect(x + 1, 270 + index % 3 * 13, 62, 62, 8);
        middle.fillStyle(0xffd27b).fillTriangle(x - 8, 276 + index % 3 * 13, x + 32, 226 + index % 3 * 13, x + 71, 276 + index % 3 * 13);
        middle.fillStyle(0xffdd85).fillRect(x + 28, 326, 16, 31).fillRect(x + 24, 379, 24, 6);
        middle.fillStyle(0xffe59b).fillTriangle(x + 33, 224 + index % 3 * 13, x + 63, 233 + index % 3 * 13, x + 33, 244 + index % 3 * 13);
      }
    }

    for (const [start, count] of data.ground) {
      for (let column = start + 2; column < start + count - 1; column += 5) {
        const x = column * TILE;
        if (data.theme === 1) {
          foreground.fillStyle(0x4c5681).fillEllipse(x, 464, 38, 22);
          foreground.fillStyle(0x8be4dd).fillPoints([{x: x + 12, y: 469}, {x: x + 19, y: 438}, {x: x + 25, y: 469}], true);
          foreground.fillStyle(0xe4b3ff).fillPoints([{x: x + 29, y: 470}, {x: x + 35, y: 447}, {x: x + 40, y: 470}], true);
        } else {
          const treeColor = data.theme === 2 ? 0x68834f : 0x398a61;
          const canopyShadow = data.theme === 2 ? 0x485b4d : 0x28684f;
          foreground.fillStyle(0x624a43).fillRoundedRect(x + 12, 405, 13, 75, 5);
          foreground.fillStyle(0x93634a).fillRoundedRect(x + 15, 411, 5, 59, 2);
          foreground.fillStyle(0x624a43).fillTriangle(x + 17, 447, x + 7, 463, x + 18, 458);
          foreground.fillStyle(0x624a43).fillTriangle(x + 21, 452, x + 31, 466, x + 19, 460);
          foreground.fillStyle(canopyShadow).fillEllipse(x - 5, 389, 47, 39).fillEllipse(x + 8, 377, 37, 39).fillEllipse(x + 22, 392, 34, 31);
          foreground.fillStyle(treeColor).fillEllipse(x - 2, 385, 38, 34).fillEllipse(x + 10, 371, 29, 30).fillEllipse(x + 22, 388, 26, 26);
          foreground.fillStyle(0x9cdb81, .75).fillEllipse(x + 4, 378, 15, 12).fillEllipse(x + 20, 383, 10, 9);
          foreground.fillStyle(0xd8ef9b, .7).fillCircle(x + 4, 378, 3);
          if (column % 2 === 0) {
            foreground.fillStyle(0xfff0a1).fillCircle(x + 39, 449, 5);
            foreground.fillStyle(0xe87966).fillCircle(x + 39, 449, 2);
          }
        }
      }
    }
  }

  drawCheckpoint(worldX) {
    const pen = this.add.graphics();
    pen.fillStyle(0x315e57).fillRect(worldX, 380, 5, 100);
    pen.fillStyle(0xffdc57).fillTriangle(worldX + 5, 380, worldX + 45, 395, worldX + 5, 410);
    this.checkpointFlag = pen;
  }

  drawExit(worldX) {
    const pen = this.add.graphics();
    pen.fillStyle(0x315e57).fillRect(worldX - 38, 362, 16, 118).fillRect(worldX + 22, 362, 16, 118).fillRect(worldX - 38, 345, 76, 22);
    pen.fillStyle(0xffdd57).fillRect(worldX - 33, 350, 66, 10);
    pen.fillStyle(0xf3f5de, .65).fillRect(worldX - 22, 368, 44, 112);
    pen.fillStyle(0xf3f5de).fillRect(worldX - 44, 337, 88, 9);
    this.add.text(worldX, 316, 'META', { fontFamily: 'monospace', fontSize: '14px', color: '#173c36', backgroundColor: '#ffdd57', padding: {x: 8, y: 4} }).setOrigin(.5);
  }

  resizeCamera() {
    const { width, height } = this.scale;
    this.cameras.main.setZoom(height / 540);
    this.cameras.main.setFollowOffset(-Math.min(100, width / 6), 0);
  }

  syncHud() {
    ui.coins.textContent = String(this.coins).padStart(2, '0');
    ui.score.textContent = String(this.score).padStart(4, '0');
    ui.lives.textContent = this.lives;
    ui.world.textContent = `${String(this.level + 1).padStart(3, '0')} / ${LEVEL_COUNT} - ${LEVELS[this.level].world}`;
    ui['level-name'].textContent = LEVELS[this.level].name;
    ui['footer-status'].textContent = `WYPRAWA ${String(this.level + 1).padStart(3, '0')} / ${LEVEL_COUNT}`;
    document.body.dataset.state = this.phase;
    document.querySelector('.hud').style.color = this.dataLevel.theme === 1 ? '#ffffff' : '#173c36';
  }

  loadShopState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SHOP_STORAGE_KEY) || '{}');
      this.wallet = Number.isSafeInteger(saved.wallet) && saved.wallet > 0 ? saved.wallet : 0;
      this.unlimitedFunds = saved.unlimitedFunds === true;
      this.ownedSkins = Array.isArray(saved.ownedSkins) ? [...new Set(saved.ownedSkins.filter(id => HERO_SKINS.some(skin => skin.id === id)))] : [];
      if (!this.ownedSkins.includes('trail')) this.ownedSkins.unshift('trail');
      this.selectedSkin = this.ownedSkins.includes(saved.selectedSkin) ? saved.selectedSkin : 'trail';
    } catch (error) {
      this.wallet = 0;
      this.unlimitedFunds = false;
      this.ownedSkins = ['trail'];
      this.selectedSkin = 'trail';
      this.showStorageWarning();
    }
  }

  saveShopState() {
    try {
      localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify({ wallet: this.wallet, unlimitedFunds: this.unlimitedFunds, ownedSkins: this.ownedSkins, selectedSkin: this.selectedSkin }));
    } catch (error) {
      this.showStorageWarning();
    }
  }

  showStorageWarning() {
    if (storageWarningShown) return;
    storageWarningShown = true;
    notify('Pamiec sklepu (localStorage) niedostepna. Postep nie zapisze sie po zamknieciu gry.');
  }

  activateUnlimitedFunds() {
    if (this.unlimitedFunds) return;
    this.unlimitedFunds = true;
    this.saveShopState();
    if (!ui.shop.hidden) this.renderShop();
    notify('Monety bez limitu!');
  }

  heroTexture(frame) {
    return `hero-${this.selectedSkin}-${frame}`;
  }

  openShop() {
    if (!ui.shop.hidden) return;
    this.shopReturnPhase = this.phase;
    if (this.phase === 'playing') {
      this.phase = 'shop';
      this.physics.pause();
      this.clearInput();
    }
    this.renderShop();
    ui.shop.hidden = false;
    ui['shop-close'].focus({ preventScroll: true });
  }

  closeShop() {
    if (ui.shop.hidden) return;
    ui.shop.hidden = true;
    if (this.phase === 'shop') {
      this.phase = 'playing';
      this.physics.resume();
      this.syncHud();
    }
    ui['shop-open'].focus({ preventScroll: true });
  }

  renderShop() {
    ui['wallet-count'].textContent = this.unlimitedFunds ? '\u221e' : String(this.wallet).padStart(2, '0');
    const grid = ui['shop-grid'];
    grid.replaceChildren();
    for (const skin of HERO_SKINS) {
      const owned = this.ownedSkins.includes(skin.id);
      const selected = this.selectedSkin === skin.id;
      const card = document.createElement('article');
      card.className = `skin-card${selected ? ' selected' : ''}`;
      const preview = document.createElement('img');
      preview.src = this.textures.getBase64(this.heroTextureFor(skin.id));
      preview.alt = '';
      const name = document.createElement('strong');
      name.className = 'skin-name';
      name.textContent = skin.name;
      const price = document.createElement('span');
      price.className = 'skin-price';
      price.textContent = skin.priceLabel || (skin.price ? `${skin.price} monet` : 'Darmowy');
      const details = skin.power ? document.createElement('span') : null;
      if (details) {
        details.className = 'skin-power';
        details.textContent = skin.power;
      }
      const action = document.createElement('button');
      action.className = 'skin-action';
      action.disabled = selected || (!owned && !this.unlimitedFunds && this.wallet < skin.price);
      action.textContent = selected ? 'Wybrany' : owned ? 'Wybierz' : !this.unlimitedFunds && this.wallet < skin.price ? `Brakuje ${skin.price - this.wallet}` : 'Kup';
      action.addEventListener('click', () => this.purchaseSkin(skin.id));
      card.append(preview, name, price);
      if (details) card.append(details);
      card.append(action);
      grid.append(card);
    }
  }

  heroTextureFor(skinId) {
    return `hero-${skinId}-0`;
  }

  purchaseSkin(skinId) {
    const skin = HERO_SKINS.find(item => item.id === skinId);
    if (!skin) return;
    if (!this.ownedSkins.includes(skinId)) {
      if (!this.unlimitedFunds && this.wallet < skin.price) return;
      if (!this.unlimitedFunds) this.wallet -= skin.price;
      this.ownedSkins.push(skinId);
    }
    this.selectedSkin = skinId;
    this.saveShopState();
    this.player.setTexture(this.heroTexture(0));
    this.renderShop();
    notify(`${skin.name} - zalozono!`);
  }

  showOverlay(eyebrow, title, copy, button) {
    ui.eyebrow.textContent = eyebrow;
    ui['overlay-title'].textContent = title;
    ui['overlay-copy'].textContent = copy;
    ui.primary.textContent = button;
    ui.overlay.hidden = false;
    ui.pause.setAttribute('aria-pressed', String(this.phase === 'paused'));
    this.syncHud();
    ui.primary.focus({ preventScroll: true });
  }

  primary() {
    if (this.phase === 'won' || this.phase === 'gameover') return this.restartRun();
    const resuming = this.phase === 'paused';
    if (this.phase === 'levelComplete') { this.level++; this.buildLevel(); }
    this.phase = 'playing';
    ui.overlay.hidden = true;
    this.physics.resume();
    this.clearInput();
    ui.pause.setAttribute('aria-pressed', 'false');
    this.syncHud();
    playSound(resuming ? 'resume' : 'start');
    startMusic();
  }

  clearInput() {
    for (const key of Object.keys(touch)) touch[key] = false;
    document.querySelectorAll('.held').forEach(button => button.classList.remove('held'));
    this.input.keyboard.resetKeys();
    this.jumpHeld = false;
    this.jumpBuffered = -1000;
  }

  togglePause() {
    if (this.phase === 'paused') return this.primary();
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    this.physics.pause(); this.clearInput();
    this.showOverlay('CHWILA ODDECHU', 'Pauza', 'Szlak poczeka na Ciebie.', 'Kontynuuj');
  }

  restartRun() {
    this.level = 0; this.score = 0; this.coins = 0; this.lives = 3;
    this.buildLevel(); this.phase = 'ready'; this.primary();
  }

  collect(pickup) {
    if (this.phase !== 'playing' || !pickup.active) return;
    const kind = pickup.kind;
    const { x: pickupX, y: pickupY } = pickup;
    pickup.destroy();
    this.burst(pickupX, pickupY);
    if (kind === 'shield') { this.shielded = true; notify('Tarcza zdobyta!'); playSound('shield'); }
    else if (kind === 'coin') {
      this.addCoins(1);
      playSound('coin');
    } else {
      this.score += 500;
      playSound(kind === 'star' ? 'star' : 'coin');
      if (kind === 'star') notify('Sekretny bonus +500');
    }
    this.syncHud();
  }

  addCoins(baseAmount) {
    const multiplier = this.selectedSkin === 'diamond' ? 3 : 1;
    const previousCoins = this.coins;
    const earned = baseAmount * multiplier;
    this.coins += earned;
    this.score += earned * 100;
    if (!this.unlimitedFunds) {
      this.wallet += earned;
      this.saveShopState();
    }
    const extraLives = Math.floor(this.coins / 25) - Math.floor(previousCoins / 25);
    if (extraLives > 0) {
      this.lives += extraLives;
      notify(`${extraLives * 25} monet: dodatkowe zycie!`);
      playSound('extraLife');
    }
  }

  burst(worldX, worldY) {
    const particles = this.add.particles(worldX, worldY, 'particle', { speed: { min: 50, max: 150 }, lifespan: 400, gravityY: 250, quantity: 8, emitting: false });
    particles.explode(8);
    this.time.delayedCall(500, () => particles.destroy());
  }

  hitEnemy(enemy) {
    if (this.phase !== 'playing' || !enemy.active) return;
    if (this.selectedSkin === 'diamond') {
      this.defeatEnemy(enemy);
      return;
    }
    if (this.player.body.velocity.y > 60 && this.player.body.bottom < enemy.body.top + 19) {
      this.defeatEnemy(enemy);
      this.player.setVelocityY(-350);
    } else if (this.time.now > this.invincibleUntil) {
      if (this.shielded) {
        this.shielded = false; this.invincibleUntil = this.time.now + 1800;
        this.player.setVelocityY(-250); playSound('shieldBreak'); notify('Tarcza ochronila Cie!');
      } else this.die();
    }
  }

  defeatEnemy(enemy) {
    this.burst(enemy.x, enemy.y);
    enemy.destroy();
    this.score += 200;
    this.syncHud();
    playSound('stomp');
  }

  openLuckyBlock() {
    const direction = this.player.flipX ? -1 : 1;
    const x = this.player.x + direction * 58;
    const y = this.player.y - 44;
    const block = this.add.image(x, y, 'block').setDepth(7).setTint(0x80e5ec);
    const mark = this.add.text(x, y - 2, '?', {
      fontFamily: 'monospace', fontSize: '24px', fontStyle: 'bold', color: '#ffffff', stroke: '#237f88', strokeThickness: 3
    }).setOrigin(.5).setDepth(8);
    this.tweens.add({
      targets: [block, mark], y: '-=20', duration: 280, ease: 'Back.Out', yoyo: true,
      onComplete: () => {
        block.destroy();
        mark.destroy();
        this.burst(x, y - 10);
        this.addCoins(10);
        this.syncHud();
        playSound('star');
        notify('Blok szczescia! +30 monet');
      }
    });
  }

  die() {
    if (this.phase !== 'playing') return;
    if (this.selectedSkin === 'diamond') {
      this.player.setPosition(this.checkpointOn ? this.checkpointX : 120, 405).setVelocity(0, 0);
      this.invincibleUntil = this.time.now + 500;
      notify('Diamentowa skora ochronila Cie!');
      return;
    }
    this.lives--; this.shielded = false;
    playSound(this.lives <= 0 ? 'gameOver' : 'death');
    if (this.lives <= 0) {
      this.phase = 'gameover'; this.physics.pause(); this.clearInput();
      this.showOverlay('KONIEC WYPRAWY', 'Jeszcze raz?', `Wynik: ${this.score}. Kazdy skok to nowa szansa.`, 'Sprobuj ponownie');
    } else {
      this.player.setPosition(this.checkpointX, 405).setVelocity(0, 0);
      this.invincibleUntil = this.time.now + 2000;
      this.cameras.main.flash(150, 255, 220, 180);
      notify(this.checkpointOn ? 'Powrot do punktu kontrolnego' : 'Sprobuj jeszcze raz!');
      this.clearInput();
    }
    this.syncHud();
  }

  complete() {
    this.score += 1000;
    this.phase = this.level === LEVELS.length - 1 ? 'won' : 'levelComplete';
    this.physics.pause(); this.clearInput(); playSound(this.phase === 'won' ? 'victory' : 'complete');
    this.showOverlay(this.phase === 'won' ? '100 POZIOMOW ZA TOBA' : 'POZIOM UKONCZONY', this.phase === 'won' ? 'Przygoda zdobyta!' : 'Dobra robota!', `Wynik: ${this.score} / Monety: ${this.coins}`, this.phase === 'won' ? 'Zagraj ponownie' : 'Nastepny poziom');
  }

  update(time, delta) {
    if (this.phase !== 'playing') return;
    const body = this.player.body;
    const diamondEquipped = this.selectedSkin === 'diamond';
    body.setMaxVelocity(diamondEquipped ? 440 : 310, diamondEquipped ? 1150 : 900);
    const grounded = body.blocked.down || body.touching.down;
    if (grounded && !this.wasGrounded) playSound('land');
    this.wasGrounded = grounded;
    if (grounded) this.lastGround = time;
    const left = this.keys.left.isDown || this.keys.a.isDown || touch.left;
    const right = this.keys.right.isDown || this.keys.d.isDown || touch.right;
    const jump = this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown || touch.jump;
    if (jump && !this.jumpHeld) this.jumpBuffered = time;
    const jumpCutoff = diamondEquipped ? -390 : -210;
    if (!jump && this.jumpHeld && body.velocity.y < jumpCutoff) body.setVelocityY(jumpCutoff);
    this.jumpHeld = jump;
    if (time - this.jumpBuffered < 120 && time - this.lastGround < 100) {
      body.setVelocityY(diamondEquipped ? -950 : -700); this.jumpBuffered = -1000; this.lastGround = -1000; playSound('jump');
    }
    const direction = Number(right) - Number(left);
    body.setAccelerationX(direction * (diamondEquipped ? 2800 : 1850));
    body.setDragX(direction ? 0 : diamondEquipped ? 2700 : 2100);
    if (direction) this.player.setFlipX(direction < 0);
    this.player.setTexture(this.heroTexture(grounded && Math.abs(body.velocity.x) > 30 && Math.floor(time / 110) % 2 ? 1 : 0));
    this.player.setAlpha(time < this.invincibleUntil && Math.floor(time / 90) % 2 ? .4 : 1);
    if (this.shielded) this.player.setTint(0xa8ffe3);
    else if (this.selectedSkin === 'diamond') this.player.setTint(0xc8fbff);
    else this.player.clearTint();
    this.diamondAura.clear();
    if (this.selectedSkin === 'diamond') {
      const aura = this.diamondAura;
      const pulse = .48 + (Math.sin(time * .008) + 1) * .16;
      aura.lineStyle(2, 0x8af5ff, pulse).strokeCircle(this.player.x, this.player.y, DIAMOND_AURA_RADIUS);
      aura.fillStyle(0xe4fdff, .9);
      const orbit = time * .0012;
      for (let point = 0; point < 4; point++) {
        const angle = orbit + point * Math.PI / 2;
        const x = this.player.x + Math.cos(angle) * DIAMOND_AURA_RADIUS;
        const y = this.player.y + Math.sin(angle) * DIAMOND_AURA_RADIUS;
        aura.fillPoints([{x, y: y - 5}, {x: x + 4, y}, {x, y: y + 5}, {x: x - 4, y}], true);
      }
      if (time >= this.nextDiamondPulse) {
        let nearest = null;
        let nearestDistance = DIAMOND_AURA_RADIUS;
        for (const enemy of this.enemies.getChildren()) {
          if (!enemy.active) continue;
          const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (distance < nearestDistance) {
            nearest = enemy;
            nearestDistance = distance;
          }
        }
        if (nearest) {
          this.defeatEnemy(nearest);
          this.nextDiamondPulse = time + DIAMOND_PULSE_INTERVAL;
        }
      }
      if (time >= this.nextLuckyBlockAt) {
        this.nextLuckyBlockAt = time + DIAMOND_LUCKY_BLOCK_INTERVAL;
        this.openLuckyBlock();
      }
    }
    this.player.x = Math.max(12, this.player.x);
    this.enemies.children.iterate(enemy => {
      if (!enemy?.active) return;
      const speed = enemy.speed;
      if (enemy.x <= enemy.minX || enemy.body.blocked.left) enemy.setVelocityX(speed);
      if (enemy.x >= enemy.maxX || enemy.body.blocked.right) enemy.setVelocityX(-speed);
      if (enemy.kind === 'flutter') enemy.setVelocityY(Math.sin(time * .004 + enemy.flightPhase) * 55);
      enemy.setFlipX(enemy.body.velocity.x > 0);
    });
    this.movers.children.iterate(platform => {
      if (platform.x > platform.startX + 46) platform.setVelocityX(-48);
      if (platform.x < platform.startX - 18) platform.setVelocityX(48);
      if (body.touching.down && platform.body.touching.up) this.player.x += platform.body.velocity.x * Math.min(delta, 40) / 1000;
    });
    if (!this.checkpointOn && this.player.x > this.dataLevel.checkpoint * TILE) {
      this.checkpointOn = true; this.checkpointX = this.dataLevel.checkpoint * TILE + 55;
      this.checkpointFlag.setAlpha(.55); notify('Punkt kontrolny!'); playSound('checkpoint');
    }
    if (this.player.y > 650) this.die();
    if (this.player.x > this.exitX - 20 && this.player.y > 360 && this.player.y < 490) this.complete();
  }
}

function toggleSound() {
  muted = !muted;
  if (audioOutput) audioOutput.gain.value = muted ? 0 : 1;
  if (muted) stopMusic();
  ui.sound.setAttribute('aria-pressed', String(!muted));
  ui.sound.style.opacity = muted ? '.45' : '1';
  if (!muted) {
    playSound('resume');
    startMusic();
  }
}

ui.primary.addEventListener('click', () => scene?.primary());
ui.pause.addEventListener('click', () => scene?.togglePause());
ui.sound.addEventListener('click', toggleSound);
document.getElementById('restart').addEventListener('click', () => scene?.restartRun());
ui['shop-open'].addEventListener('click', () => scene?.openShop());
ui['shop-close'].addEventListener('click', () => scene?.closeShop());
ui.shop.addEventListener('click', event => { if (event.target === ui.shop) scene?.closeShop(); });
for (const button of document.querySelectorAll('[data-control]')) {
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    if (scene?.phase !== 'playing') return;
    button.setPointerCapture(event.pointerId);
    touch[button.dataset.control] = true;
    button.classList.add('held');
  });
  const release = () => { touch[button.dataset.control] = false; button.classList.remove('held'); };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}

if (typeof Phaser === 'undefined') document.getElementById('fatal').hidden = false;
else {
  const game = new Phaser.Game({
    type: Phaser.CANVAS, parent: 'game', backgroundColor: '#9ddedb',
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 1450 }, debug: false } },
    scene: Quest, input: { activePointers: 4 }, audio: { noAudio: true },
    callbacks: { postBoot: () => { window.quest = game; } }
  });
}