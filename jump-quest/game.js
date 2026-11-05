'use strict';

const TILE = 48;
const LEVELS = [
  { name: 'Pierwszy szlak', world: 'ZIELONE WZGORZA', sky: 0x8fe3f2, dirt: 0x9b6244, top: 0x4ab86f, width: 100,
    ground: [[0, 17], [20, 17], [40, 20], [63, 18], [84, 16]],
    ledges: [[8, 7, 3], [14, 6, 3], [25, 7, 4], [34, 6, 3], [44, 7, 3], [53, 6, 4], [65, 7, 4], [75, 6, 3], [88, 7, 4]],
    enemies: [12, 27, 46, 56, 70, 91], movers: [[18, 8], [38, 8], [61, 8], [82, 8]], checkpoint: 49, shield: [10, 6], secrets: [[15, 4], [55, 4], [76, 4]] },
  { name: 'Krysztalowe jaskinie', world: 'PODZIEMNY SZLAK', sky: 0x263552, dirt: 0x66527c, top: 0x54c4b8, width: 106,
    ground: [[0, 13], [17, 15], [36, 16], [56, 16], [76, 14], [94, 12]],
    ledges: [[7, 7, 3], [20, 7, 3], [28, 6, 3], [38, 7, 4], [48, 6, 3], [59, 7, 4], [68, 6, 3], [80, 7, 3], [97, 7, 4]],
    enemies: [10, 23, 40, 48, 61, 82, 99], movers: [[14, 8], [33, 8], [53, 8], [73, 8], [91, 8]], checkpoint: 43, shield: [8, 6], secrets: [[29, 4], [49, 4], [69, 4]] },
  { name: 'Brama na szczycie', world: 'TWIERDZA WIATRU', sky: 0xffc59c, dirt: 0x805674, top: 0xe6a951, width: 112,
    ground: [[0, 12], [16, 13], [33, 15], [52, 16], [72, 15], [91, 21]],
    ledges: [[6, 7, 3], [19, 7, 3], [26, 6, 3], [36, 7, 3], [44, 6, 3], [55, 7, 3], [64, 6, 3], [75, 7, 3], [83, 6, 3], [95, 7, 3], [103, 6, 3]],
    enemies: [9, 21, 37, 44, 57, 64, 78, 96, 105], movers: [[13, 8], [30, 8], [49, 8], [69, 8], [88, 8]], checkpoint: 58, shield: [7, 6], secrets: [[27, 4], [65, 4], [104, 4]] }
];
const ui = Object.fromEntries(['coins', 'score', 'lives', 'world', 'level-name', 'overlay', 'eyebrow', 'overlay-title', 'overlay-copy', 'primary', 'pause', 'sound', 'notice', 'footer-status'].map(id => [id, document.getElementById(id)]));
const touch = { left: false, right: false, jump: false };
let scene;
let audio;
let audioOutput;
let muted = false;
let noticeTimer;

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

function disableSound() {
  muted = true;
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
    this.makeTextures();
    this.keys = this.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', up: 'UP', a: 'A', d: 'D', w: 'W', space: 'SPACE' });
    this.input.keyboard.addCapture(['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.restartRun());
    this.input.keyboard.on('keydown-M', () => toggleSound());
    this.input.keyboard.on('keydown-ESC', () => { location.href = '../index.html'; });
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
    for (let frame = 0; frame < 2; frame++) texture(`hero${frame}`, 40, 52, pen => {
      pen.fillStyle(0x65402f).fillEllipse(8, 8, 25, 24);
      pen.fillStyle(0xffc99e).fillEllipse(10, 10, 20, 21);
      pen.fillStyle(0x278b83).fillRoundedRect(7, 26, 27, 19, 7);
      pen.fillStyle(0xe9a64b).fillRect(8, 39, 25, 7);
      pen.fillStyle(0xf8d16a).fillRect(4, 29, 6, 13).fillRect(31, 29, 6, 13);
      pen.fillStyle(0x65402f).fillEllipse(4, 2, 31, 15);
      pen.fillStyle(0xe65f4b).fillEllipse(5, 0, 29, 12);
      pen.fillStyle(0xf58a61).fillRoundedRect(3, 8, 34, 5, 3);
      pen.fillStyle(0xf8d16a).fillEllipse(17, 3, 7, 6);
      pen.fillStyle(0x412c2a).fillEllipse(11, 17, 3, 4).fillEllipse(24, 17, 3, 4);
      pen.fillStyle(0xb94f46).fillRoundedRect(15, 23, 9, 2, 1);
      pen.fillStyle(0xf5c49b).fillEllipse(1, 30, 8, 7).fillEllipse(31, 30, 8, 7);
      pen.fillStyle(0x4e3b38).fillRoundedRect(frame ? 3 : 6, frame ? 44 : 45, 14, 7, 3);
      pen.fillStyle(0x4e3b38).fillRoundedRect(frame ? 23 : 21, frame ? 45 : 44, 14, 7, 3);
      pen.fillStyle(0xd94e4a).fillRect(17, 31, 5, 5);
    });
    texture('enemy', 40, 34, pen => {
      pen.fillStyle(0x71547f).fillEllipse(3, 10, 34, 22);
      pen.fillStyle(0xb49ac0).fillEllipse(7, 12, 26, 15);
      pen.fillStyle(0x5cae74).fillEllipse(8, 2, 24, 15);
      pen.fillStyle(0x83cf86).fillEllipse(13, 1, 16, 10);
      pen.fillStyle(0xfff4dc).fillEllipse(11, 15, 7, 9).fillEllipse(23, 15, 7, 9);
      pen.fillStyle(0x34304a).fillEllipse(14, 18, 3, 4).fillEllipse(26, 18, 3, 4);
      pen.fillStyle(0xe88d8a).fillEllipse(7, 23, 7, 4).fillEllipse(27, 23, 7, 4);
      pen.fillStyle(0x513b60).fillEllipse(7, 27, 11, 6).fillEllipse(23, 27, 11, 6);
    });
    texture('coin', 20, 24, pen => {
      pen.fillStyle(0xc78232).fillEllipse(1, 0, 18, 24);
      pen.fillStyle(0xffdb63).fillEllipse(3, 2, 14, 20);
      pen.fillStyle(0xfff1a8).fillEllipse(5, 4, 5, 15);
      pen.fillStyle(0xe9a93e).fillEllipse(11, 5, 3, 14);
    });
    texture('star', 28, 28, pen => {
      pen.fillStyle(0xfff4b7).fillPoints([{x:14,y:0},{x:18,y:9},{x:28,y:10},{x:21,y:17},{x:23,y:28},{x:14,y:22},{x:4,y:28},{x:6,y:17},{x:0,y:10},{x:10,y:9}], true);
      pen.fillStyle(0xd69b36).fillRect(11, 10, 2, 6).fillRect(17, 10, 2, 6);
    });
    texture('block', 48, 48, pen => {
      pen.fillStyle(0xad603a).fillRoundedRect(1, 1, 46, 46, 7);
      pen.fillStyle(0xffcf58).fillRoundedRect(3, 3, 42, 40, 6);
      pen.fillStyle(0xffe793).fillRoundedRect(7, 6, 34, 5, 2);
      pen.fillStyle(0xd78b3c).fillRoundedRect(7, 37, 34, 4, 2);
      pen.fillStyle(0xb56a37).fillRoundedRect(19, 13, 14, 5, 2).fillRoundedRect(28, 17, 5, 8, 2).fillRoundedRect(20, 23, 13, 5, 2).fillRoundedRect(20, 27, 5, 5, 2).fillEllipse(18, 34, 5, 5);
    });
    texture('shield', 28, 32, pen => {
      pen.fillStyle(0xd9fff0).fillPoints([{x:1,y:2},{x:14,y:0},{x:27,y:2},{x:25,y:21},{x:14,y:32},{x:3,y:21}], true);
      pen.fillStyle(0x36a999).fillRect(7, 7, 14, 15);
      pen.fillStyle(0xf5df67).fillRect(12, 8, 4, 17).fillRect(8, 12, 12, 4);
    });
    texture('platform', 96, 20, pen => {
      pen.fillStyle(0x79513d).fillRoundedRect(0, 4, 96, 16, 4);
      pen.fillStyle(0xa96d48).fillRoundedRect(3, 8, 90, 8, 3);
      pen.fillStyle(0x45a96e).fillRoundedRect(0, 0, 96, 8, 4);
      pen.fillStyle(0x8bd47a).fillRoundedRect(5, 1, 82, 3, 2);
      pen.fillStyle(0xf0d293).fillRect(20, 11, 5, 3).fillRect(63, 12, 4, 3).fillRect(79, 10, 5, 3);
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
    for (const column of data.enemies) {
      const enemy = this.enemies.create(column * TILE, 450, 'enemy');
      const segment = data.ground.find(([start, count]) => column >= start && column < start + count);
      enemy.minX = segment[0] * TILE + 22;
      enemy.maxX = (segment[0] + segment[1]) * TILE - 22;
      enemy.body.setVelocityX(-65 - this.level * 15);
      enemy.body.setSize(30, 26).setOffset(3, 4);
    }
    this.player = this.physics.add.sprite(120, 420, 'hero0').setDepth(5);
    this.player.body.setSize(22, 40).setOffset(5, 4).setMaxVelocity(310, 900);
    this.player.setCollideWorldBounds(false);
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
    graphics.fillStyle(0xffffff, .18).fillRect(worldX, worldY, width, 4);
    graphics.fillStyle(0x332c42, .12).fillRect(worldX, worldY + 16, width, 5);
    for (let offset = 8; offset < width; offset += 43) {
      graphics.fillStyle(0xffffff, .1).fillEllipse(worldX + offset, worldY + 34 + offset % 17, 13, 5);
      graphics.fillStyle(0x332c42, .13).fillEllipse(worldX + offset + 22, worldY + 65 + offset % 13, 17, 7);
      graphics.fillStyle(data.top).fillTriangle(worldX + offset, worldY + 2, worldX + offset + 4, worldY - 5, worldX + offset + 8, worldY + 2);
    }
    const solid = this.add.rectangle(worldX + width / 2, worldY + height / 2, width, height, 0, 0);
    this.solids.add(solid);
  }

  drawScenery(data) {
    const worldWidth = data.width * TILE + 1800;
    const backdrop = this.add.graphics().setScrollFactor(.12).setDepth(-10);
    const middle = this.add.graphics().setScrollFactor(.28).setDepth(-5);
    const foreground = this.add.graphics().setDepth(1);
    const skyTop = [0x6ac9ec, 0x192847, 0xf39b83][this.level];
    const skyBottom = [0xc4f3df, 0x64558b, 0xffd694][this.level];
    backdrop.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1).fillRect(0, 0, worldWidth, 540);

    if (this.level === 0) {
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
    } else if (this.level === 1) {
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
        if (this.level === 1) {
          foreground.fillStyle(0x4c5681).fillEllipse(x, 464, 38, 22);
          foreground.fillStyle(0x8be4dd).fillPoints([{x: x + 12, y: 469}, {x: x + 19, y: 438}, {x: x + 25, y: 469}], true);
          foreground.fillStyle(0xe4b3ff).fillPoints([{x: x + 29, y: 470}, {x: x + 35, y: 447}, {x: x + 40, y: 470}], true);
        } else {
          const treeColor = this.level === 2 ? 0x68834f : 0x398a61;
          foreground.fillStyle(0x79543f).fillRoundedRect(x + 14, 424, 9, 56, 4);
          foreground.fillStyle(treeColor).fillEllipse(x - 1, 391, 40, 33).fillEllipse(x + 3, 374, 28, 28);
          foreground.fillStyle(0x9cdb81, .7).fillEllipse(x + 4, 382, 14, 12);
          if (column % 2 === 0) {
            foreground.fillStyle(0xfff0a1).fillCircle(x + 37, 454, 4);
            foreground.fillStyle(0xe87966).fillCircle(x + 37, 454, 2);
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
    ui.world.textContent = `${String(this.level + 1).padStart(2, '0')} / ${LEVELS[this.level].world}`;
    ui['level-name'].textContent = LEVELS[this.level].name;
    ui['footer-status'].textContent = `WYPRAWA ${String(this.level + 1).padStart(2, '0')} / 03`;
    document.body.dataset.state = this.phase;
    document.querySelector('.hud').style.color = this.level === 1 ? '#ffffff' : '#173c36';
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
    else {
      this.score += kind === 'star' ? 500 : 100;
      if (kind === 'coin') this.coins++;
      playSound(kind === 'star' ? 'star' : 'coin');
      if (kind === 'star') notify('Sekretny bonus +500');
      if (kind === 'coin' && this.coins % 25 === 0) { this.lives++; notify('25 monet: dodatkowe zycie!'); playSound('extraLife'); }
    }
    this.syncHud();
  }

  burst(worldX, worldY) {
    const particles = this.add.particles(worldX, worldY, 'particle', { speed: { min: 50, max: 150 }, lifespan: 400, gravityY: 250, quantity: 8, emitting: false });
    particles.explode(8);
    this.time.delayedCall(500, () => particles.destroy());
  }

  hitEnemy(enemy) {
    if (this.phase !== 'playing' || !enemy.active) return;
    if (this.player.body.velocity.y > 60 && this.player.body.bottom < enemy.body.top + 19) {
      this.burst(enemy.x, enemy.y); enemy.destroy();
      this.player.setVelocityY(-350); this.score += 200; this.syncHud(); playSound('stomp');
    } else if (this.time.now > this.invincibleUntil) {
      if (this.shielded) {
        this.shielded = false; this.invincibleUntil = this.time.now + 1800;
        this.player.setVelocityY(-250); playSound('shieldBreak'); notify('Tarcza ochronila Cie!');
      } else this.die();
    }
  }

  die() {
    if (this.phase !== 'playing') return;
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
    this.showOverlay(this.phase === 'won' ? 'TRZY SWIATY ZA TOBA' : 'SZLAK UKONCZONY', this.phase === 'won' ? 'Przygoda zdobyta!' : 'Dobra robota!', `Wynik: ${this.score} / Monety: ${this.coins}`, this.phase === 'won' ? 'Zagraj ponownie' : 'Nastepny swiat');
  }

  update(time, delta) {
    if (this.phase !== 'playing') return;
    const body = this.player.body;
    const grounded = body.blocked.down || body.touching.down;
    if (grounded && !this.wasGrounded) playSound('land');
    this.wasGrounded = grounded;
    if (grounded) this.lastGround = time;
    const left = this.keys.left.isDown || this.keys.a.isDown || touch.left;
    const right = this.keys.right.isDown || this.keys.d.isDown || touch.right;
    const jump = this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown || touch.jump;
    if (jump && !this.jumpHeld) this.jumpBuffered = time;
    if (!jump && this.jumpHeld && body.velocity.y < -210) body.setVelocityY(-210);
    this.jumpHeld = jump;
    if (time - this.jumpBuffered < 120 && time - this.lastGround < 100) {
      body.setVelocityY(-700); this.jumpBuffered = -1000; this.lastGround = -1000; playSound('jump');
    }
    const direction = Number(right) - Number(left);
    body.setAccelerationX(direction * 1850);
    body.setDragX(direction ? 0 : 2100);
    if (direction) this.player.setFlipX(direction < 0);
    this.player.setTexture(grounded && Math.abs(body.velocity.x) > 30 && Math.floor(time / 110) % 2 ? 'hero1' : 'hero0');
    this.player.setAlpha(time < this.invincibleUntil && Math.floor(time / 90) % 2 ? .4 : 1);
    if (this.shielded) this.player.setTint(0xa8ffe3); else this.player.clearTint();
    this.player.x = Math.max(12, this.player.x);
    this.enemies.children.iterate(enemy => {
      if (!enemy?.active) return;
      const speed = 65 + this.level * 15;
      if (enemy.x <= enemy.minX || enemy.body.blocked.left) enemy.setVelocityX(speed);
      if (enemy.x >= enemy.maxX || enemy.body.blocked.right) enemy.setVelocityX(-speed);
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
  ui.sound.setAttribute('aria-pressed', String(!muted));
  ui.sound.style.opacity = muted ? '.45' : '1';
  if (!muted) playSound('resume');
}

ui.primary.addEventListener('click', () => scene?.primary());
ui.pause.addEventListener('click', () => scene?.togglePause());
ui.sound.addEventListener('click', toggleSound);
document.getElementById('restart').addEventListener('click', () => scene?.restartRun());
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
    type: Phaser.CANVAS, parent: 'game', backgroundColor: '#9ddedb', pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 1450 }, debug: false } },
    scene: Quest, input: { activePointers: 4 }, audio: { noAudio: true },
    callbacks: { postBoot: () => { window.quest = game; } }
  });
}