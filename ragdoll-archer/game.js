const WIDTH = 960;
const HEIGHT = 540;
const GRAVITY = 0.46;
const MATTER_GRAVITY = 1.6;
const PLAYER_X = 156;
const PLAYER_FOOT_Y = 430;
const CHARGE_TIME = 1300;
const MATTER = Phaser.Physics.Matter.Matter;

const ROBOT_POSITIONS = [
  { x: 790, footY: 430, label: 'LOWER PLATFORM' },
  { x: 730, footY: 350, label: 'LEFT HIGH PLATFORM' },
  { x: 835, footY: 275, label: 'RIGHT HIGH PLATFORM' },
  { x: 690, footY: 305, label: 'CENTER PLATFORM' },
  { x: 820, footY: 390, label: 'LOWER RIGHT PLATFORM' },
  { x: 755, footY: 245, label: 'TOP PLATFORM' },
  { x: 875, footY: 330, label: 'RIGHT PLATFORM' }
];

const ui = {
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlay-title'),
  overlayCopy: document.getElementById('overlay-copy'),
  primary: document.getElementById('primary'),
  round: document.getElementById('round'),
  robotPosition: document.getElementById('robot-position'),
  playerHealth: document.getElementById('player-health'),
  playerHealthText: document.getElementById('player-health-text'),
  robotHealth: document.getElementById('robot-health'),
  robotHealthText: document.getElementById('robot-health-text'),
  score: document.getElementById('score'),
  chargeLabel: document.getElementById('charge-label'),
  chargePercent: document.getElementById('charge-percent'),
  chargeFill: document.getElementById('charge-fill'),
  notice: document.getElementById('notice'),
  robotTimer: document.getElementById('robot-timer')
};

class ArcherScene extends Phaser.Scene {
  constructor() {
    super('archery-duel');
  }

  create() {
    this.matter.world.setGravity(0, MATTER_GRAVITY);
    this.round = 1;
    this.score = 0;
    this.playerHealth = 100;
    this.robotHealth = 100;
    this.started = false;
    this.ended = false;
    this.chargeStartedAt = null;
    this.aimAngle = -0.3;
    this.arrows = [];
    this.noticeUntil = 0;
    this.playerFlashUntil = 0;
    this.robotFlashUntil = 0;
    this.player = { x: PLAYER_X, footY: PLAYER_FOOT_Y };
    this.robot = { ...ROBOT_POSITIONS[0], health: 100 };
    this.robotPlatformBody = null;
    this.nextRobotShotAt = Infinity;

    this.drawArena();
    this.addPlatforms();
    this.backGraphics = this.add.graphics().setDepth(2);
    this.aimGraphics = this.add.graphics().setDepth(3);
    this.arrowGraphics = this.add.graphics().setDepth(4);
    this.actorGraphics = this.add.graphics().setDepth(5);
    this.createKeyboardInput();
    this.drawActors();
    this.syncHud();
    window.ragdollArcherScene = this;

    this.input.on('pointermove', pointer => this.updateAim(pointer));
    this.input.on('pointerdown', pointer => this.beginCharge(pointer));
    this.input.on('pointerup', pointer => this.releaseShot(pointer));
    this.input.on('pointerupoutside', pointer => this.releaseShot(pointer));
    ui.primary.addEventListener('click', () => this.startGame());
    document.getElementById('restart').addEventListener('click', () => this.startGame());
  }

  createKeyboardInput() {
    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.started || this.ended) this.startGame();
    });
  }

  drawArena() {
    const background = this.add.graphics().setDepth(-10);
    background.fillGradientStyle(0x414141, 0x414141, 0x303030, 0x303030, 1).fillRect(0, 0, WIDTH, HEIGHT);
    background.fillStyle(0xffffff, 0.08);
    for (let index = 0; index < 34; index++) {
      const x = (index * 197 + 41) % WIDTH;
      const y = (index * 113 + 27) % 450;
      background.fillCircle(x, y, index % 4 === 0 ? 2 : 1.2);
    }
    background.fillStyle(0x292929).fillRect(0, 500, WIDTH, 40);
    background.fillStyle(0x595959, 0.4).fillRect(0, 500, WIDTH, 3);
    this.matter.add.rectangle(WIDTH / 2, 520, WIDTH, 40, { isStatic: true, label: 'floor', friction: 0.9 });
  }

  addPlatforms() {
    const platforms = [
      { x: PLAYER_X, footY: PLAYER_FOOT_Y, width: 196, solid: true },
      ...ROBOT_POSITIONS.map(position => ({ x: position.x, footY: position.footY, width: 166, solid: false }))
    ];
    this.platformGraphics = this.add.graphics().setDepth(1);
    for (const platform of platforms) {
      const y = platform.footY + 10;
      if (platform.solid) this.matter.add.rectangle(platform.x, y, platform.width, 20, { isStatic: true, label: 'platform', friction: 0.9 });
      this.platformGraphics.fillStyle(0x666666).fillRoundedRect(platform.x - platform.width / 2, y - 10, platform.width, 20, 3);
      this.platformGraphics.fillStyle(0x898989, 0.45).fillRect(platform.x - platform.width / 2 + 5, y - 7, platform.width - 10, 3);
      this.platformGraphics.fillStyle(0x4c4c4c, 0.5).fillRect(platform.x - platform.width / 2, y + 10, platform.width, 5);
    }
  }

  startGame() {
    this.clearArrows();
    this.started = true;
    this.ended = false;
    this.round = 1;
    this.score = 0;
    this.playerHealth = 100;
    this.chargeStartedAt = null;
    this.robot = null;
    this.spawnRobot();
    ui.overlay.hidden = true;
    this.setNotice('SHOOT WHENEVER YOU ARE READY');
    this.syncHud();
  }

  spawnRobot() {
    const spawn = ROBOT_POSITIONS[(this.round - 1) % ROBOT_POSITIONS.length];
    if (this.robotPlatformBody) this.matter.world.remove(this.robotPlatformBody);
    this.robotPlatformBody = this.matter.add.rectangle(spawn.x, spawn.footY + 10, 166, 20, { isStatic: true, label: 'active-robot-platform', friction: 0.9 });
    this.robot = { x: spawn.x, footY: spawn.footY, health: 100, label: spawn.label };
    this.robotHealth = 100;
    this.robotFlashUntil = 0;
    this.nextRobotShotAt = this.time.now + Phaser.Math.Between(1900, 2900);
    this.syncHud();
    this.setNotice(this.round === 1 ? 'ROBOT INCOMING' : `ROBOT ${String(this.round).padStart(2, '0')} INCOMING`);
  }

  beginCharge(pointer) {
    if (!this.started || this.ended || this.chargeStartedAt !== null) return;
    this.updateAim(pointer);
    this.chargeStartedAt = this.time.now;
    ui.chargeLabel.textContent = 'CHARGING';
  }

  releaseShot(pointer) {
    if (this.chargeStartedAt === null) return;
    const chargeDuration = Math.max(0, this.time.now - this.chargeStartedAt);
    this.chargeStartedAt = null;
    if (!this.started || this.ended) return;
    this.updateAim(pointer);
    const power = Phaser.Math.Clamp(chargeDuration / CHARGE_TIME, 0.12, 1);
    const origin = this.bowOrigin(this.player, 'player');
    this.launchArrow('player', origin.x, origin.y, this.aimAngle, 7 + power * 14, power);
    ui.chargeLabel.textContent = 'SHOT POWER';
    ui.chargeFill.style.width = '0%';
    ui.chargePercent.textContent = '0%';
    this.setNotice(power > 0.75 ? 'FULL POWER' : 'ARROW AWAY');
  }

  updateAim(pointer) {
    const origin = this.bowOrigin(this.player, 'player');
    const rawAngle = Math.atan2(pointer.worldY - origin.y, pointer.worldX - origin.x);
    this.aimAngle = Phaser.Math.Clamp(rawAngle, -1.28, 0.72);
  }

  bowOrigin(actor, side) {
    return {
      x: actor.x + (side === 'player' ? 26 : -26),
      y: actor.footY - 82
    };
  }

  launchArrow(side, x, y, angle, speed, power) {
    const body = MATTER.Bodies.rectangle(x, y, 42, 4, {
      label: `${side}-arrow`,
      frictionAir: 0.0015,
      friction: 0.04,
      restitution: 0.16,
      density: 0.0012
    });
    MATTER.Body.setAngle(body, angle);
    MATTER.Body.setVelocity(body, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
    this.matter.world.add(body);
    this.arrows.push({ body, side, power, bornAt: this.time.now });
  }

  robotShoot() {
    if (!this.robot || this.robot.health <= 0) return;
    const origin = this.bowOrigin(this.robot, 'robot');
    const targetX = this.player.x + 5;
    const targetY = this.player.footY - 82;
    const speed = Phaser.Math.Between(13, 17);
    const distanceX = targetX - origin.x;
    const travelFrames = Math.abs(distanceX) / speed;
    const compensatedY = targetY - origin.y - GRAVITY * travelFrames * travelFrames / 2;
    const angle = Math.atan2(compensatedY, distanceX) + Phaser.Math.FloatBetween(-0.035, 0.035);
    this.launchArrow('robot', origin.x, origin.y, angle, speed, 0.52);
    const interval = Math.max(1350, 2650 - this.round * 70);
    this.nextRobotShotAt = this.time.now + interval + Phaser.Math.Between(-180, 240);
    this.setNotice('ROBOT FIRED');
  }

  update(time, delta) {
    if (this.chargeStartedAt !== null) {
      const power = Phaser.Math.Clamp((time - this.chargeStartedAt) / CHARGE_TIME, 0, 1);
      ui.chargeFill.style.width = `${power * 100}%`;
      ui.chargePercent.textContent = `${Math.round(power * 100)}%`;
    }
    if (this.started && !this.ended && this.robot && time >= this.nextRobotShotAt) this.robotShoot();

    this.updateArrows(time);
    this.drawActors();
    this.drawAimGuide(time);
    if (this.started && this.robot && this.robot.health > 0) {
      const remaining = Math.max(0, (this.nextRobotShotAt - time) / 1000);
      ui.robotTimer.textContent = `ROBOT SHOT IN ${remaining.toFixed(1)}s`;
    } else ui.robotTimer.textContent = 'ROBOT SHOT READY';
    if (time > this.noticeUntil) ui.notice.textContent = '';
  }

  updateArrows(time) {
    for (let index = this.arrows.length - 1; index >= 0; index--) {
      const arrow = this.arrows[index];
      const body = arrow.body;
      const { x, y } = body.position;
      const angle = Math.atan2(body.velocity.y, body.velocity.x);
      MATTER.Body.setAngle(body, angle);
      const target = arrow.side === 'player' ? this.robot : this.player;
      if (target && this.arrowHitsTarget(body.position, angle, target)) {
        this.removeArrow(index);
        this.hitTarget(arrow.side, arrow.power);
        continue;
      }
      if (time - arrow.bornAt > 6500 || x < -70 || x > WIDTH + 70 || y > HEIGHT + 70) {
        this.removeArrow(index);
      }
    }
    this.drawArrows();
  }

  arrowHitsTarget(position, angle, target) {
    const tipX = position.x + Math.cos(angle) * 18;
    const tipY = position.y + Math.sin(angle) * 18;
    const headDistance = Phaser.Math.Distance.Between(tipX, tipY, target.x, target.footY - 108);
    const torsoDistance = Phaser.Math.Distance.Between(tipX, tipY, target.x, target.footY - 65);
    return headDistance < 22 || torsoDistance < 31;
  }

  hitTarget(side, power) {
    const damage = Math.round(15 + power * 34);
    if (side === 'player') {
      if (!this.robot || this.robot.health <= 0) return;
      this.robot.health = Math.max(0, this.robot.health - damage);
      this.robotHealth = this.robot.health;
      this.robotFlashUntil = this.time.now + 180;
      this.score += damage * 10;
      this.setNotice(`ROBOT -${damage}`);
      if (this.robot.health <= 0) this.defeatRobot();
    } else {
      this.playerHealth = Math.max(0, this.playerHealth - damage);
      this.playerFlashUntil = this.time.now + 220;
      this.setNotice(`YOU -${damage}`);
      if (this.playerHealth <= 0) this.finishGame();
    }
    this.syncHud();
  }

  defeatRobot() {
    this.score += 250;
    this.robot = null;
    this.nextRobotShotAt = Infinity;
    if (this.robotPlatformBody) this.matter.world.remove(this.robotPlatformBody);
    this.robotPlatformBody = null;
    this.playerHealth = Math.min(100, this.playerHealth + 12);
    this.round++;
    this.syncHud();
    this.setNotice('ROBOT DOWN - NEXT ROUND');
    this.time.delayedCall(900, () => {
      if (this.started && !this.ended) this.spawnRobot();
    });
  }

  finishGame() {
    this.ended = true;
    this.started = false;
    this.chargeStartedAt = null;
    ui.overlayTitle.innerHTML = 'DUEL<br><em>OVER</em>';
    ui.overlayCopy.textContent = `You reached round ${this.round} and scored ${this.score}. The robot won this time.`;
    ui.primary.textContent = 'TRY AGAIN';
    ui.overlay.hidden = false;
  }

  drawAimGuide(time) {
    this.aimGraphics.clear();
    if (!this.started || this.ended || !this.player) return;
    const origin = this.bowOrigin(this.player, 'player');
    const power = this.chargeStartedAt === null ? 0.28 : Phaser.Math.Clamp((time - this.chargeStartedAt) / CHARGE_TIME, 0.12, 1);
    const speed = 7 + power * 14;
    this.aimGraphics.fillStyle(0xf4f3ef, this.chargeStartedAt === null ? 0.32 : 0.66);
    for (let frame = 2; frame <= 32; frame += 4) {
      const x = origin.x + Math.cos(this.aimAngle) * speed * frame;
      const y = origin.y + Math.sin(this.aimAngle) * speed * frame + GRAVITY * frame * frame / 2;
      if (x > WIDTH || y > HEIGHT) break;
      this.aimGraphics.fillCircle(x, y, frame < 10 ? 2.4 : 1.7);
    }
  }

  drawArrows() {
    this.arrowGraphics.clear();
    for (const arrow of this.arrows) {
      const { x, y } = arrow.body.position;
      const angle = arrow.body.angle;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const color = arrow.side === 'player' ? 0xf3f0e9 : 0xf26a5f;
      this.arrowGraphics.lineStyle(3, color, 1).lineBetween(x - dx * 19, y - dy * 19, x + dx * 14, y + dy * 14);
      this.arrowGraphics.fillStyle(color, 1).fillTriangle(x + dx * 21, y + dy * 21, x + dx * 10 - dy * 5, y + dy * 10 + dx * 5, x + dx * 10 + dy * 5, y + dy * 10 - dx * 5);
    }
  }

  drawActors() {
    this.actorGraphics.clear();
    this.drawArcher(this.player, 'player', this.aimAngle, this.time.now < this.playerFlashUntil);
    if (this.robot) {
      const origin = this.bowOrigin(this.robot, 'robot');
      const targetY = this.player.footY - 82;
      const distanceX = this.player.x - origin.x;
      const travelFrames = Math.abs(distanceX) / 15;
      const correctedY = targetY - origin.y - GRAVITY * travelFrames * travelFrames / 2;
      const robotAngle = Math.atan2(correctedY, distanceX);
      this.drawArcher(this.robot, 'robot', robotAngle, this.time.now < this.robotFlashUntil);
    }
  }

  drawArcher(actor, side, angle, flash) {
    const graphics = this.actorGraphics;
    const x = actor.x;
    const footY = actor.footY;
    const facingRight = side === 'player';
    const bodyColor = flash ? 0xffd05b : 0xf1f0ec;
    const accent = side === 'player' ? 0xf5a623 : 0xe75d52;
    const hipY = footY - 44;
    const shoulderY = footY - 82;
    const frontLegX = x + (facingRight ? 19 : -19);
    const backLegX = x + (facingRight ? -18 : 18);
    const frontHandX = x + (facingRight ? 24 : -24);

    graphics.lineStyle(12, bodyColor, 1).lineBetween(x, shoulderY, x + 1, hipY);
    graphics.lineStyle(10, bodyColor, 1).lineBetween(x, hipY, frontLegX, footY - 3);
    graphics.lineStyle(10, bodyColor, 1).lineBetween(x, hipY, backLegX, footY - 3);
    graphics.lineStyle(9, bodyColor, 1).lineBetween(x, shoulderY + 4, frontHandX, footY - 82);
    graphics.lineStyle(9, bodyColor, 1).lineBetween(x, shoulderY + 7, x + (facingRight ? -22 : 22), footY - 58);
    graphics.fillStyle(bodyColor, 1).fillCircle(x, footY - 108, 16);
    graphics.fillStyle(side === 'player' ? 0x70a7ff : 0xff6a5e, 1).fillCircle(x + (facingRight ? 5 : -5), footY - 109, 2.3);
    graphics.fillStyle(accent, 1).fillRoundedRect(x - 5, footY - 71, 10, 8, 2);

    const origin = this.bowOrigin(actor, side);
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const perpX = -dirY;
    const perpY = dirX;
    const centerX = origin.x + dirX * 8;
    const centerY = origin.y + dirY * 8;
    graphics.lineStyle(5, accent, 1).beginPath();
    for (let step = 0; step <= 10; step++) {
      const t = step / 10 * 2 - 1;
      const bowX = centerX + perpX * t * 26 + dirX * (11 * (1 - t * t));
      const bowY = centerY + perpY * t * 26 + dirY * (11 * (1 - t * t));
      if (step === 0) graphics.moveTo(bowX, bowY);
      else graphics.lineTo(bowX, bowY);
    }
    graphics.strokePath();
    graphics.lineStyle(1.3, 0xffe6bc, 0.9).lineBetween(centerX - perpX * 26, centerY - perpY * 26, centerX + perpX * 26, centerY + perpY * 26);
  }

  removeArrow(index) {
    const [arrow] = this.arrows.splice(index, 1);
    this.matter.world.remove(arrow.body);
  }

  clearArrows() {
    while (this.arrows.length) this.removeArrow(this.arrows.length - 1);
  }

  setNotice(message) {
    ui.notice.textContent = message;
    this.noticeUntil = this.time.now + 950;
  }

  syncHud() {
    ui.round.textContent = String(this.round).padStart(2, '0');
    ui.robotPosition.textContent = this.robot ? `ROBOT: ${this.robot.label}` : 'ROBOT DEFEATED';
    ui.playerHealth.style.width = `${this.playerHealth}%`;
    ui.playerHealthText.textContent = this.playerHealth;
    const robotHealth = this.robot ? this.robot.health : 0;
    ui.robotHealth.style.width = `${robotHealth}%`;
    ui.robotHealthText.textContent = robotHealth;
    ui.score.textContent = String(this.score).padStart(4, '0');
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game',
  backgroundColor: '#3c3c3c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: MATTER_GRAVITY },
      enableSleep: true,
      debug: false
    }
  },
  scene: [ArcherScene]
});

window.ragdollArcherGame = game;