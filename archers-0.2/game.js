const WIDTH = 960;
const HEIGHT = 540;
const GRAVITY = 0.46;
const MATTER_GRAVITY = 1.6;
const PLAYER_X = 156;
const PLAYER_FOOT_Y = 430;
const ACTOR_SCALE = 1.35;
const CHARGE_TIME = 1300;
const ARMOR_COST = 750;
const ARMOR_MAX_LEVEL = 8;
const ARMOR_DAMAGE_REDUCTION = [0, 0.4, 0.55, 0.68, 0.78, 0.86, 0.88, 0.9, 0.92];
const MEDKIT_COST = 600;
const MEDKIT_HEAL = 35;
const SHIELD_COST = 1200;
const TOWER_WIDTH = 196;
const RIVAL_BLOCK_SIZE = 52;
const RIVAL_BLOCK_GAP = 3;
const RIVAL_BLOCKS_WIDTH = RIVAL_BLOCK_SIZE * 3 + RIVAL_BLOCK_GAP * 2;
const MATTER = Phaser.Physics.Matter.Matter;
const SVG_NS = 'http://www.w3.org/2000/svg';
const SKULL_PATH = 'M12 2C6.9 2 3 5.7 3 10.6c0 2.8 1.3 5 3.5 6.3V20a1 1 0 0 0 1 1H9v-2h2v2h2v-2h2v2h1.5a1 1 0 0 0 1-1v-3.1c2.2-1.3 3.5-3.5 3.5-6.3C21 5.7 17.1 2 12 2ZM8.5 13.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Zm7 0a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6ZM12 14.2l1.2 2h-2.4Z';

const PALETTE = {
  background: 0x3d3d3d,
  diamond: 0x434343,
  speck: 0x5b5b5b,
  speckLight: 0x6a6a6a,
  block: 0x6c6c6c,
  blockAlt: 0x686868,
  blockSeam: 0x5f5f5f,
  body: 0xebebeb,
  bodyBack: 0xcbcbcb,
  hit: 0xf2a7a7,
  hitBack: 0xd98f8f,
  bow: 0xf5a623,
  bowString: 0xf7d9a6,
  arrow: 0xeeeeee,
  metal: 0x8e8e8e,
  metalBack: 0x7b7b7b,
  metalLight: 0xb4b4b4,
  stud: 0x5f5f5f,
  visor: 0x454545,
  plate: 0xf3f3f3,
  plateSeam: 0xa9a9a9,
  red: 0xe45050,
  redDark: 0x7a2d2d,
  orange: 0xf5a623
};

const WEAPONS = [
  { id: 'default', name: 'DEFAULT', cost: 0, speed: 1, damage: 1, color: 0xeeeeee, detail: 'BALANCED' },
  { id: 'swift', name: 'SWIFT', cost: 500, speed: 1.3, damage: 1, color: 0x4d8ff0, detail: 'FASTER SHOTS' },
  { id: 'power', name: 'POWER', cost: 1000, speed: 1, damage: 1.4, color: 0xf5a623, detail: 'MORE DAMAGE' },
  { id: 'firework', name: 'FIREWORK', cost: 1400, speed: 0.9, damage: 1.5, color: 0xf27fb2, detail: 'BURST ON IMPACT', effect: 'firework' },
  { id: 'minigun', name: 'MINIGUN', cost: 1000000, speed: 1.05, damage: 0.12, color: 0xf2c94c, detail: '100-ARROW BURST', burstCount: 100, burstInterval: 16, spread: 0.0025 },
  { id: 'frost', name: 'FROST', cost: 1800, speed: 0.95, damage: 0.85, color: 0x7fd1f0, detail: 'SLOWS RIVAL', effect: 'frost' },
  { id: 'poison', name: 'POISON', cost: 2200, speed: 1, damage: 0.85, color: 0xc3e37a, detail: 'DAMAGE OVER TIME', effect: 'poison' },
  { id: 'ricochet', name: 'RICOCHET', cost: 2400, speed: 1.1, damage: 1.1, color: 0xb39af0, detail: 'BOUNCES OFF PLATFORMS', effect: 'ricochet' },
  { id: 'laser', name: 'LASER', cost: 2800, speed: 2, damage: 1.8, color: 0xe86bd3, detail: 'INSTANT BEAM', effect: 'laser' },
  { id: 'elite', name: 'ELITE', cost: 3000, speed: 1.25, damage: 1.5, color: 0xe45050, detail: 'FAST + POWERFUL' }
];

const ROBOT_POSITIONS = [
  { x: 790, footY: 430, label: 'LOWER PLATFORM' },
  { x: 730, footY: 350, label: 'LEFT HIGH PLATFORM' },
  { x: 835, footY: 275, label: 'RIGHT HIGH PLATFORM' },
  { x: 690, footY: 305, label: 'CENTER PLATFORM' },
  { x: 820, footY: 390, label: 'LOWER RIGHT PLATFORM' },
  { x: 755, footY: 265, label: 'TOP PLATFORM' },
  { x: 845, footY: 330, label: 'RIGHT PLATFORM' }
];

const toCssColor = color => `#${color.toString(16).padStart(6, '0')}`;

const shadeColor = (color, factor) => {
  const channel = shift => Math.round(((color >> shift) & 255) * factor);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
};

const formatCost = cost => {
  if (cost >= 1000000) return `${cost / 1000000}M`;
  if (cost >= 10000) return `${Math.round(cost / 1000)}K`;
  return String(cost);
};

function svgElement(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function createSkullIcon() {
  const svg = svgElement('svg', { viewBox: '0 0 24 24', class: 'skull-icon', 'aria-hidden': 'true' });
  svg.append(svgElement('path', { d: SKULL_PATH, fill: 'currentColor', 'fill-rule': 'evenodd' }));
  return svg;
}

function createLockBadge(cost) {
  const badge = document.createElement('span');
  badge.className = 'lock-badge';
  const svg = svgElement('svg', { viewBox: '0 0 26 28', 'aria-hidden': 'true' });
  svg.append(
    svgElement('path', { d: 'M7.5 12V8.5a5.5 5.5 0 0 1 11 0V12', fill: 'none', stroke: 'currentColor', 'stroke-width': '3' }),
    svgElement('rect', { x: '2', y: '11', width: '22', height: '16', rx: '3', fill: 'currentColor' })
  );
  const label = document.createElement('span');
  label.textContent = formatCost(cost);
  badge.append(svg, label);
  return badge;
}

function createArrowIcon(accentColor) {
  const accent = toCssColor(accentColor);
  const stripe = toCssColor(shadeColor(accentColor, 0.7));
  const svg = svgElement('svg', { viewBox: '0 0 214 16', class: 'arrow-icon', 'aria-hidden': 'true' });
  svg.append(
    svgElement('rect', { x: '12', y: '6.5', width: '180', height: '3', rx: '1.5', fill: '#f0f0f0' }),
    svgElement('path', { d: 'M1 8 16 1.5 12.5 8 16 14.5Z', fill: accent }),
    svgElement('path', { d: 'M184 8 192 1h21l-8 7 8 7h-21Z', fill: accent }),
    svgElement('path', { d: 'M195 1.5l6 6.5-6 6.5M203 1.5l6 6.5-6 6.5', fill: 'none', stroke: stripe, 'stroke-width': '1.6' })
  );
  return svg;
}

const ui = {
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlay-title'),
  overlayCopy: document.getElementById('overlay-copy'),
  primary: document.getElementById('primary'),
  round: document.getElementById('round'),
  robotPosition: document.getElementById('robot-position'),
  playerHealth: document.getElementById('player-health'),
  playerHealthText: document.getElementById('player-health-text'),
  playerArmor: document.getElementById('player-armor'),
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
    this.cameras.main.setZoom(1.12);
    this.cameras.main.centerOn(WIDTH / 2, HEIGHT / 2);
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
    this.input.keyboard.on('keydown-F', () => this.toggleFullscreen());
  }

  toggleFullscreen() {
    const fullscreenChange = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    fullscreenChange.catch(() => this.setNotice('FULLSCREEN UNAVAILABLE'));
  }

  drawArena() {
    const background = this.add.graphics().setDepth(-10);
    background.fillStyle(PALETTE.background).fillRect(0, 0, WIDTH, HEIGHT);
    background.fillStyle(PALETTE.diamond).fillPoints([
      { x: 250, y: 30 },
      { x: 400, y: 180 },
      { x: 250, y: 330 },
      { x: 100, y: 180 }
    ], true);
    for (let index = 0; index < 48; index++) {
      const x = (index * 197 + 41) % WIDTH;
      const y = (index * 113 + 27) % HEIGHT;
      const radius = index % 9 === 0 ? 3.4 : index % 4 === 0 ? 2.3 : 1.5;
      background.fillStyle(index % 3 === 0 ? PALETTE.speckLight : PALETTE.speck).fillCircle(x, y, radius);
    }
  }

  addPlatforms() {
    this.platformGraphics = this.add.graphics().setDepth(1);
    const towerHeight = HEIGHT - PLAYER_FOOT_Y;
    this.matter.add.rectangle(PLAYER_X, PLAYER_FOOT_Y + towerHeight / 2, TOWER_WIDTH, towerHeight, { isStatic: true, label: 'platform', friction: 0.9 });
    this.drawPlatforms(ROBOT_POSITIONS[0]);
  }

  drawPlatforms(spawn) {
    const graphics = this.platformGraphics.clear();
    const towerLeft = PLAYER_X - TOWER_WIDTH / 2;
    const tile = TOWER_WIDTH / 3;
    graphics.fillStyle(PALETTE.blockSeam).fillRect(towerLeft, PLAYER_FOOT_Y, TOWER_WIDTH, HEIGHT - PLAYER_FOOT_Y);
    for (let row = 0; PLAYER_FOOT_Y + row * tile < HEIGHT; row++) {
      for (let column = 0; column < 3; column++) {
        graphics.fillStyle((row + column) % 2 === 0 ? PALETTE.block : PALETTE.blockAlt)
          .fillRect(towerLeft + column * tile + 1, PLAYER_FOOT_Y + row * tile + 1, tile - 2, tile - 2);
      }
    }
    graphics.fillStyle(PALETTE.block)
      .fillRect(towerLeft, PLAYER_FOOT_Y - 22, 26, 22)
      .fillRect(towerLeft + TOWER_WIDTH - 26, PLAYER_FOOT_Y - 22, 26, 22);
    const rivalLeft = spawn.x - RIVAL_BLOCKS_WIDTH / 2;
    for (let block = 0; block < 3; block++) {
      graphics.fillStyle(block === 1 ? PALETTE.blockAlt : PALETTE.block)
        .fillRect(rivalLeft + block * (RIVAL_BLOCK_SIZE + RIVAL_BLOCK_GAP), spawn.footY, RIVAL_BLOCK_SIZE, RIVAL_BLOCK_SIZE);
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
    this.robotPlatformBody = this.matter.add.rectangle(spawn.x, spawn.footY + RIVAL_BLOCK_SIZE / 2, RIVAL_BLOCKS_WIDTH, RIVAL_BLOCK_SIZE, { isStatic: true, label: 'active-robot-platform', friction: 0.9 });
    this.drawPlatforms(spawn);
    this.robot = { x: spawn.x, footY: spawn.footY, health: 100, label: spawn.label };
    this.robotArmorLevel = Math.min(this.round, ARMOR_MAX_LEVEL);
    this.robotPoison = null;
    this.robotHealth = 100;
    this.robotFlashUntil = 0;
    this.nextRobotShotAt = this.time.now + Phaser.Math.Between(1900, 2900);
    this.syncHud();
    this.setNotice(this.round === 1 ? 'RIVAL INCOMING' : `RIVAL ${String(this.round).padStart(2, '0')} INCOMING`);
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
    if (weapon.effect === 'laser') {
      if (!this.fireLaser(origin, this.aimAngle, power, weapon)) this.setNotice('LASER FIRED');
    } else if (weapon.id === 'minigun') {
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

  fireLaser(origin, angle, power, weapon) {
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    const maxDistance = Math.hypot(WIDTH, HEIGHT);
    let beamDistance = maxDistance;
    let hit = false;
    if (this.robot && this.robot.health > 0) {
      for (let distance = 0; distance <= maxDistance; distance += 8) {
        const position = {
          x: origin.x + directionX * distance,
          y: origin.y + directionY * distance
        };
        if (!this.arrowHitsTarget(position, angle, this.robot)) continue;
        beamDistance = distance + 24;
        hit = true;
        this.hitTarget('player', power, weapon);
        break;
      }
    }
    this.effects.push({
      type: 'laser',
      x: origin.x,
      y: origin.y,
      endX: origin.x + directionX * beamDistance,
      endY: origin.y + directionY * beamDistance,
      color: weapon.color,
      bornAt: this.time.now
    });
    return hit;
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
      x: actor.x + (side === 'player' ? 26 : -26) * ACTOR_SCALE,
      y: actor.footY - 82 * ACTOR_SCALE
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
    const targetY = this.player.footY - 82 * ACTOR_SCALE;
    const speed = Phaser.Math.Between(13, 17);
    const distanceX = targetX - origin.x;
    const travelFrames = Math.abs(distanceX) / speed;
    const compensatedY = targetY - origin.y - GRAVITY * travelFrames * travelFrames / 2;
    const angle = Math.atan2(compensatedY, distanceX) + Phaser.Math.FloatBetween(-0.035, 0.035);
    this.launchArrow('robot', origin.x, origin.y, angle, speed, 0.52);
    const interval = Math.max(1350, 2650 - this.round * 70);
    this.nextRobotShotAt = this.time.now + interval + Phaser.Math.Between(-180, 240);
    this.setNotice('RIVAL FIRED');
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
      ui.robotTimer.textContent = `RIVAL SHOT IN ${remaining.toFixed(1)}s`;
    } else ui.robotTimer.textContent = 'RIVAL SHOT READY';
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
    const headDistance = Phaser.Math.Distance.Between(tipX, tipY, target.x, target.footY - 107 * ACTOR_SCALE);
    const torsoDistance = Phaser.Math.Distance.Between(tipX, tipY, target.x, target.footY - 65 * ACTOR_SCALE);
    return headDistance < 22 * ACTOR_SCALE || torsoDistance < 31 * ACTOR_SCALE;
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
      const notice = weapon.effect === 'frost' ? 'RIVAL SLOWED' : weapon.effect === 'poison' ? 'RIVAL POISONED' : `RIVAL -${damage}`;
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
    this.setNotice('RIVAL DOWN - NEXT ROUND');
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
    ui.overlayCopy.textContent = `You reached round ${this.round} and scored ${this.score}. Your rival won this time.`;
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
    const directionX = Math.cos(this.aimAngle);
    const directionY = Math.sin(this.aimAngle);
    this.aimGraphics.fillStyle(0xf2f2f2, this.chargeStartedAt === null ? 0.4 : 0.9);
    if (weapon.effect === 'laser') {
      for (let distance = 24; distance < 760; distance += 14) {
        this.aimGraphics.fillCircle(origin.x + directionX * distance, origin.y + directionY * distance, 1.8);
      }
      return;
    }
    const speed = (7 + power * 14) * weapon.speed;
    const frameStep = 14 / speed;
    for (let frame = frameStep; frame <= 22; frame += frameStep) {
      const x = origin.x + directionX * speed * frame;
      const y = origin.y + directionY * speed * frame + GRAVITY * frame * frame / 2;
      if (x > WIDTH || y > HEIGHT) break;
      this.aimGraphics.fillCircle(x, y, 1.9);
    }
  }

  drawArrows() {
    this.arrowGraphics.clear();
    for (const arrow of this.arrows) {
      const { x, y } = arrow.body.position;
      const angle = arrow.body.angle;
      const accent = arrow.side === 'player' ? arrow.weapon.color : PALETTE.arrow;
      this.drawArrowSprite(this.arrowGraphics, x, y, Math.cos(angle), Math.sin(angle), accent);
    }
  }

  drawArrowSprite(graphics, x, y, dx, dy, accent) {
    const px = -dy;
    const py = dx;
    const tailX = x - dx * 36;
    const tailY = y - dy * 36;
    graphics.lineStyle(2.8, PALETTE.arrow, 1).lineBetween(tailX, tailY, x + dx * 13, y + dy * 13);
    graphics.fillStyle(accent, 1).fillTriangle(
      x + dx * 24, y + dy * 24,
      x + dx * 10 + px * 5.5, y + dy * 10 + py * 5.5,
      x + dx * 10 - px * 5.5, y + dy * 10 - py * 5.5
    );
    graphics.lineStyle(2, accent, 1);
    for (const offset of [2, 7, 12]) {
      const baseX = tailX + dx * offset;
      const baseY = tailY + dy * offset;
      graphics.lineBetween(baseX, baseY, baseX - dx * 6 + px * 5, baseY - dy * 6 + py * 5);
      graphics.lineBetween(baseX, baseY, baseX - dx * 6 - px * 5, baseY - dy * 6 - py * 5);
    }
  }

  spawnFirework(x, y, time) {
    const colors = [0xf27fb2, PALETTE.orange, 0x4d8ff0, PALETTE.arrow];
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
    this.effects = this.effects.filter(effect => time - effect.bornAt < (effect.type === 'laser' ? 180 : 520));
    for (const effect of this.effects) {
      const age = time - effect.bornAt;
      if (effect.type === 'laser') {
        const opacity = 1 - age / 180;
        this.effectGraphics.lineStyle(8, effect.color, opacity * 0.3).lineBetween(effect.x, effect.y, effect.endX, effect.endY);
        this.effectGraphics.lineStyle(3, effect.color, opacity).lineBetween(effect.x, effect.y, effect.endX, effect.endY);
        this.effectGraphics.lineStyle(1, 0xffffff, opacity).lineBetween(effect.x, effect.y, effect.endX, effect.endY);
        continue;
      }
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
      const targetY = this.player.footY - 82 * ACTOR_SCALE;
      const distanceX = this.player.x - origin.x;
      const travelFrames = Math.abs(distanceX) / 15;
      const correctedY = targetY - origin.y - GRAVITY * travelFrames * travelFrames / 2;
      const robotAngle = Math.atan2(correctedY, distanceX);
      this.drawArcher(this.robot, 'robot', robotAngle, this.time.now < this.robotFlashUntil);
      const barWidth = 44 * ACTOR_SCALE;
      const barX = this.robot.x - barWidth / 2;
      const barY = this.robot.footY - 146 * ACTOR_SCALE;
      this.actorGraphics.fillStyle(PALETTE.redDark, 1).fillRect(barX, barY, barWidth, 8);
      this.actorGraphics.fillStyle(PALETTE.red, 1).fillRect(barX, barY, barWidth * this.robot.health / 100, 8);
    }
  }

  drawStrength(side, time) {
    if (!this.started || this.ended) return 0;
    if (side === 'player') {
      return this.chargeStartedAt === null ? 0 : Phaser.Math.Clamp((time - this.chargeStartedAt) / CHARGE_TIME, 0, 1);
    }
    if (!this.robot || this.robot.health <= 0) return 0;
    return Phaser.Math.Clamp(1 - (this.nextRobotShotAt - time) / 900, 0, 1);
  }

  drawArcher(actor, side, angle, flash) {
    const graphics = this.actorGraphics;
    const time = this.time.now;
    const facing = side === 'player' ? 1 : -1;
    const x = 0;
    const footY = 0;
    const frontColor = flash ? PALETTE.hit : PALETTE.body;
    const backColor = flash ? PALETTE.hitBack : PALETTE.bodyBack;
    const armorLevel = side === 'player' ? this.armorLevel : this.robotArmorLevel;
    const sway = Math.sin(time / 390 + (facing > 0 ? 0 : 1.4)) * 1.5;
    const recoil = flash ? -facing * 6 : 0;
    const hip = { x: x + recoil * 0.4, y: footY - 46 };
    const neck = { x: x + sway + recoil, y: footY - 88 };
    const shoulder = { x: neck.x, y: neck.y + 6 };
    const head = { x: neck.x + facing * 2, y: footY - 107 };
    const frontFoot = { x: x + facing * 22, y: footY - 5 };
    const backFoot = { x: x - facing * 18, y: footY - 5 };
    const strength = this.drawStrength(side, time);
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const perpX = -dirY;
    const perpY = dirX;
    const origin = { x: facing * 26, y: -82 };
    const bowCenter = { x: origin.x - dirX * 5, y: origin.y - dirY * 5 };
    const grip = { x: bowCenter.x + dirX * 11, y: bowCenter.y + dirY * 11 };
    const pull = 6 + strength * 20;
    const nock = { x: bowCenter.x - dirX * pull, y: bowCenter.y - dirY * pull };
    const lerp = (from, to, amount) => ({ x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount });
    const bend = (start, end, upper, lower, direction) => {
      const distance = Math.min(Math.hypot(end.x - start.x, end.y - start.y), upper + lower - 0.01);
      const cosine = (upper * upper + distance * distance - lower * lower) / (2 * upper * Math.max(distance, 0.01));
      const jointAngle = Math.atan2(end.y - start.y, end.x - start.x) + Math.acos(Phaser.Math.Clamp(cosine, -1, 1)) * direction;
      return { x: start.x + Math.cos(jointAngle) * upper, y: start.y + Math.sin(jointAngle) * upper };
    };
    const frontKnee = bend(hip, frontFoot, 24, 23, -facing);
    const backKnee = bend(hip, backFoot, 24, 23, -facing);
    const bowElbow = bend(shoulder, grip, 17, 17, facing);
    const drawElbow = bend(shoulder, nock, 17, 16, facing);
    const limb = (from, to, width, color) => {
      graphics.lineStyle(width, color, 1).lineBetween(from.x, from.y, to.x, to.y);
      graphics.fillStyle(color, 1).fillCircle(from.x, from.y, width / 2).fillCircle(to.x, to.y, width / 2);
    };
    const guard = (from, to, color) => limb(lerp(from, to, 0.18), lerp(from, to, 0.82), 12, color);
    const spikes = (from, to, count) => {
      const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      const ux = (to.x - from.x) / length;
      const uy = (to.y - from.y) / length;
      const nx = uy * facing;
      const ny = -ux * facing;
      graphics.fillStyle(PALETTE.stud, 1);
      for (let index = 0; index < count; index++) {
        const point = lerp(from, to, 0.18 + 0.64 * (index + 0.5) / count);
        const baseX = point.x + nx * 5;
        const baseY = point.y + ny * 5;
        graphics.fillTriangle(baseX - ux * 3, baseY - uy * 3, baseX + ux * 3, baseY + uy * 3, baseX + nx * 5, baseY + ny * 5);
      }
    };
    const radialSpikes = (center, radius, angles, length) => {
      graphics.fillStyle(PALETTE.stud, 1);
      for (const spikeAngle of angles) {
        const cx = Math.cos(spikeAngle);
        const cy = Math.sin(spikeAngle);
        const baseX = center.x + cx * radius;
        const baseY = center.y + cy * radius;
        graphics.fillTriangle(baseX - cy * 3.2, baseY + cx * 3.2, baseX + cy * 3.2, baseY - cx * 3.2, baseX + cx * length, baseY + cy * length);
      }
    };
    const enterActorSpace = () => {
      graphics.save();
      graphics.translateCanvas(actor.x, actor.footY);
      graphics.scaleCanvas(ACTOR_SCALE, ACTOR_SCALE);
    };

    enterActorSpace();
    if (side === 'player' && this.shieldActive) {
      graphics.fillStyle(0xffffff, 0.07).fillCircle(x, footY - 66, 56);
      graphics.lineStyle(2, PALETTE.arrow, 0.55).strokeCircle(x, footY - 66, 56);
    }
    limb(hip, backKnee, 11, backColor);
    limb(backKnee, backFoot, 10, backColor);
    if (armorLevel >= 5) guard(backKnee, backFoot, PALETTE.metalBack);
    limb(hip, neck, 17, frontColor);
    limb(hip, frontKnee, 11, frontColor);
    limb(frontKnee, frontFoot, 10, frontColor);
    if (armorLevel >= 5) {
      guard(frontKnee, frontFoot, PALETTE.metal);
      graphics.fillStyle(PALETTE.metalLight, 1).fillCircle(frontKnee.x, frontKnee.y, 6.5);
    }
    if (armorLevel >= 7) spikes(frontKnee, frontFoot, 3);
    limb(shoulder, bowElbow, 9, frontColor);
    limb(bowElbow, grip, 8.5, frontColor);
    if (armorLevel >= 4) guard(bowElbow, grip, PALETTE.metal);
    if (armorLevel >= 7) spikes(bowElbow, grip, 2);
    graphics.fillStyle(frontColor, 1).fillCircle(head.x, head.y, 17);

    if (armorLevel >= 1) {
      const chestX = (hip.x + neck.x) / 2;
      const chestTop = neck.y + 2;
      graphics.fillStyle(PALETTE.plate, 1).fillRoundedRect(chestX - 11, chestTop, 22, hip.y - chestTop + 3, 7);
      graphics.lineStyle(1.5, PALETTE.plateSeam, 1)
        .lineBetween(chestX, chestTop + 11, chestX, hip.y)
        .lineBetween(chestX - 9, chestTop + 11, chestX + 9, chestTop + 11)
        .lineBetween(chestX - 8, chestTop + 21, chestX + 8, chestTop + 21)
        .lineBetween(chestX - 8, chestTop + 31, chestX + 8, chestTop + 31);
      if (armorLevel >= 8) {
        graphics.fillStyle(PALETTE.metal, 1)
          .fillRoundedRect(chestX - 13, hip.y - 1, 12, 12, 3)
          .fillRoundedRect(chestX + 1, hip.y - 1, 12, 12, 3);
        graphics.fillStyle(PALETTE.metalLight, 1).fillRoundedRect(neck.x - 9, neck.y - 4, 18, 7, 3);
      }
    }
    if (armorLevel >= 2) {
      if (armorLevel >= 8) {
        graphics.fillStyle(PALETTE.metal, 1).fillTriangle(head.x - 4, head.y - 16, head.x + 4, head.y - 16, head.x, head.y - 27);
      }
      graphics.fillStyle(PALETTE.metal, 1).fillCircle(head.x, head.y, 18.5);
      graphics.fillStyle(PALETTE.metalLight, 1).fillEllipse(head.x - facing * 3, head.y - 10, 20, 7);
      graphics.fillStyle(PALETTE.visor, 1).fillRect(facing > 0 ? head.x - 2 : head.x - 16, head.y - 4, 18, 4);
      const faceX = head.x + facing * 9;
      if (side === 'robot') {
        graphics.fillStyle(PALETTE.orange, 1)
          .fillRect(faceX - 8, head.y - 4, 16, 4)
          .fillRect(faceX - 2, head.y - 10, 4, 20);
      } else {
        graphics.fillStyle(PALETTE.visor, 1);
        for (const [offsetX, offsetY] of [[-2.5, 5], [2.5, 5], [-2.5, 10], [2.5, 10]]) {
          graphics.fillCircle(faceX + offsetX, head.y + offsetY, 1.4);
        }
      }
    }

    this.drawBow(graphics, bowCenter, dirX, dirY, perpX, perpY, nock);
    graphics.fillStyle(frontColor, 1).fillCircle(grip.x, grip.y, 4.6);
    if (strength > 0) {
      const accent = side === 'player' ? WEAPONS.find(item => item.id === this.selectedWeapon).color : PALETTE.arrow;
      graphics.restore();
      this.drawArrowSprite(
        graphics,
        actor.x + nock.x * ACTOR_SCALE + dirX * 36,
        actor.footY + nock.y * ACTOR_SCALE + dirY * 36,
        dirX,
        dirY,
        accent
      );
      enterActorSpace();
    }
    limb(shoulder, drawElbow, 9, frontColor);
    limb(drawElbow, nock, 8.5, frontColor);
    if (armorLevel >= 4) guard(drawElbow, nock, PALETTE.metal);
    if (armorLevel >= 7) spikes(drawElbow, nock, 2);
    if (armorLevel >= 3) {
      const pad = { x: shoulder.x - facing * 2, y: shoulder.y - 1 };
      if (armorLevel >= 6) {
        const up = -Math.PI / 2;
        radialSpikes(pad, 9, [up - facing * 0.4, up - facing * 0.95, up - facing * 1.5], 16);
      }
      graphics.fillStyle(PALETTE.metal, 1).fillEllipse(pad.x, pad.y, 22, 16);
      graphics.fillStyle(PALETTE.metalLight, 1).fillEllipse(pad.x, pad.y - 3, 15, 6);
    }
    graphics.restore();
  }

  drawBow(graphics, center, dirX, dirY, perpX, perpY, nock) {
    const point = t => ({
      x: center.x + perpX * t * 27 + dirX * 11 * (1 - t * t),
      y: center.y + perpY * t * 27 + dirY * 11 * (1 - t * t)
    });
    const tips = [point(-1), point(1)];
    graphics.lineStyle(1.3, PALETTE.bowString, 0.95)
      .lineBetween(tips[0].x, tips[0].y, nock.x, nock.y)
      .lineBetween(nock.x, nock.y, tips[1].x, tips[1].y);
    graphics.lineStyle(5, PALETTE.bow, 1).beginPath();
    for (let step = 0; step <= 12; step++) {
      const bowPoint = point(step / 12 * 2 - 1);
      if (step === 0) graphics.moveTo(bowPoint.x, bowPoint.y);
      else graphics.lineTo(bowPoint.x, bowPoint.y);
    }
    graphics.strokePath();
    graphics.lineStyle(3, PALETTE.bow, 1);
    for (const tip of tips) {
      graphics.lineBetween(tip.x, tip.y, tip.x + dirX * 5, tip.y + dirY * 5);
    }
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
    const reduction = Math.round(ARMOR_DAMAGE_REDUCTION[this.armorLevel] * 100);
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
    ui.robotPosition.textContent = this.robot ? `RIVAL: ${this.robot.label}` : 'RIVAL DEFEATED';
    ui.playerHealth.style.width = `${this.playerHealth}%`;
    ui.playerHealthText.textContent = this.playerHealth;
    ui.playerArmor.textContent = this.armorLevel;
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
      button.disabled = !this.started || this.ended || (!owned && this.points < weapon.cost);
      button.setAttribute('aria-pressed', String(selected));
      button.title = weapon.detail;
      button.setAttribute('aria-label', `${weapon.name}: ${weapon.detail}. ${selected ? 'Equipped' : owned ? 'Owned' : `Costs ${weapon.cost} points`}`);
      if (selected) {
        button.style.setProperty('--item-bg', toCssColor(weapon.color));
        button.style.setProperty('--item-ink', '#262626');
      } else if (owned) {
        button.style.setProperty('--item-bg', '#d9d9d9');
        button.style.setProperty('--item-ink', '#4b4b4b');
      }
      if (!owned) button.append(createLockBadge(weapon.cost));
      const name = document.createElement('span');
      name.className = 'weapon-name';
      name.textContent = weapon.name;
      button.append(name, createArrowIcon(selected ? shadeColor(weapon.color, 0.62) : weapon.color));
      return button;
    }));
    const armorCost = ARMOR_COST * (this.armorLevel + 1);
    const upgradeButton = ({ id, label, color, cost, state, disabled, pressed = false, description }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = state ? 'upgrade-button is-complete' : 'upgrade-button';
      button.dataset.upgrade = id;
      button.style.setProperty('--stat-color', color);
      button.disabled = disabled;
      button.setAttribute('aria-pressed', String(pressed));
      button.title = description;
      button.setAttribute('aria-label', `${label}. ${description}. ${state || `Costs ${cost} points`}`);
      const chip = document.createElement('span');
      chip.className = 'price-chip';
      if (state) chip.textContent = state;
      else chip.append(createSkullIcon(), document.createTextNode(formatCost(cost)));
      const text = document.createElement('span');
      text.className = 'stat-label';
      text.textContent = label;
      button.append(chip, text);
      return button;
    };
    const closed = !this.started || this.ended;
    ui.upgrades.replaceChildren(
      upgradeButton({
        id: 'armor',
        label: `ARMOR +${this.armorLevel}`,
        color: toCssColor(PALETTE.red),
        cost: armorCost,
        state: this.armorLevel >= ARMOR_MAX_LEVEL ? 'MAX' : null,
        disabled: closed || this.armorLevel >= ARMOR_MAX_LEVEL || this.points < armorCost,
        pressed: this.armorLevel > 0,
        description: `${Math.round(ARMOR_DAMAGE_REDUCTION[this.armorLevel] * 100)}% less damage, level ${this.armorLevel} of ${ARMOR_MAX_LEVEL}`
      }),
      upgradeButton({
        id: 'medkit',
        label: `HEALTH +${MEDKIT_HEAL}`,
        color: toCssColor(PALETTE.red),
        cost: MEDKIT_COST,
        state: this.playerHealth >= 100 ? 'FULL' : null,
        disabled: closed || this.playerHealth >= 100 || this.points < MEDKIT_COST,
        description: `Medkit restores up to ${MEDKIT_HEAL} health`
      }),
      upgradeButton({
        id: 'shield',
        label: `SHIELD +${this.shieldActive ? 1 : 0}`,
        color: '#4d8ff0',
        cost: SHIELD_COST,
        state: this.shieldActive ? 'ACTIVE' : null,
        disabled: closed || this.shieldActive || this.points < SHIELD_COST,
        pressed: this.shieldActive,
        description: 'Blocks the next hit'
      })
    );
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game',
  backgroundColor: '#3d3d3d',
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