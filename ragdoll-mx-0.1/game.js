/* global Matter */
'use strict';

(() => {
  const canvas = document.getElementById('game');
  const ui = Object.fromEntries([
    'overlay', 'title', 'description', 'primary', 'pause', 'restart', 'sound',
    'power', 'status', 'round', 'score', 'player-health', 'enemy-health',
    'player-meter', 'enemy-meter'
  ].map(id => [id, document.getElementById(id)]));
  if (typeof Matter === 'undefined') {
    ui.title.textContent = 'Physics engine unavailable';
    ui.description.textContent = 'The local Matter.js file could not load. Reload the page or check the server.';
    ui.primary.disabled = true;
    ui.restart.disabled = true;
    ui.sound.disabled = true;
    return;
  }
  const { Engine, Bodies, Body, Composite, Constraint, Vector, Vertices } = Matter;
  const ctx = canvas.getContext('2d');
  const STEP = 1000 / 60;
  const ARROW_GRAVITY = 300;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  const engine = Engine.create({ positionIterations: 10, constraintIterations: 8 });
  engine.gravity.y = 1;
  let actors, terrain, arrows, sparks;
  let state = 'ready';
  let previousState = 'playing';
  let time = 0;
  let round = 1;
  let wins = 0;
  let losses = 0;
  let charging = false;
  let chargeAt = 0;
  let nextPlayerShot = 0;
  let nextEnemyShot = 0;
  let resultAt = 0;
  let pointerId = null;
  let soundEnabled = false;
  let audio;
  const aim = { x: 780, y: 310 };

  function tone(frequency, duration) {
    if (!soundEnabled) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, audio.currentTime + duration);
    gain.gain.setValueAtTime(0.06, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function endpoint(body, y) {
    return Vector.add(body.position, Vector.rotate({ x: 0, y }, body.angle));
  }

  function createActor(x, side) {
    const group = Body.nextGroup(true);
    const parts = {};
    const add = (name, px, py, width, height) => {
      parts[name] = Bodies.rectangle(px, py, width, height, {
        label: name, friction: 0.8, frictionAir: 0.035,
        collisionFilter: { group }, chamfer: { radius: 3 }
      });
      return parts[name];
    };
    add('torso', x, 365, 22, 42);
    parts.head = Bodies.circle(x, 328, 14, { label: 'head', frictionAir: 0.035, collisionFilter: { group } });
    add('hips', x, 393, 23, 16);
    add('backThigh', x - 9, 414, 10, 30);
    add('backShin', x - 13, 443, 9, 30);
    add('frontThigh', x + 9, 414, 10, 30);
    add('frontShin', x + 13, 443, 9, 30);
    add('backArm', x - 6, 361, 9, 28);
    add('backForearm', x - 6, 387, 8, 26);
    add('frontArm', x + 6, 361, 9, 28);
    add('frontForearm', x + 6, 387, 8, 26);
    const joints = [];
    const join = (a, b, pointA, pointB) => joints.push(Constraint.create({
      bodyA: parts[a], bodyB: parts[b], pointA, pointB, length: 0,
      stiffness: 0.85, damping: 0.12
    }));
    join('torso', 'head', { x: 0, y: -21 }, { x: 0, y: 14 });
    join('torso', 'hips', { x: 0, y: 21 }, { x: 0, y: -7 });
    for (const [prefix, sign] of [['back', -1], ['front', 1]]) {
      join('hips', `${prefix}Thigh`, { x: sign * 9, y: 6 }, { x: 0, y: -15 });
      join(`${prefix}Thigh`, `${prefix}Shin`, { x: 0, y: 15 }, { x: 0, y: -15 });
      join('torso', `${prefix}Arm`, { x: sign * 6, y: -17 }, { x: 0, y: -14 });
      join(`${prefix}Arm`, `${prefix}Forearm`, { x: 0, y: 14 }, { x: 0, y: -13 });
    }
    Composite.add(engine.world, [...Object.values(parts), ...joints]);
    return { x, side, parts, joints, health: 100, angle: side === 'player' ? -0.15 : Math.PI + 0.15, hitAt: -1000 };
  }

  function reset(newMatch) {
    if (newMatch) { round = 1; wins = 0; losses = 0; }
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    terrain = [
      Bodies.rectangle(180, 501, 180, 82, { isStatic: true }),
      Bodies.rectangle(780, 501, 180, 82, { isStatic: true }),
      Bodies.rectangle(480, 565, 1200, 40, { isStatic: true })
    ];
    Composite.add(engine.world, terrain);
    actors = [createActor(180, 'player'), createActor(780, 'enemy')];
    arrows = [];
    sparks = [];
    time = 0;
    nextPlayerShot = 0;
    nextEnemyShot = 3200;
    resultAt = Infinity;
    cancelCharge();
    state = 'ready';
    ui.pause.disabled = true;
    showOverlay('The first duel', 'Aim above your rival to allow for gravity. Hold to charge, release to fire. Headshots deal extra damage.', 'Start duel');
    ui.status.textContent = 'Ready. One arena, one bow, real jointed bodies.';
    updateHud();
  }

  function muscle(body, target, strength = 0.11) {
    const acceleration = clamp(wrap(target - body.angle) * strength - body.angularVelocity * 0.32, -0.055, 0.055);
    body.torque += body.inertia * acceleration / (STEP * STEP);
  }

  function balance(actor) {
    if (actor.health <= 0) return;
    const p = actor.parts;
    // A soft hip spring supplies active balance; no body is pinned or teleported.
    Body.applyForce(p.hips, p.hips.position, {
      x: clamp((actor.x - p.hips.position.x) * 0.00022 - p.hips.velocity.x * 0.002, -0.018, 0.018),
      y: clamp((392 - p.hips.position.y) * 0.0007 - p.hips.velocity.y * 0.003 - 0.005, -0.04, 0.04)
    });
    muscle(p.torso, 0);
    muscle(p.hips, 0);
    muscle(p.head, 0, 0.05);
    muscle(p.backThigh, 0.16);
    muscle(p.backShin, -0.08);
    muscle(p.frontThigh, -0.16);
    muscle(p.frontShin, 0.08);
    const armAngle = actor.angle - Math.PI / 2;
    muscle(p.frontArm, armAngle, 0.16);
    muscle(p.frontForearm, armAngle, 0.16);
    muscle(p.backArm, armAngle + (actor.side === 'player' ? 0.5 : -0.5));
    muscle(p.backForearm, armAngle - (actor.side === 'player' ? 0.55 : -0.55));
  }

  function bowOrigin(actor) {
    return endpoint(actor.parts.frontForearm, 13);
  }

  function power() {
    return charging ? clamp((time - chargeAt) / 1000, 0, 1) : 0;
  }

  function shoot(actor, shotPower) {
    const origin = bowOrigin(actor);
    const speed = 680 + shotPower * 420;
    const direction = { x: Math.cos(actor.angle), y: Math.sin(actor.angle) };
    arrows.push({
      x: origin.x + direction.x * 20, y: origin.y + direction.y * 20,
      vx: direction.x * speed, vy: direction.y * speed,
      side: actor.side, power: shotPower, born: time, angle: actor.angle, attached: null
    });
    tone(actor.side === 'player' ? 420 : 260, 0.1);
  }

  function cancelCharge() {
    charging = false;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    pointerId = null;
    ui.power.value = 0;
  }

  function beginCharge() {
    if (state !== 'playing' || time < nextPlayerShot || charging) return false;
    charging = true;
    chargeAt = time;
    return true;
  }

  function releaseShot() {
    if (!charging) return;
    if (state === 'playing') {
      shoot(actors[0], power());
      nextPlayerShot = time + 450;
      ui.status.textContent = 'Arrow away. Aim higher for a longer arc.';
    }
    cancelCharge();
  }

  // Sweep the arrow tip over its entire step to avoid tunnelling at full power.
  function segmentHit(start, end, body) {
    if (Vertices.contains(body.vertices, start)) return 0;
    const delta = Vector.sub(end, start);
    let nearest = Infinity;
    for (let i = 0; i < body.vertices.length; i++) {
      const a = body.vertices[i];
      const b = body.vertices[(i + 1) % body.vertices.length];
      const edge = Vector.sub(b, a);
      const denominator = Vector.cross(delta, edge);
      if (Math.abs(denominator) < 1e-8) continue;
      const offset = Vector.sub(a, start);
      const t = Vector.cross(offset, edge) / denominator;
      const u = Vector.cross(offset, delta) / denominator;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) nearest = Math.min(nearest, t);
    }
    return nearest;
  }

  function damage(actor, body, arrow) {
    const amount = Math.round((18 + arrow.power * 16) * (body === actor.parts.head ? 1.65 : 1));
    actor.health = Math.max(0, actor.health - amount);
    actor.hitAt = time;
    Body.setVelocity(body, {
      x: body.velocity.x + arrow.vx * 0.004,
      y: body.velocity.y + arrow.vy * 0.004
    });
    Body.setAngularVelocity(body, body.angularVelocity + (arrow.vx > 0 ? 0.12 : -0.12));
    sparks.push({ x: arrow.x, y: arrow.y, text: `${body === actor.parts.head ? 'HEAD ' : ''}-${amount}`, born: time });
    tone(120, 0.16);
    ui.status.textContent = `${actor.side === 'enemy' ? 'Rival' : 'You'}: ${body === actor.parts.head ? 'headshot' : 'hit'} for ${amount}.`;
    if (actor.health === 0) {
      state = actor.side === 'enemy' ? 'won' : 'lost';
      if (state === 'won') wins++; else losses++;
      resultAt = time + 1400;
      cancelCharge();
      ui.pause.disabled = true;
    }
    updateHud();
  }

  function updateArrows() {
    for (const arrow of arrows) {
      if (arrow.attached) {
        const offset = Vector.rotate(arrow.local, arrow.attached.angle);
        arrow.x = arrow.attached.position.x + offset.x;
        arrow.y = arrow.attached.position.y + offset.y;
        arrow.angle = arrow.attached.angle + arrow.localAngle;
        continue;
      }
      const start = { x: arrow.x, y: arrow.y };
      arrow.vy += ARROW_GRAVITY / 60;
      const end = { x: arrow.x + arrow.vx / 60, y: arrow.y + arrow.vy / 60 };
      arrow.angle = Math.atan2(arrow.vy, arrow.vx);
      const target = actors.find(actor => actor.side !== arrow.side);
      const bodies = [...terrain, ...Object.values(target.parts)];
      let fraction = Infinity;
      let hitBody;
      for (const body of bodies) {
        const hit = segmentHit(start, end, body);
        if (hit < fraction) { fraction = hit; hitBody = body; }
      }
      arrow.x = hitBody ? start.x + (end.x - start.x) * fraction : end.x;
      arrow.y = hitBody ? start.y + (end.y - start.y) * fraction : end.y;
      if (hitBody) {
        arrow.attached = hitBody;
        arrow.local = Vector.rotate(Vector.sub(arrow, hitBody.position), -hitBody.angle);
        arrow.localAngle = arrow.angle - hitBody.angle;
        if (state === 'playing' && target.health > 0 && Object.values(target.parts).includes(hitBody)) damage(target, hitBody, arrow);
      }
    }
    arrows = arrows.filter(arrow => time - arrow.born < 9000 && arrow.x > -100 && arrow.x < 1060 && arrow.y < 620);
    sparks = sparks.filter(spark => time - spark.born < 900);
  }

  function enemyAim() {
    const origin = bowOrigin(actors[1]);
    const target = actors[0].parts.torso.position;
    const dx = target.x - origin.x;
    const flight = Math.abs(dx) / 890;
    return Math.atan2(target.y - origin.y - ARROW_GRAVITY * flight * flight / 2, dx);
  }

  function step() {
    if (state === 'paused') return;
    time += STEP;
    const origin = bowOrigin(actors[0]);
    actors[0].angle = clamp(Math.atan2(aim.y - origin.y, Math.max(30, aim.x - origin.x)), -1.15, 0.55);
    actors[1].angle = enemyAim();
    actors.forEach(balance);
    Engine.update(engine, STEP);
    if (state === 'playing' && time >= nextEnemyShot) {
      actors[1].angle += (Math.random() - 0.5) * 0.065;
      shoot(actors[1], 0.5);
      nextEnemyShot = time + Math.max(1700, 3000 - round * 100);
    }
    updateArrows();
    if (time >= resultAt) {
      const won = state === 'won';
      showOverlay(won ? 'Duel won' : 'Rival wins', won ? 'A clean finish. Ready for the next round?' : 'Try aiming slightly above the rival. Charge longer for faster arrows.', 'Next round');
      resultAt = Infinity;
    }
    ui.power.value = power();
  }

  function updateHud() {
    actors.forEach(actor => {
      ui[`${actor.side}-health`].textContent = String(actor.health);
      ui[`${actor.side}-meter`].value = actor.health;
    });
    ui.round.textContent = String(round);
    ui.score.textContent = `${wins} W / ${losses} L`;
  }

  function showOverlay(title, description, button) {
    ui.title.textContent = title;
    ui.description.textContent = description;
    ui.primary.textContent = button;
    ui.overlay.hidden = false;
  }

  function pause() {
    if (state === 'paused') {
      state = previousState;
      ui.overlay.hidden = true;
      ui.pause.textContent = 'Pause (P)';
      return;
    }
    if (state !== 'playing') return;
    previousState = state;
    state = 'paused';
    cancelCharge();
    showOverlay('Duel paused', 'Take a breath. Your rival waits too.', 'Resume duel');
    ui.pause.textContent = 'Resume (P)';
  }

  function start() {
    if (state === 'paused') { pause(); return; }
    if (state === 'won' || state === 'lost') { round++; reset(false); }
    state = 'playing';
    nextEnemyShot = time + 3200;
    ui.overlay.hidden = true;
    ui.pause.disabled = false;
    ui.pause.textContent = 'Pause (P)';
    ui.status.textContent = 'Aim, hold to charge, and release. Your rival fires independently.';
    canvas.focus({ preventScroll: true });
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    aim.x = (event.clientX - rect.left) * 960 / rect.width;
    aim.y = (event.clientY - rect.top) * 540 / rect.height;
  }
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    updatePointer(event);
    if (beginCharge()) {
      pointerId = event.pointerId;
      canvas.setPointerCapture(pointerId);
      canvas.focus({ preventScroll: true });
    }
  });
  canvas.addEventListener('pointerup', event => { if (event.pointerId === pointerId) releaseShot(); });
  canvas.addEventListener('pointercancel', cancelCharge);
  canvas.addEventListener('lostpointercapture', cancelCharge);
  window.addEventListener('keydown', event => {
    if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) return;
    const key = event.key.toLowerCase();
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) beginCharge();
    } else if (!event.repeat && key === 'p') pause();
    else if (!event.repeat && key === 'r') reset(true);
    else if (key === 'h') location.href = '../index.html';
  });
  window.addEventListener('keyup', event => {
    if (event.code === 'Space' && pointerId === null) releaseShot();
  });
  window.addEventListener('blur', () => { if (state === 'playing') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); });
  ui.primary.addEventListener('click', start);
  ui.pause.addEventListener('click', pause);
  ui.restart.addEventListener('click', () => reset(true));
  ui.sound.addEventListener('click', async () => {
    if (!soundEnabled) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) { ui.status.textContent = 'Audio is not supported in this browser.'; return; }
      audio ??= new AudioContext();
      try { await audio.resume(); }
      catch (error) {
        console.error('MX audio could not start', error);
        ui.status.textContent = 'Audio could not start. Try enabling sound again.';
        return;
      }
    }
    soundEnabled = !soundEnabled;
    ui.sound.textContent = `Sound: ${soundEnabled ? 'on' : 'off'}`;
    ui.sound.setAttribute('aria-pressed', String(soundEnabled));
  });

  function line(a, b, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function drawActor(actor) {
    const color = time - actor.hitAt < 160 ? '#fff' : actor.side === 'player' ? '#9cddc6' : '#ffc078';
    ctx.lineCap = 'round';
    for (const [name, body] of Object.entries(actor.parts)) {
      if (name === 'head') {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, 14, 0, Math.PI * 2);
        ctx.fill();
        const eye = Vector.add(body.position, Vector.rotate({ x: actor.side === 'player' ? 6 : -6, y: -2 }, body.angle));
        ctx.fillStyle = '#17232b';
        ctx.fillRect(eye.x - 2, eye.y - 2, 4, 4);
      } else {
        const length = name === 'torso' ? 19 : name === 'hips' ? 6 : name.includes('Forearm') ? 12 : 14;
        line(endpoint(body, -length), endpoint(body, length), color, name === 'torso' ? 19 : name === 'hips' ? 18 : 8);
      }
    }
    if (actor.health <= 0) return;
    const bow = bowOrigin(actor);
    ctx.save();
    ctx.translate(bow.x, bow.y);
    ctx.rotate(actor.angle);
    ctx.strokeStyle = '#e4a95c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, -29);
    ctx.quadraticCurveTo(22, 0, -5, 29);
    ctx.stroke();
    line({ x: -5, y: -29 }, { x: -5 - (actor.side === 'player' ? power() * 14 : 0), y: 0 }, '#dfdfce', 1);
    line({ x: -5 - (actor.side === 'player' ? power() * 14 : 0), y: 0 }, { x: -5, y: 29 }, '#dfdfce', 1);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, 960, 540);
    ctx.fillStyle = '#1b2b35';
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = '#243842';
    ctx.beginPath();
    ctx.moveTo(0, 350); ctx.lineTo(220, 180); ctx.lineTo(410, 350);
    ctx.lineTo(660, 150); ctx.lineTo(960, 370); ctx.lineTo(960, 540); ctx.lineTo(0, 540);
    ctx.fill();
    ctx.fillStyle = '#a8b7ac';
    ctx.beginPath(); ctx.arc(480, 115, 32, 0, Math.PI * 2); ctx.fill();
    for (const x of [90, 690]) {
      ctx.fillStyle = '#40575b'; ctx.fillRect(x, 460, 180, 80);
      ctx.fillStyle = '#83a699'; ctx.fillRect(x - 4, 460, 188, 8);
      ctx.strokeStyle = '#2c4149'; ctx.lineWidth = 2;
      for (let y = 486; y < 540; y += 26) {
        line({ x, y }, { x: x + 180, y }, '#2c4149', 2);
        line({ x: x + 90, y: y - 25 }, { x: x + 90, y }, '#2c4149', 2);
      }
    }
    actors.forEach(drawActor);
    if (state === 'playing') {
      const origin = bowOrigin(actors[0]);
      const speed = 680 + power() * 420;
      ctx.fillStyle = '#dfdfce80';
      for (let i = 1; i <= 12; i++) {
        const t = i * 0.045;
        ctx.beginPath();
        ctx.arc(origin.x + Math.cos(actors[0].angle) * speed * t, origin.y + Math.sin(actors[0].angle) * speed * t + ARROW_GRAVITY * t * t / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const arrow of arrows) {
      const direction = { x: Math.cos(arrow.angle), y: Math.sin(arrow.angle) };
      const tail = { x: arrow.x - direction.x * 30, y: arrow.y - direction.y * 30 };
      line(tail, arrow, '#e8eee8', 2);
      line(tail, { x: tail.x - direction.y * 4 - direction.x * 6, y: tail.y + direction.x * 4 - direction.y * 6 }, '#ffc078', 2);
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px system-ui';
    for (const spark of sparks) {
      ctx.fillStyle = '#fff1cb';
      ctx.fillText(spark.text, spark.x, spark.y - 18 - (time - spark.born) / 30);
    }
  }

  reset(true);
  let lastFrame;
  let accumulator = 0;
  function frame(now) {
    if (lastFrame !== undefined) accumulator += Math.min(now - lastFrame, 100);
    lastFrame = now;
    while (accumulator >= STEP) { step(); accumulator -= STEP; }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
