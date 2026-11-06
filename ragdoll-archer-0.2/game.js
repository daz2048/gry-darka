const WIDTH = 960;
const HEIGHT = 540;
const GRAVITY = 0.46;
const MATTER_GRAVITY = 1.6;
const PLAYER_X = 156;
const PLAYER_FOOT_Y = 430;
const CHARGE_TIME = 1300;
const ARMOR_COST = 750;
const ARMOR_MAX_LEVEL = 8;
const ARMOR_DAMAGE_REDUCTION = [0, 0.4, 0.55, 0.68, 0.78, 0.86, 0.88, 0.9, 0.92];
const MEDKIT_COST = 600;
const MEDKIT_HEAL = 35;
const SHIELD_COST = 1200;
const MATTER = Phaser.Physics.Matter.Matter;

const WEAPONS = [
  { id: 'default', name: 'DEFAULT', cost: 0, speed: 1, damage: 1, color: 0xf3f0e9, detail: 'BALANCED' },
  { id: 'swift', name: 'SWIFT', cost: 500, speed: 1.3, damage: 1, color: 0x70a7ff, detail: 'FASTER SHOTS' },
  { id: 'power', name: 'POWER', cost: 1000, speed: 1, damage: 1.4, color: 0xf5a623, detail: 'MORE DAMAGE' },
  { id: 'firework', name: 'FIREWORK', cost: 1400, speed: 0.9, damage: 1.5, color: 0xff7ac6, detail: 'BURST ON IMPACT', effect: 'firework' },
  { id: 'minigun', name: 'MINIGUN', cost: 1600, speed: 1.05, damage: 0.12, color: 0xffcf56, detail: '100-ARROW BURST', burstCount: 100, burstInterval: 16, spread: 0.0025 },
  { id: 'frost', name: 'FROST', cost: 1800, speed: 0.95, damage: 0.85, color: 0x74e1f4, detail: 'SLOWS ROBOT', effect: 'frost' },
  { id: 'poison', name: 'POISON', cost: 2200, speed: 1, damage: 0.85, color: 0x8cdb77, detail: 'DAMAGE OVER TIME', effect: 'poison' },
  { id: 'ricochet', name: 'RICOCHET', cost: 2400, speed: 1.1, damage: 1.1, color: 0xb692ff, detail: 'BOUNCES OFF PLATFORMS', effect: 'ricochet' },
  { id: 'laser', name: 'LASER', cost: 2800, speed: 2, damage: 1.8, color: 0xff4ce1, detail: 'HIGH-SPEED BEAM', effect: 'laser' },
  { id: 'elite', name: 'ELITE', cost: 3000, speed: 1.25, damage: 1.5, color: 0xff6259, detail: 'FAST + POWERFUL' }
];

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
  robotTimer: document.getElementById('robot-timer'),
  pause: document.getElementById('pause'),
  points: document.getElementById('points'),
  infinitePointsHint: document.getElementById('infinite-points-hint'),
  weapons: document.getElementById('weapons'),
  upgrades: document.getElementById('upgrades')
};

class ArcherScene extends Phaser.Scene {
  constructor() {
    super('archery-duel');
  }

  create() {
    this.matter.world.setGravity(0, MATTER_GRAVITY);
    this.round = 1;
    this.score = 0;
    this.points = 0;
    this.infinitePoints = false;
    this.ownedWeapons = new Set(['default']);
    this.selectedWeapon = 'default';
    this.effects = [];
    this.robotPoison = null;
    this.armorLevel = 0;
    this.playerHealth = 100;
    this.robotHealth = 100;
    this.started = false;
    this.ended = false;
    this.chargeStartedAt = null;
    this.aimAngle = -0.3;
    this.arrows = [];
    this.pendingBurst = null;
    this.noticeUntil = 0;
    this.playerFlashUntil = 0;
    this.robotFlashUntil = 0;
    this.player = { x: PLAYER_X, footY: PLAYER_FOOT_Y };
    this.robot = { ...ROBOT_POSITIONS[0], health: 100 };
    this.robotArmorLevel = 1;
    this.shieldActive = false;
    this.robotPlatformBody = null;
    this.nextRobotShotAt = Infinity;
    this.paused = false;
    this.pausedAt = 0;
    this.pendingSpawnAt = null;

    this.drawArena();
    this.addPlatforms();
    this.backGraphics = this.add.graphics().setDepth(2);
    this.aimGraphics = this.add.graphics().setDepth(3);
    this.arrowGraphics = this.add.graphics().setDepth(4);
    this.actorGraphics = this.add.graphics().setDepth(5);
    this.effectGraphics = this.add.graphics().setDepth(6);
    this.createKeyboardInput();
    this.drawActors();
    this.syncHud();
    window.ragdollArcherScene = this;

    this.input.on('pointermove', pointer => this.updateAim(pointer));
    this.input.on('pointerdown', pointer => this.beginCharge(pointer));
    this.input.on('pointerup', pointer => this.releaseShot(pointer));
    this.input.on('pointerupoutside', pointer => this.releaseShot(pointer));
    ui.primary.addEventListener('click', () => this.startGame());
    ui.pause.addEventListener('click', () => this.togglePause());
    document.getElementById('restart').addEventListener('click', () => this.startGame());
    ui.weapons.addEventListener('click', event => {
      const button = event.target.closest('button[data-weapon]');
      if (button) this.selectWeapon(button.dataset.weapon);
    });
    ui.upgrades.addEventListener('click', event => {
      const upgrade = event.target.closest('button[data-upgrade]')?.dataset.upgrade;
      if (upgrade === 'armor') this.buyArmor();
      if (upgrade === 'medkit') this.buyMedkit();
      if (upgrade === 'shield') this.buyShield();
    });
  }

  createKeyboardInput() {
    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.started || this.ended) this.startGame();
    });
    this.input.keyboard.on('keydown-M', () => this.enableInfinitePoints());
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
    this.platformGraphics = this.add.graphics().setDepth(1).setVisible(false);
    for (const platform of platforms) {
      const y = platform.footY + 10;
      if (platform.solid) {
        this.matter.add.rectangle(platform.x, y, platform.width, 20, { isStatic: true, label: 'platform', friction: 0.9 });
        for (const merlonX of [platform.x - platform.width / 2 + 2, platform.x + platform.width / 2 - 22]) {
          this.platformGraphics.fillStyle(0x666666).fillRoundedRect(merlonX, platform.footY - 16, 20, 18, 2);
        }
      }
      this.platformGraphics.fillStyle(0x666666).fillRoundedRect(platform.x - platform.width / 2, y - 10, platform.width, 20, 3);
      this.platformGraphics.fillStyle(0x898989, 0.45).fillRect(platform.x - platform.width / 2 + 5, y - 7, platform.width - 10, 3);
      this.platformGraphics.fillStyle(0x4c4c4c, 0.5).fillRect(platform.x - platform.width / 2, y + 10, platform.width, 5);
    }
  }

  startGame() {
    if (this.paused) this.togglePause();
    this.pendingSpawnAt = null;
    this.pendingBurst = null;
    this.clearArrows();
    this.effects = [];
    this.robotPoison = null;
    this.started = true;
    this.ended = false;
    this.round = 1;
    this.score = 0;
    this.points = 0;
    this.infinitePoints = false;
    this.ownedWeapons = new Set(['default']);
    this.selectedWeapon = 'default';
    this.armorLevel = 0;
    this.shieldActive = false;
    this.playerHealth = 100;
    this.chargeStartedAt = null;
    this.robot = null;
    this.robotPoison = null;
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
    this.robotArmorLevel = Math.min(this.round, ARMOR_MAX_LEVEL);
    this.robotPoison = null;
    this.robotHealth = 100;
    this.robotFlashUntil = 0;
    this.nextRobotShotAt = this.time.now + Phaser.Math.Between(1900, 2900);
    this.syncHud();
    this.setNotice(this.round === 1 ? 'ROBOT INCOMING' : `ROBOT ${String(this.round).padStart(2, '0')} INCOMING`);
  }

  beginCharge(pointer) {
    if (!this.started || this.ended || this.paused || this.chargeStartedAt !== null || this.pendingBurst) return;
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
    const weapon = WEAPONS.find(item => item.id === this.selectedWeapon);
    const speed = (7 + power * 14) * weapon.speed;
    if (weapon.id === 'minigun') {
      this.pendingBurst = {
        origin,
        angle: this.aimAngle,
        speed,
        power,
        weapon,
        shot: 0,
        nextShotAt: this.time.now
      };
      this.setNotice('MINIGUN: 100 SHOTS FIRING');
    } else {
      this.launchArrow('player', origin.x, origin.y, this.aimAngle, speed, power, weapon);
      this.setNotice(power > 0.75 ? 'FULL POWER' : 'ARROW AWAY');
    }
    ui.chargeLabel.textContent = 'SHOT POWER';
    ui.chargeFill.style.width = '0%';
    ui.chargePercent.textContent = '0%';
  }

  updatePlayerBurst(time) {
    const burst = this.pendingBurst;
    if (!burst || time < burst.nextShotAt) return;
    if (!this.started || this.ended) {
      this.pendingBurst = null;
      return;
    }
    const spread = (burst.shot - (burst.weapon.burstCount - 1) / 2) * burst.weapon.spread;
    this.launchArrow(
      'player',
      burst.origin.x,
      burst.origin.y,
      burst.angle + spread,
      burst.speed,
      burst.power,
      burst.weapon
    );
    burst.shot++;
    if (burst.shot >= burst.weapon.burstCount) this.pendingBurst = null;
    else burst.nextShotAt = time + burst.weapon.burstInterval;
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

  launchArrow(side, x, y, angle, speed, power, weapon = WEAPONS[0]) {
    const body = MATTER.Bodies.rectangle(x, y, 42, 4, {
      label: `${side}-arrow`,
      frictionAir: 0.0015,
      friction: 0.04,
      restitution: weapon.effect === 'ricochet' ? 0.88 : 0.16,
      density: 0.0012
    });
    MATTER.Body.setAngle(body, angle);
    MATTER.Body.setVelocity(body, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
    this.matter.world.add(body);
    this.arrows.push({ body, side, power, weapon, bornAt: this.time.now });
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
    if (this.paused) return;
    this.updatePlayerBurst(time);
    if (this.pendingSpawnAt !== null && time >= this.pendingSpawnAt) {
      this.pendingSpawnAt = null;
      if (this.started && !this.ended) this.spawnRobot();
    }
    this.updateRobotPoison(time);
    if (this.chargeStartedAt !== null) {
      const power = Phaser.Math.Clamp((time - this.chargeStartedAt) / CHARGE_TIME, 0, 1);
      ui.chargeFill.style.width = `${power * 100}%`;
      ui.chargePercent.textContent = `${Math.round(power * 100)}%`;
    }
    if (this.started && !this.ended && this.robot && time >= this.nextRobotShotAt) this.robotShoot();

    this.updateArrows(time);
    this.drawActors();
    this.drawAimGuide(time);
    this.drawEffects(time);
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
        if (arrow.side === 'player' && arrow.weapon.effect === 'firework') this.spawnFirework(x, y, time);
        this.hitTarget(arrow.side, arrow.power, arrow.weapon);
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

  hitTarget(side, power, weapon = WEAPONS[0]) {
    const baseDamage = Math.round((15 + power * 34) * weapon.damage);
    const armorLevel = side === 'robot' ? this.armorLevel : this.robotArmorLevel;
    const damage = armorLevel > 0
      ? Math.round(baseDamage * (1 - ARMOR_DAMAGE_REDUCTION[armorLevel]))
      : baseDamage;
    if (side === 'player') {
      if (!this.robot || this.robot.health <= 0) return;
      this.robot.health = Math.max(0, this.robot.health - damage);
      this.robotHealth = this.robot.health;
      this.robotFlashUntil = this.time.now + 180;
      this.awardPoints(damage * 10);
      if (weapon.effect === 'frost' && this.robot) this.nextRobotShotAt += 1400;
      if (weapon.effect === 'poison' && this.robot) {
        this.robotPoison = { remaining: 3, damage: 5, nextAt: this.time.now + 350 };
      }
      const notice = weapon.effect === 'frost' ? 'ROBOT SLOWED' : weapon.effect === 'poison' ? 'ROBOT POISONED' : `ROBOT -${damage}`;
      this.setNotice(notice);
      if (this.robot.health <= 0) this.defeatRobot();
    } else {
      if (this.shieldActive) {
        this.shieldActive = false;
        this.playerFlashUntil = this.time.now + 220;
        this.setNotice('SHIELD BLOCKED THE HIT');
        this.syncHud();
        return;
      }
      this.playerHealth = Math.max(0, this.playerHealth - damage);
      this.playerFlashUntil = this.time.now + 220;
      this.setNotice(`YOU -${damage}`);
      if (this.playerHealth <= 0) this.finishGame();
    }
    this.syncHud();
  }

  defeatRobot() {
    this.awardPoints(250);
    this.robot = null;
    this.nextRobotShotAt = Infinity;
    if (this.robotPlatformBody) this.matter.world.remove(this.robotPlatformBody);
    this.robotPlatformBody = null;
    this.playerHealth = Math.min(100, this.playerHealth + 12);
    this.round++;
    this.syncHud();
    this.setNotice('ROBOT DOWN - NEXT ROUND');
    this.pendingSpawnAt = this.time.now + 900;
  }

  togglePause() {
    if (!this.started || this.ended) return;
    this.paused = !this.paused;
    ui.pause.innerHTML = this.paused ? '&#9654;' : '&#10074;&#10074;';
    ui.pause.setAttribute('aria-label', this.paused ? 'Resume duel' : 'Pause duel');
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.chargeStartedAt = null;
      ui.chargeLabel.textContent = 'SHOT POWER';
      ui.chargeFill.style.width = '0%';
      ui.chargePercent.textContent = '0%';
      this.matter.world.pause();
      ui.notice.textContent = 'PAUSED';
      this.noticeUntil = Infinity;
      return;
    }
    const pausedFor = this.time.now - this.pausedAt;
    this.matter.world.resume();
    this.nextRobotShotAt += pausedFor;
    if (this.robotPoison) this.robotPoison.nextAt += pausedFor;
    if (this.pendingSpawnAt !== null) this.pendingSpawnAt += pausedFor;
    if (this.pendingBurst) this.pendingBurst.nextShotAt += pausedFor;
    for (const arrow of this.arrows) arrow.bornAt += pausedFor;
    this.noticeUntil = 0;
    ui.notice.textContent = '';
  }

  finishGame() {
    this.ended = true;
    this.started = false;
    this.pendingBurst = null;
    this.chargeStartedAt = null;
    ui.overlayTitle.innerHTML = 'DUEL<br><em>OVER</em>';
    ui.overlayCopy.textContent = `You reached round ${this.round} and scored ${this.score}. The robot won this time.`;
    ui.primary.textContent = 'TRY AGAIN';
    ui.overlay.hidden = false;
  }

  updateRobotPoison(time) {
    if (!this.started || !this.robot || !this.robotPoison || time < this.robotPoison.nextAt) return;
    const poison = this.robotPoison;
    this.robot.health = Math.max(0, this.robot.health - poison.damage);
    this.robotHealth = this.robot.health;
    this.robotFlashUntil = time + 120;
    this.awardPoints(poison.damage * 10);
    poison.remaining--;
    poison.nextAt = time + 450;
    if (this.robot.health <= 0) {
      this.robotPoison = null;
      this.defeatRobot();
    } else if (poison.remaining <= 0) {
      this.robotPoison = null;
    }
    this.syncHud();
  }

  drawAimGuide(time) {
    this.aimGraphics.clear();
    if (!this.started || this.ended || !this.player) return;
    const origin = this.bowOrigin(this.player, 'player');
    const power = this.chargeStartedAt === null ? 0.28 : Phaser.Math.Clamp((time - this.chargeStartedAt) / CHARGE_TIME, 0.12, 1);
    const weapon = WEAPONS.find(item => item.id === this.selectedWeapon);
    const speed = (7 + power * 14) * weapon.speed;
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
      const color = arrow.side === 'player' ? arrow.weapon.color : 0xf26a5f;
      if (arrow.side === 'player' && arrow.weapon.effect === 'laser') {
        this.arrowGraphics.lineStyle(10, color, 0.24).lineBetween(x - dx * 36, y - dy * 36, x + dx * 18, y + dy * 18);
        this.arrowGraphics.lineStyle(4, color, 0.72).lineBetween(x - dx * 30, y - dy * 30, x + dx * 16, y + dy * 16);
        this.arrowGraphics.lineStyle(1.5, 0xffeafa, 1).lineBetween(x - dx * 27, y - dy * 27, x + dx * 14, y + dy * 14);
      } else {
        this.arrowGraphics.lineStyle(3, color, 1).lineBetween(x - dx * 19, y - dy * 19, x + dx * 14, y + dy * 14);
      }
      this.arrowGraphics.fillStyle(color, 1).fillTriangle(x + dx * 21, y + dy * 21, x + dx * 10 - dy * 5, y + dy * 10 + dx * 5, x + dx * 10 + dy * 5, y + dy * 10 - dx * 5);
    }
  }

  spawnFirework(x, y, time) {
    const colors = [0xff7ac6, 0xffcf56, 0x74e1f4, 0xf3f0e9];
    for (let spark = 0; spark < 20; spark++) {
      this.effects.push({
        x,
        y,
        angle: Math.PI * 2 * spark / 20,
        speed: Phaser.Math.FloatBetween(1.4, 3.8),
        color: colors[spark % colors.length],
        bornAt: time
      });
    }
  }

  drawEffects(time) {
    this.effectGraphics.clear();
    this.effects = this.effects.filter(effect => time - effect.bornAt < 520);
    for (const effect of this.effects) {
      const age = time - effect.bornAt;
      const progress = age / 520;
      const distance = effect.speed * age * 0.045;
      const x = effect.x + Math.cos(effect.angle) * distance;
      const y = effect.y + Math.sin(effect.angle) * distance + progress * progress * 12;
      this.effectGraphics.fillStyle(effect.color, 1 - progress).fillCircle(x, y, 2.8 * (1 - progress) + 0.5);
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
    const hip = { x, y: hipY };
    const shoulder = { x, y: shoulderY + 4 };
    const frontFoot = { x: x + (facingRight ? 19 : -19), y: footY - 3 };
    const backFoot = { x: x + (facingRight ? -18 : 18), y: footY - 3 };
    const frontHand = { x: x + (facingRight ? 24 : -24), y: footY - 82 };
    const backHand = { x: x + (facingRight ? -22 : 22), y: footY - 58 };
    const frontKnee = { x: (hip.x + frontFoot.x) / 2 + (facingRight ? 5 : -5), y: (hipY + footY) / 2 };
    const backKnee = { x: (hip.x + backFoot.x) / 2 + (facingRight ? -4 : 4), y: (hipY + footY) / 2 + 3 };
    const frontElbow = { x: (shoulder.x + frontHand.x) / 2, y: (shoulder.y + frontHand.y) / 2 + 10 };
    const backElbow = { x: (shoulder.x + backHand.x) / 2 + (facingRight ? -6 : 6), y: (shoulder.y + backHand.y) / 2 + 4 };
    const segment = (points, width) => {
      graphics.lineStyle(width, bodyColor, 1).beginPath();
      graphics.moveTo(points[0].x, points[0].y);
      for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
      graphics.strokePath();
    };
    const joint = (point, radius) => graphics.fillStyle(bodyColor, 1).fillCircle(point.x, point.y, radius);

    if (side === 'player' && this.shieldActive) {
      graphics.lineStyle(3, 0x75e7dc, 0.9).strokeCircle(x, footY - 69, 48);
      graphics.lineStyle(1, 0xd5fff8, 0.75).strokeCircle(x, footY - 69, 53);
    }
    segment([{ x, y: shoulderY }, hip], 12);
    segment([hip, frontKnee, frontFoot], 10);
    segment([hip, backKnee, backFoot], 10);
    segment([shoulder, frontElbow, frontHand], 9);
    segment([shoulder, backElbow, backHand], 9);
    joint(frontKnee, 5);
    joint(backKnee, 5);
    joint(frontElbow, 4.5);
    joint(backElbow, 4.5);
    graphics.fillStyle(bodyColor, 1).fillCircle(x, footY - 108, 16);
    if (side === 'robot') graphics.fillStyle(0x8c8c8c, 1).fillRoundedRect(x - 15, footY - 124, 30, 13, 5);
    graphics.fillStyle(side === 'player' ? 0x70a7ff : 0xff6a5e, 1).fillCircle(x + (facingRight ? 5 : -5), footY - 109, 2.3);
    graphics.fillStyle(accent, 1).fillRoundedRect(x - 5, footY - 71, 10, 8, 2);
    const armorLevel = side === 'player' ? this.armorLevel : this.robotArmorLevel;
    if (armorLevel > 0) {
      const plateFill = side === 'player' ? 0x527f72 : 0x814b45;
      const plateTrim = side === 'player' ? 0xd9eee5 : 0xffc1a8;
      const chestY = shoulderY + 5;
      graphics.fillStyle(plateFill, 1).lineStyle(2, plateTrim, 1);
      graphics.fillRoundedRect(x - 13, chestY, 26, 31, 5).strokeRoundedRect(x - 13, chestY, 26, 31, 5);
      for (let rib = 0; rib < Math.min(armorLevel, 6); rib++) {
        const ribY = chestY + 6 + rib * 4;
        graphics.lineStyle(2, 0xb9dbcf, 1).lineBetween(x - 7, ribY, x + 7, ribY);
      }
      if (armorLevel >= 2) {
        graphics.fillStyle(plateFill, 1).lineStyle(2, plateTrim, 1);
        graphics.fillRoundedRect(x - 16, footY - 126, 32, 13, 5).strokeRoundedRect(x - 16, footY - 126, 32, 13, 5);
        graphics.lineStyle(2, accent, 1).lineBetween(x - 9, footY - 120, x + 9, footY - 120);
      }
      if (armorLevel >= 3) {
        graphics.fillStyle(plateFill, 1).lineStyle(2, plateTrim, 1);
        graphics.fillRoundedRect(x - 23, shoulderY, 13, 15, 5).strokeRoundedRect(x - 23, shoulderY, 13, 15, 5);
        graphics.fillRoundedRect(x + 10, shoulderY, 13, 15, 5).strokeRoundedRect(x + 10, shoulderY, 13, 15, 5);
      }
      if (armorLevel >= 4) {
        graphics.fillStyle(plateFill, 1).lineStyle(2, plateTrim, 1);
        graphics.fillRoundedRect(frontElbow.x - 7, frontElbow.y - 5, 14, 10, 4).strokeRoundedRect(frontElbow.x - 7, frontElbow.y - 5, 14, 10, 4);
        graphics.fillRoundedRect(backElbow.x - 7, backElbow.y - 5, 14, 10, 4).strokeRoundedRect(backElbow.x - 7, backElbow.y - 5, 14, 10, 4);
        graphics.fillRoundedRect(x - 22, footY - 40, 12, 16, 4).strokeRoundedRect(x - 22, footY - 40, 12, 16, 4);
        graphics.fillRoundedRect(x + 10, footY - 40, 12, 16, 4).strokeRoundedRect(x + 10, footY - 40, 12, 16, 4);
      }
      if (armorLevel >= 5) {
        graphics.fillStyle(accent, 1).fillTriangle(x, chestY + 9, x - 5, chestY + 16, x + 5, chestY + 16);
        graphics.lineStyle(3, plateTrim, 1).lineBetween(x - 9, footY - 46, x + 9, footY - 46);
      }
      if (armorLevel >= 6) {
        graphics.fillStyle(plateFill, 1).lineStyle(2, plateTrim, 1);
        graphics.fillRoundedRect(x - 27, shoulderY - 2, 19, 19, 6).strokeRoundedRect(x - 27, shoulderY - 2, 19, 19, 6);
        graphics.fillRoundedRect(x + 8, shoulderY - 2, 19, 19, 6).strokeRoundedRect(x + 8, shoulderY - 2, 19, 19, 6);
      }
      if (armorLevel >= 7) {
        graphics.fillStyle(plateFill, 1).lineStyle(2, plateTrim, 1);
        graphics.fillRoundedRect(x - 25, footY - 55, 15, 17, 4).strokeRoundedRect(x - 25, footY - 55, 15, 17, 4);
        graphics.fillRoundedRect(x + 10, footY - 55, 15, 17, 4).strokeRoundedRect(x + 10, footY - 55, 15, 17, 4);
        graphics.lineStyle(3, plateTrim, 1).lineBetween(x - 17, chestY + 2, x + 17, chestY + 2);
      }
      if (armorLevel >= 8) {
        graphics.fillStyle(plateFill, 1).lineStyle(2, plateTrim, 1);
        graphics.fillRoundedRect(x - 18, footY - 132, 36, 8, 4).strokeRoundedRect(x - 18, footY - 132, 36, 8, 4);
        graphics.strokeRoundedRect(x - 17, chestY - 3, 34, 37, 7);
        graphics.fillStyle(accent, 1).fillCircle(x, footY - 128, 2.5);
      }
    }

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

  awardPoints(amount) {
    this.score += amount;
    this.points += amount;
  }

  selectWeapon(id) {
    if (!this.started || this.ended) return;
    const weapon = WEAPONS.find(item => item.id === id);
    if (!weapon) return;
    if (!this.ownedWeapons.has(id)) {
      if (this.points < weapon.cost) return;
      this.points -= weapon.cost;
      this.ownedWeapons.add(id);
    }
    this.selectedWeapon = id;
    this.setNotice(`${weapon.name} EQUIPPED`);
    this.syncHud();
  }

  buyMedkit() {
    if (!this.started || this.ended || this.playerHealth >= 100 || this.points < MEDKIT_COST) return;
    this.points -= MEDKIT_COST;
    const restored = Math.min(MEDKIT_HEAL, 100 - this.playerHealth);
    this.playerHealth += restored;
    this.setNotice(`MEDKIT +${restored} HEALTH`);
    this.syncHud();
  }

  buyShield() {
    if (!this.started || this.ended || this.shieldActive || this.points < SHIELD_COST) return;
    this.points -= SHIELD_COST;
    this.shieldActive = true;
    this.setNotice('SHIELD READY - NEXT HIT BLOCKED');
    this.syncHud();
  }

  buyArmor() {
    if (!this.started || this.ended || this.armorLevel >= ARMOR_MAX_LEVEL) return;
    const cost = ARMOR_COST * (this.armorLevel + 1);
    if (this.points < cost) return;
    this.points -= cost;
    this.armorLevel++;
    const reduction = ARMOR_DAMAGE_REDUCTION[this.armorLevel] * 100;
    this.setNotice(`ARMOR ${this.armorLevel} - ${reduction}% LESS DAMAGE`);
    this.syncHud();
  }

  enableInfinitePoints() {
    if (!this.started || this.ended || this.infinitePoints) return;
    this.infinitePoints = true;
    this.points = Infinity;
    this.setNotice('INFINITE POINTS ENABLED');
    this.syncHud();
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
    ui.points.textContent = this.infinitePoints ? '\u221e' : this.points;
    ui.infinitePointsHint.hidden = this.infinitePoints;
    ui.weapons.replaceChildren(...WEAPONS.map(weapon => {
      const button = document.createElement('button');
      const owned = this.ownedWeapons.has(weapon.id);
      const selected = this.selectedWeapon === weapon.id;
      button.type = 'button';
      button.className = 'weapon-button';
      button.dataset.weapon = weapon.id;
      button.style.setProperty('--weapon-color', `#${weapon.color.toString(16).padStart(6, '0')}`);
      button.disabled = !this.started || this.ended || (!owned && this.points < weapon.cost);
      button.setAttribute('aria-pressed', String(selected));
      const name = document.createElement('span');
      name.className = 'weapon-name';
      name.textContent = weapon.name;
      const detail = document.createElement('small');
      detail.textContent = weapon.detail;
      const state = document.createElement('strong');
      state.textContent = selected ? 'EQUIPPED' : owned ? 'EQUIP' : `${weapon.cost} PTS`;
      button.append(name, detail, state);
      return button;
    }));
    const armorCost = ARMOR_COST * (this.armorLevel + 1);
    const upgradeButton = (id, name, detail, state, color, disabled, pressed = false) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'weapon-button';
      button.dataset.upgrade = id;
      button.style.setProperty('--weapon-color', color);
      button.disabled = disabled;
      button.setAttribute('aria-pressed', String(pressed));
      const nameElement = document.createElement('span');
      nameElement.className = 'weapon-name';
      nameElement.textContent = name;
      const detailElement = document.createElement('small');
      detailElement.textContent = detail;
      const stateElement = document.createElement('strong');
      stateElement.textContent = state;
      button.append(nameElement, detailElement, stateElement);
      return button;
    };
    ui.upgrades.replaceChildren(
      upgradeButton(
        'armor',
        'ARMOR',
        `${ARMOR_DAMAGE_REDUCTION[this.armorLevel] * 100}% LESS DAMAGE · ${this.armorLevel}/${ARMOR_MAX_LEVEL}`,
        this.armorLevel >= ARMOR_MAX_LEVEL ? 'MAX' : `${armorCost} PTS`,
        '#84d8bd',
        !this.started || this.ended || this.armorLevel >= ARMOR_MAX_LEVEL || this.points < armorCost,
        this.armorLevel > 0
      ),
      upgradeButton(
        'medkit',
        'MEDKIT',
        `RESTORE UP TO ${MEDKIT_HEAL} HEALTH`,
        this.playerHealth >= 100 ? 'FULL' : `${MEDKIT_COST} PTS`,
        '#f08c62',
        !this.started || this.ended || this.playerHealth >= 100 || this.points < MEDKIT_COST
      ),
      upgradeButton(
        'shield',
        'SHIELD',
        'BLOCK THE NEXT HIT',
        this.shieldActive ? 'ACTIVE' : `${SHIELD_COST} PTS`,
        '#75e7dc',
        !this.started || this.ended || this.shieldActive || this.points < SHIELD_COST,
        this.shieldActive
      )
    );
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