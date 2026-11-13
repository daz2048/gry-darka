const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'banner-snake.js'), 'utf8');

function createSimulation() {
  const faces = [0, 1, 2].map(() => {
    const canvas = {
      width: 720, height: 160, frames: [], current: [],
      getContext() {
        return {
          clearRect: () => { canvas.current = []; canvas.frames.push(canvas.current); },
          fillRect: (x, y, width, height) => canvas.current.push([x, y, width, height]),
        };
      },
    };
    return { dataset: {}, canvas, querySelector: () => canvas };
  });
  let flipped = false;
  const flip = {
    querySelectorAll: () => faces.slice(0, 2),
    classList: { contains: () => flipped },
  };
  const document = {
    hidden: false,
    querySelector: () => flip,
    getElementById: () => faces[2],
    addEventListener(name, callback) { this[name] = callback; },
  };
  const motion = {
    matches: false,
    addEventListener(name, callback) { this[name] = callback; },
  };
  let intersection;
  let mutation;
  let timer = null;
  vm.runInNewContext(script, {
    document,
    matchMedia: () => motion,
    IntersectionObserver: class {
      constructor(callback) { intersection = callback; }
      observe() {}
    },
    MutationObserver: class {
      constructor(callback) { mutation = callback; }
      observe() {}
    },
    setInterval(callback, delay) {
      assert.equal(delay, 180);
      assert.equal(timer, null);
      timer = callback;
      return 1;
    },
    clearInterval() { timer = null; },
    Math,
  });
  return {
    faces, document, motion, flip,
    intersect(target, isIntersecting) { intersection([{ target, isIntersecting }]); },
    change() { mutation(); },
    setFlipped(value) { flipped = value; mutation(); },
    tick() { assert.ok(timer); timer(); },
    running() { return timer !== null; },
  };
}

test('snake advances, eats food, and keeps following adjacent cells without collisions', () => {
  const sim = createSimulation();
  sim.faces[0].dataset.effect = 'snake';
  sim.intersect(sim.flip, true);
  const canvas = sim.faces[0].canvas;
  let grew = false;
  for (let i = 0; i < 500; i++) {
    sim.tick();
    const frame = canvas.current;
    const snake = frame.slice(193);
    if (snake.length > 5) grew = true;
    assert.equal(new Set(snake.map(cell => `${cell[0]},${cell[1]}`)).size, snake.length);
    for (let j = 1; j < snake.length; j++) {
      const dx = Math.abs(snake[j][0] - snake[j - 1][0]) / 30;
      const dy = Math.abs(snake[j][1] - snake[j - 1][1]) / 20;
      assert.equal(dx + dy, 1);
    }
  }
  assert.ok(grew, 'snake should reach food and grow');
});

test('only visible selected scenes animate; reduced motion and hidden tabs stop the timer', () => {
  const sim = createSimulation();
  const [front, back, preview] = sim.faces;
  front.dataset.effect = 'snake';
  sim.change();
  assert.equal(sim.running(), false);
  sim.intersect(sim.flip, true);
  assert.equal(sim.running(), true);
  sim.tick();
  assert.equal(front.canvas.frames.length, 2);
  assert.equal(back.canvas.frames.length, 1);
  sim.setFlipped(true);
  assert.equal(sim.running(), false);
  back.dataset.effect = 'snake';
  sim.change();
  sim.tick();
  assert.equal(back.canvas.frames.length, 2);
  sim.intersect(sim.flip, false);
  assert.equal(sim.running(), false);
  preview.dataset.effect = 'snake';
  sim.intersect(preview, true);
  sim.tick();
  assert.equal(preview.canvas.frames.length, 2);
  sim.motion.matches = true;
  sim.motion.change();
  assert.equal(sim.running(), false);
  sim.motion.matches = false;
  sim.motion.change();
  assert.equal(sim.running(), true);
  sim.document.hidden = true;
  sim.document.visibilitychange();
  assert.equal(sim.running(), false);
  sim.document.hidden = false;
  sim.document.visibilitychange();
  assert.equal(sim.running(), true);
  preview.dataset.effect = 'cloud';
  sim.change();
  assert.equal(sim.running(), false);
});

test('game scenes render and advance only while active and respect reduced motion', () => {
  for (const effect of ['zombie-defense', 'platformer', 'flappy']) {
    const sim = createSimulation();
    const scene = sim.faces[0];
    scene.dataset.effect = effect;
    sim.change();
    const initial = JSON.stringify(scene.canvas.current);
    assert.notEqual(initial, '[]');
    sim.intersect(sim.flip, true);
    sim.tick();
    assert.notEqual(JSON.stringify(scene.canvas.current), initial);
    const frameCount = scene.canvas.frames.length;
    sim.motion.matches = true;
    sim.motion.change();
    assert.equal(sim.running(), false);
    assert.equal(scene.canvas.frames.length, frameCount);
    sim.motion.matches = false;
    sim.motion.change();
    sim.document.hidden = true;
    sim.document.visibilitychange();
    assert.equal(sim.running(), false);
    sim.document.hidden = false;
    sim.document.visibilitychange();
    assert.equal(sim.running(), true);
    scene.dataset.effect = 'cloud';
    sim.change();
    assert.equal(sim.running(), false);
  }
});
