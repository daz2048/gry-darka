'use strict';

const WIDTH = 360;
const HEIGHT = 640;
const GROUND = 576;
const SPEED = 96;
const GAP = 220;
const SPACING = 225;
const STORAGE_KEY = 'flappy-podlasie-v2';
const ui = Object.fromEntries(['score', 'best', 'overlay', 'eyebrow', 'title', 'result', 'primary', 'sound', 'pause', 'immortal', 'notice', 'fatal'].map(id => [id, document.getElementById(id)]));
let preferences = { best: 0, muted: false };
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
  ui.notice.textContent = `Nie mozna zapisac rekordu lub dzwieku: localStorage/${STORAGE_KEY}. ${error.name || 'Blad pamieci'}. Gra dziala bez zapisu.`;
  ui.notice.hidden = false;
}

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved && typeof saved === 'object') {
    preferences.best = Number.isSafeInteger(saved.best) && saved.best >= 0 ? saved.best : 0;
    preferences.muted = saved.muted === true;
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
      this.bird = this.physics.add.sprite(104, 285, 'bird').setDepth(3);
      this.bird.body.setSize(29, 23).setOffset(7, 7);
      this.bird.body.setAllowGravity(false);
      this.input.on('pointerdown', () => this.flap());
      this.input.keyboard.addCapture(['SPACE', 'UP']);
      this.input.keyboard.on('keydown', event => {
        if (event.repeat || event.target.closest('button, a, input')) return;
        if (event.code === 'Space' || event.code === 'ArrowUp') this.flap();
        if (event.code === 'KeyP') this.togglePause();
        if (event.code === 'KeyM') this.toggleImmortality();
        if (event.code === 'KeyS') ui.sound.click();
        if (event.code === 'KeyH' || event.code === 'Escape') window.location.href = '../index.html';
      });
      this.game.events.on(Phaser.Core.Events.BLUR, () => this.pauseFlight());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pauseFlight();
      });
      ui.best.textContent = preferences.best;
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
      this.bird.body.setVelocity(0, -260);
      this.addPair(460);
      this.addPair(460 + SPACING);
      this.addPair(460 + SPACING * 2);
      tone(600, .1, 850);
    }

    addPair(position) {
      const center = Phaser.Math.Clamp(this.lastGap + Phaser.Math.Between(-40, 40), 190, 390);
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
      this.bird.body.setVelocityY(-260);
      tone(560, .075, 780);
    }

    toggleImmortality() {
      this.immortal = !this.immortal;
      ui.immortal.hidden = !this.immortal;
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
      const movement = SPEED * delta / 1000;
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
    physics: { default: 'arcade', arcade: { gravity: { y: 720 }, fixedStep: false } },
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
window.addEventListener('error', () => { ui.fatal.hidden = false; });
renderSound();
boot();