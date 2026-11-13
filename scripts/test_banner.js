const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const galleryScript = fs.readFileSync(path.join(__dirname, '..', 'banner-gallery.js'), 'utf8');
const yearRound = ['cloud', 'data', 'stars', 'scan', 'pixel-rain', 'shooting-stars', 'circuits', 'aurora',
  'pink', 'orange', 'otter-rocket', 'block-landscape', 'castle-arrows', 'arcade'];
const seasonal = {
  0: ['snow', 'frost'],
  1: ['snow', 'frost'],
  2: ['blossoms', 'summer-sun'],
  3: ['easter-eggs', 'blossoms'],
  4: ['blossoms', 'summer-sun'],
  5: ['summer-sun', 'summer-waves'],
  6: ['summer-sun', 'summer-waves'],
  7: ['summer-sun', 'summer-waves'],
  8: ['autumn-leaves', 'autumn-woodland'],
  9: ['pumpkins', 'spooky-stars'],
  10: ['snow', 'frost'],
  11: ['festive-lights', 'presents'],
};
const highImpact = ['fireworks', 'nebula-burst', 'campfire', 'bubble-surge', 'strobe-lights',
  'snake', 'zombie-defense', 'platformer', 'flappy'];
const highImpactSeasonal = {
  1: ['frost-hearts', 'winter-night'],
  2: ['spring-storm', 'meadow-burst'],
  4: ['spring-storm', 'meadow-burst'],
};

function createBanner(date, randomValues, savedSelection = null, storageBlocked = false, reduceMotion = true) {
  const faces = [0, 1].map(() => ({
    dataset: {},
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
  }));
  let flipped = false;
  let onClick;
  const animations = [];
  const inner = {
    animate(keyframes, options) {
      const animation = { keyframes, options, cancelled: false, cancel() { this.cancelled = true; } };
      animations.push(animation);
      return animation;
    },
  };
  const motion = {
    matches: reduceMotion,
    addEventListener(event, callback) { this.onChange = callback; },
    setReduced(matches) { this.matches = matches; this.onChange({ matches }); },
  };
  const button = {
    classList: {
      contains() { return flipped; },
      toggle() { flipped = !flipped; return flipped; },
    },
    querySelector() { return inner; },
    querySelectorAll() { return faces; },
    addEventListener(event, callback) { onClick = callback; },
  };
  const clock = { date };
  const random = { values: randomValues.slice() };
  const math = Object.create(Math);
  const status = { textContent: '', hidden: true };
  math.random = () => {
    assert.ok(random.values.length, 'Unexpected random draw');
    return random.values.shift();
  };
  vm.runInNewContext(script, {
    document: { querySelector: () => button, getElementById: () => status },
    localStorage: { getItem: () => {
      if (storageBlocked) throw new Error('Storage blocked');
      return savedSelection;
    } },
    Date: class { getMonth() { return clock.date.getMonth(); } },
    matchMedia: () => motion,
    Math: math,
  });
  return { button, faces, clock, random, status, animations, motion, click: () => onClick() };
}

test('flip animations choose different directions and zoom while preserving both face orientations', () => {
  for (const [variant, direction] of [[0, 1], [1, -1], [2, 1]]) {
    const banner = createBanner(new Date(2026, 1, 1), [], JSON.stringify(['cloud']), false, false);
    for (const currentFace of [0, 1]) {
      banner.random.values.push((variant + .5) / 3);
      banner.click();
      const { keyframes, options } = banner.animations[currentFace];
      assert.equal(keyframes[0].transform, `rotateY(${currentFace * 180}deg) scale(1)`);
      assert.equal(keyframes.at(-1).transform, `rotateY(${currentFace * 180 + direction * 180}deg) scale(1)`);
      assert.equal(keyframes.length, variant === 2 ? 3 : 2);
      if (variant === 2) assert.match(keyframes[1].transform, /scale\(\.85\)/);
      assert.equal(options.duration, 600);
      assert.equal(banner.faces[currentFace].attributes['aria-hidden'], 'true');
      assert.equal(banner.faces[1 - currentFace].attributes['aria-hidden'], 'false');
    }
    assert.equal(banner.animations[0].cancelled, true);
  }
});

test('reduced motion skips animations and cancels an active flip when enabled', () => {
  const banner = createBanner(new Date(2026, 1, 1), [], JSON.stringify(['cloud']), false, false);
  banner.random.values.push(0);
  banner.click();
  banner.motion.setReduced(true);
  assert.equal(banner.animations[0].cancelled, true);
  banner.click();
  assert.equal(banner.animations.length, 1);
  assert.equal(banner.faces[0].attributes['aria-hidden'], 'false');
  assert.equal(banner.faces[1].attributes['aria-hidden'], 'true');
});

test('seasonal pools apply for the entire local month and are equally weighted', () => {
  for (let month = 0; month < 12; month++) {
    for (const day of [1, new Date(2026, month + 1, 0).getDate()]) {
      const date = new Date(2026, month, day, 12);
      if (seasonal[month]) {
        const themed = createBanner(date, [.499999, 0]);
        const regular = createBanner(date, [.5, 0]);
        assert.ok(seasonal[month].includes(themed.faces[0].dataset.effect));
        assert.ok(yearRound.includes(regular.faces[0].dataset.effect));
      } else {
        const banner = createBanner(date, [0]);
        assert.ok(yearRound.includes(banner.faces[0].dataset.effect));
      }
    }
  }
});

test('existing effects are selectable and flipping never repeats the current effect', () => {
  const march = new Date(2026, 2, 1);
  for (let i = 0; i < yearRound.length; i++) {
    const banner = createBanner(march, [.5, (i + .5) / yearRound.length]);
    assert.equal(banner.faces[0].dataset.effect, yearRound[i]);
    banner.random.values.push(.5, .5, 0);
    banner.click();
    assert.notEqual(banner.faces[1].dataset.effect, banner.faces[0].dataset.effect);
    assert.equal(banner.faces[0].attributes['aria-hidden'], 'true');
    assert.equal(banner.faces[1].attributes['aria-hidden'], 'false');
    banner.random.values.push(.5, .5, 0);
    banner.click();
    assert.notEqual(banner.faces[0].dataset.effect, banner.faces[1].dataset.effect);
  }
  for (const [month, effects] of Object.entries(seasonal)) {
    for (let i = 0; i < effects.length; i++) {
      const banner = createBanner(new Date(2026, Number(month), 1), [0, (i + .5) / effects.length]);
      assert.equal(banner.faces[0].dataset.effect, effects[i]);
      if (highImpactSeasonal[month]) banner.random.values.push(0, .5, 0);
      else banner.random.values.push(0, 0);
      banner.click();
      assert.equal(banner.faces[1].dataset.effect, effects[1 - i]);
    }
  }
});

test('high-impact effects only appear after flipping with a 25% chance within their pool', () => {
  for (const [month, effects] of Object.entries(highImpactSeasonal)) {
    for (let i = 0; i < effects.length; i++) {
      const banner = createBanner(new Date(2026, Number(month), 1), [0, 0]);
      assert.ok(seasonal[month].includes(banner.faces[0].dataset.effect));
      banner.random.values.push(0, .249999, (i + .5) / effects.length);
      banner.click();
      assert.equal(banner.faces[1].dataset.effect, effects[i]);
      banner.random.values.push(0, 0, 0);
      banner.click();
      assert.equal(banner.faces[0].dataset.effect, effects[1 - i]);
      banner.random.values.push(0, .25, 0);
      banner.click();
      assert.ok(seasonal[month].includes(banner.faces[1].dataset.effect));
    }
  }
  for (let i = 0; i < highImpact.length; i++) {
    const banner = createBanner(new Date(2026, 1, 1), [.5, 0]);
    banner.random.values.push(.5, .249999, (i + .5) / highImpact.length);
    banner.click();
    assert.equal(banner.faces[1].dataset.effect, highImpact[i]);
    banner.random.values.push(.5, 0, (i + .5) / (highImpact.length - 1));
    banner.click();
    assert.notEqual(banner.faces[0].dataset.effect, banner.faces[1].dataset.effect);
  }
});

test('the seasonal pool changes at the next flip when the local month changes', () => {
  const banner = createBanner(new Date(2026, 10, 30, 23, 59), [0, 0]);
  assert.equal(banner.faces[0].dataset.effect, 'snow');
  banner.clock.date = new Date(2026, 11, 1);
  banner.random.values.push(0, 0);
  banner.click();
  assert.equal(banner.faces[1].dataset.effect, 'festive-lights');
});

test('one saved style is displayed on load and every flip without random theme selection', () => {
  for (const effect of ['spring-storm', 'snake', 'zombie-defense', 'platformer', 'flappy']) {
    const single = createBanner(new Date(2026, 10, 1), [], JSON.stringify([effect]));
    assert.equal(single.faces[0].dataset.effect, effect);
    single.click();
    single.click();
    assert.equal(single.faces[0].dataset.effect, effect);
    assert.equal(single.faces[1].dataset.effect, effect);
  }
});

test('multiple saved styles apply on flips', () => {
  const multiple = createBanner(new Date(2026, 10, 1), [.5, 0], JSON.stringify(['cloud', 'fireworks']));
  multiple.random.values.push(0, 0);
  multiple.click();
  assert.equal(multiple.faces[1].dataset.effect, 'fireworks');
  multiple.click();
  assert.equal(multiple.faces[0].dataset.effect, 'cloud');
});

test('invalid saved selections are reported and default behavior remains available', () => {
  const banner = createBanner(new Date(2026, 10, 1), [.5, 0], '[]');
  banner.random.values.push(.5, .5, 0);
  banner.click();
  assert.match(banner.status.textContent, /invalid/);
  assert.equal(banner.status.hidden, false);
  assert.ok(yearRound.includes(banner.faces[1].dataset.effect));
});

test('blocked storage is reported without disabling the banner', () => {
  const banner = createBanner(new Date(2026, 10, 1), [.5, 0], null, true);
  banner.random.values.push(.5, .5, 0);
  banner.click();
  assert.match(banner.status.textContent, /could not be read/);
  assert.ok(yearRound.includes(banner.faces[1].dataset.effect));
});

function createGallery(storage) {
  function element() {
    return {
      children: [], events: {}, dataset: {}, hidden: true, textContent: '',
      append(...children) { this.children.push(...children); },
      addEventListener(name, callback) { this.events[name] = callback; },
      setAttribute() {},
      fire(name) { this.events[name](); },
      querySelectorAll() {
        return this.children.flatMap(child => [
          ...(child.type === 'checkbox' ? [child] : []),
          ...(child.querySelectorAll ? child.querySelectorAll() : []),
        ]);
      },
    };
  }
  const elements = new Map();
  const get = key => {
    if (!elements.has(key)) elements.set(key, element());
    return elements.get(key);
  };
  const document = {
    getElementById: get,
    querySelector: get,
    createElement: element,
    createTextNode: text => ({ textContent: text }),
  };
  const faces = [element(), element()];
  const flip = { classList: { contains: () => false } };
  vm.runInNewContext(galleryScript, {
    document, location: { hash: '#banner-gallery' },
    brandEffects: yearRound, highImpactBrandEffects: highImpact,
    brandFaces: faces, brandFlip: flip,
    bannerStorageKey: 'gry_banner_styles',
    localStorage: storage,
    readBannerSelection: () => storage.value ? JSON.parse(storage.value) : null,
    reportBannerStorageError(message) { get('banner-storage-status').hidden = !message; },
  });
  const checkboxes = get('banner-gallery-groups').querySelectorAll();
  return {
    get,
    faces,
    checkbox: value => checkboxes.find(checkbox => checkbox.value === value),
  };
}

function galleryStorage(value = null) {
  return {
    value, blocked: false,
    setItem(key, value) {
      if (this.blocked) throw new Error('Storage blocked');
      this.value = value;
    },
    removeItem() {
      if (this.blocked) throw new Error('Storage blocked');
      this.value = null;
    },
  };
}

test('gallery changes save automatically and survive reopening', () => {
  const storage = galleryStorage();
  const gallery = createGallery(storage);
  gallery.get('banner-clear').fire('click');
  assert.equal(storage.value, null);
  assert.match(gallery.get('banner-gallery-status').textContent, /remain active/);
  gallery.checkbox('pink').checked = true;
  gallery.checkbox('pink').fire('change');
  assert.deepEqual(JSON.parse(storage.value), ['pink']);
  assert.equal(gallery.faces[0].dataset.effect, 'pink');
  const reopened = createGallery(storage);
  assert.equal(reopened.checkbox('pink').checked, true);
  assert.equal(reopened.checkbox('orange').checked, false);
  reopened.checkbox('orange').checked = true;
  reopened.checkbox('orange').fire('change');
  assert.deepEqual(JSON.parse(storage.value), ['pink', 'orange']);
});

test('snake is selectable without changing an existing saved selection', () => {
  const storage = galleryStorage(JSON.stringify(['pink']));
  const gallery = createGallery(storage);
  const groups = gallery.get('banner-gallery-groups').children;
  assert.equal(groups[0].textContent, 'Games');
  assert.deepEqual(groups[1].querySelectorAll().map(checkbox => checkbox.value),
    ['snake', 'zombie-defense', 'platformer', 'flappy']);
  assert.equal(groups[2].textContent, 'Year-round');
  assert.equal(gallery.get('banner-gallery-groups').querySelectorAll()
    .filter(checkbox => checkbox.value === 'snake').length, 1);
  for (const effect of ['zombie-defense', 'platformer', 'flappy']) {
    assert.equal(gallery.get('banner-gallery-groups').querySelectorAll()
      .filter(checkbox => checkbox.value === effect).length, 1);
  }
  assert.equal(gallery.checkbox('pink').checked, true);
  assert.equal(gallery.checkbox('snake').checked, false);
  gallery.checkbox('snake').checked = true;
  gallery.checkbox('snake').fire('change');
  assert.deepEqual(JSON.parse(storage.value), ['snake', 'pink']);
  const reopened = createGallery(storage);
  assert.equal(reopened.checkbox('snake').checked, true);
});

test('empty selections keep the previous save; select all saves and reset restores defaults', () => {
  const storage = galleryStorage(JSON.stringify(['pink']));
  const gallery = createGallery(storage);
  gallery.checkbox('pink').checked = false;
  gallery.checkbox('pink').fire('change');
  assert.deepEqual(JSON.parse(storage.value), ['pink']);
  assert.match(gallery.get('banner-gallery-status').textContent, /remain active/);
  gallery.get('banner-select-all').fire('click');
  assert.ok(JSON.parse(storage.value).includes('orange'));
  assert.ok(JSON.parse(storage.value).includes('snow'));
  gallery.get('banner-reset').fire('click');
  assert.equal(storage.value, null);
  assert.match(gallery.get('banner-gallery-status').textContent, /defaults|default/i);
});

test('gallery reports failed automatic saves and retains the previous selection', () => {
  const storage = galleryStorage(JSON.stringify(['pink']));
  const gallery = createGallery(storage);
  storage.blocked = true;
  gallery.checkbox('orange').checked = true;
  gallery.checkbox('orange').fire('change');
  assert.deepEqual(JSON.parse(storage.value), ['pink']);
  assert.match(gallery.get('banner-gallery-status').textContent, /Could not save/);
  gallery.get('banner-select-all').fire('click');
  assert.match(gallery.get('banner-gallery-status').textContent, /Could not save/);
  storage.blocked = false;
  gallery.checkbox('orange').checked = false;
  gallery.checkbox('orange').fire('change');
  assert.match(gallery.get('banner-gallery-status').textContent, /Saved/);
});
