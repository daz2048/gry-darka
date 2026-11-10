'use strict';

const WIDTH = 360;
const HEIGHT = 640;
const GROUND = 576;
const SPEED = 138;
const GAP = 180;
const SPACING = 225;
const STORAGE_KEY = 'flappy-podlasie-v2';
const ui = Object.fromEntries(['score', 'best', 'overlay', 'eyebrow', 'title', 'result', 'primary', 'sound', 'pause', 'notice', 'fatal'].map(id => [id, document.getElementById(id)]));
let preferences = { best: 0, muted: false };
let scene;
let audio;

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
  if (preferences.muted) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    audio ||= new AudioContext();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
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
      this.load.svg('bird', 'assets/bird.svg', { width: 48, height: 36 });
      this.load.svg('landscape', 'assets/landscape.svg', { width: 720, height: 640 });
      this.load.on('loaderror', () => { ui.fatal.hidden = false; });
    }

    create() {
      scene = this;
      this.state = 'ready';
      this.points = 0;
      this.lastGap = 290;
      this.background = this.add.tileSprite(180, 320, WIDTH, HEIGHT, 'landscape');
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0x87523b).fillRect(0, 0, 58, 640);
      graphics.fillStyle(0xb77b50).fillRect(5, 0, 20, 640).fillRect(30, 0, 21, 640);
      graphics.lineStyle(2, 0xd7a673, .7);
      for (let height = 12; height < 640; height += 54) {
        graphics.lineBetween(11, height, 17, height + 27);
        graphics.lineBetween(38, height + 9, 43, height + 32);
      }
      graphics.generateTexture('wood', 58, 640);
      graphics.clear();
      graphics.fillStyle(0x7b4935).fillRect(0, 0, 70, 18);
      graphics.fillStyle(0xe4b37a).fillRect(3, 3, 64, 5);
      graphics.fillStyle(0x4b7552).fillRect(0, 0, 70, 3);
      graphics.generateTexture('cap', 70, 18);
      graphics.clear();
      graphics.fillStyle(0x6a9850).fillRect(0, 0, 360, 64);
      graphics.fillStyle(0xb4cd72).fillRect(0, 0, 360, 8);
      graphics.fillStyle(0x496d43).fillRect(0, 12, 360, 3);
      graphics.fillStyle(0xeac96b);
      for (let position = 12; position < 360; position += 38) graphics.fillCircle(position, 35, 2);
      graphics.generateTexture('ground', 360, 64);
      graphics.destroy();
      this.ground = this.add.tileSprite(180, 608, WIDTH, 64, 'ground').setDepth(4);
      this.obstacles = [];
      this.bird = this.physics.add.sprite(104, 285, 'bird').setDepth(3);
      this.bird.body.setSize(29, 23).setOffset(7, 7);
      this.bird.body.setAllowGravity(false);
      this.wing = this.add.ellipse(99, 290, 18, 11, 0xf3a535).setDepth(3);
      this.input.on('pointerdown', () => this.flap());
      this.input.keyboard.addCapture(['SPACE', 'UP']);
      this.input.keyboard.on('keydown', event => {
        if (event.repeat || event.target.closest('button, a, input')) return;
        if (event.code === 'Space' || event.code === 'ArrowUp') this.flap();
        if (event.code === 'KeyP') this.togglePause();
        if (event.code === 'KeyM') ui.sound.click();
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
      this.physics.world.resume();
      this.bird.setPosition(104, 285).setAngle(-15);
      this.bird.body.reset(104, 285);
      this.bird.body.setAllowGravity(true);
      this.bird.body.setVelocity(0, -315);
      this.addPair(460);
      this.addPair(460 + SPACING);
      this.addPair(460 + SPACING * 2);
      tone(600, .1, 850);
    }

    addPair(position) {
      const center = Phaser.Math.Clamp(this.lastGap + Phaser.Math.Between(-65, 65), 190, 390);
      this.lastGap = center;
      const upperEdge = center - GAP / 2;
      const lowerEdge = center + GAP / 2;
      const top = this.add.image(position, upperEdge, 'wood').setOrigin(.5, 1);
      const bottom = this.add.image(position, lowerEdge, 'wood').setOrigin(.5, 0);
      const upperCap = this.add.image(position, upperEdge - 9, 'cap');
      const lowerCap = this.add.image(position, lowerEdge + 9, 'cap');
      this.obstacles.push({ x: position, upperEdge, lowerEdge, scored: false, parts: [top, bottom, upperCap, lowerCap] });
    }

    flap() {
      if (this.state !== 'playing') return;
      unlockAudio();
      this.bird.body.setVelocityY(-315);
      tone(560, .075, 780);
    }

    pauseFlight() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      this.physics.world.pause();
      ui.pause.setAttribute('aria-pressed', 'true');
      showOverlay('Chwila oddechu', `Wynik: ${this.points}`, 'Wracamy', 'PAUZA');
    }

    togglePause() {
      if (this.state === 'playing') this.pauseFlight();
      else if (this.state === 'paused') {
        this.state = 'playing';
        this.physics.world.resume();
        ui.overlay.hidden = true;
        ui.pause.setAttribute('aria-pressed', 'false');
      }
    }

    endFlight() {
      if (this.state !== 'playing') return;
      this.state = 'over';
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
      if (this.state === 'ready') this.bird.y = 285 + Math.sin(time / 300) * 7;
      this.wing.setPosition(this.bird.x - 5, this.bird.y + 4).setAngle(this.bird.angle);
      this.wing.scaleY = this.state === 'playing' || this.state === 'ready' ? .6 + Math.sin(time / 70) * .3 : .6;
      if (this.state !== 'playing') return;
      const movement = SPEED * delta / 1000;
      this.background.tilePositionX += movement * .18;
      this.ground.tilePositionX += movement;
      this.bird.angle = Phaser.Math.Clamp(this.bird.body.velocity.y / 9, -25, 70);
      const body = this.bird.body;
      if (body.top <= 0 || body.bottom >= GROUND) { this.endFlight(); return; }
      for (const pair of this.obstacles) {
        pair.x -= movement;
        pair.parts.forEach(part => { part.x = pair.x; });
        if (body.right > pair.x - 35 && body.left < pair.x + 35 && (body.top < pair.upperEdge || body.bottom > pair.lowerEdge)) {
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
    backgroundColor: '#b7e5df', render: { antialias: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 1000 }, fixedStep: false } },
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