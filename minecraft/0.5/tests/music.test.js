import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { AmbientMusic } from '../music.js';
import { loadMusicCatalogue, MusicPlayer } from '../music-player.js';
import { setText } from '../i18n.js';

class AudioParam {
  constructor() { this.value = 0; this.targets = []; }
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.targets.push(value); }
}

class AudioNode {
  connect() {}
  disconnect() { this.disconnected = true; }
}

class AudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = new AudioNode();
    this.oscillators = [];
  }
  async resume() { this.state = 'running'; }
  createGain() {
    const node = new AudioNode();
    node.gain = new AudioParam();
    return node;
  }
  createOscillator() {
    const node = new AudioNode();
    node.frequency = new AudioParam();
    node.start = time => { node.started = time; };
    node.stop = time => { node.stopped = time; };
    this.oscillators.push(node);
    return node;
  }
}

test('music plays a varied melody with layered accompaniment', async () => {
  const music = new AmbientMusic(AudioContext);
  music.tick();
  assert.equal(music.context, null);
  await music.prepare();
  music.tick();
  assert.equal(music.context.oscillators.length, 0);
  music.start();

  for (let time = 0; time < 80; time += 0.1) {
    music.context.currentTime = time;
    music.tick();
  }
  const voices = music.context.oscillators;
  const melody = voices.filter(voice => voice.type === 'triangle');
  assert.ok(melody.length > 30);
  assert.ok(new Set(melody.map(voice => voice.frequency.value)).size >= 10);
  assert.ok(voices.some(voice => voice.type === 'sine' && voice.stopped - voice.started > 2));
  assert.ok(voices.every(voice => voice.started >= 0 && voice.stopped > voice.started));
  const firstPhrase = melody.filter(voice => voice.started < 10).map(voice => voice.frequency.value);
  const laterPhrase = melody.filter(voice => voice.started >= 20 && voice.started < 30).map(voice => voice.frequency.value);
  assert.notDeepEqual(firstPhrase, laterPhrase);
  assert.ok(melody.some(voice => voice.started > 76));
});

test('music stops on pause, resumes at the selected volume, and cleans up voices', async () => {
  const music = new AmbientMusic(AudioContext);
  await music.prepare();
  music.start();
  music.tick();
  const voices = music.context.oscillators;
  assert.ok(voices.length > 0);
  const ended = voices[0];
  ended.onended();
  assert.equal(music.voices.has(ended), false);
  assert.equal(ended.disconnected, true);

  music.context.currentTime = 0.4;
  music.tick();
  music.context.currentTime = 1;
  music.stop();
  assert.ok(voices.slice(1).every(voice => voice.stopped === 1.08));
  assert.equal(music.output.gain.targets.at(-1), 0);
  assert.equal(music.voices.size, 0);
  const count = voices.length;
  music.tick();
  assert.equal(voices.length, count);
  music.setVolume(0.6);
  music.start();
  music.tick();
  assert.equal(music.output.gain.targets.at(-1), 0.6);
  assert.ok(voices.length > count);
  music.setVolume(0);
  assert.equal(music.output.gain.targets.at(-1), 0);
});

test('a delayed frame does not schedule a backlog of past notes', async () => {
  const music = new AmbientMusic(AudioContext);
  await music.prepare();
  music.start();
  music.tick();
  music.context.currentTime = 0.4;
  music.tick();
  const count = music.context.oscillators.length;
  music.context.currentTime = 100;
  music.tick();
  const newVoices = music.context.oscillators.slice(count);
  assert.ok(newVoices.length > 0);
  assert.ok(newVoices.length <= 6);
  assert.ok(newVoices.every(voice => voice.started >= 100));
});

test('audio failures propagate without pretending that music started', async () => {
  class DeniedAudioContext extends AudioContext {
    async resume() { throw new Error('denied'); }
  }
  const music = new AmbientMusic(DeniedAudioContext);
  await assert.rejects(music.prepare(), /denied/);
  music.start();
  music.tick();
  assert.equal(music.context.oscillators.length, 0);
  assert.throws(() => music.setVolume(NaN), RangeError);
  assert.throws(() => music.setVolume(1.1), RangeError);
  const unavailable = new AmbientMusic(null);
  await assert.rejects(unavailable.prepare(), /Web Audio/);
});

class MediaAudio {
  constructor() { this.listeners = {}; this.plays = 0; this.pauses = 0; this.src = ''; }
  set src(value) { this.source = value; this.error = null; }
  get src() { return this.source; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  play() { this.plays++; return this.nextPlay || Promise.resolve(); }
  pause() { this.pauses++; }
  emit(name) {
    if (name === 'error') this.error = new Error('Media error');
    this.listeners[name]();
  }
}

test('catalogue loads without caching and rejects invalid or unavailable data', async () => {
  const base = new URL('https://example.test/games/music/');
  const tracks = ['mp3', 'WAV', 'ogg', 'm4a'].map(extension => ({
    file: `a #1.${extension}`, title: extension
  }));
  const result = await loadMusicCatalogue(base, async (url, options) => {
    assert.equal(url.href, 'https://example.test/games/music/catalogue.json');
    assert.equal(options.cache, 'no-store');
    return { ok: true, json: async () => tracks };
  });
  assert.deepEqual(result, tracks);
  for (const data of [[{ file: '../a.wav', title: 'A' }], [{ file: 'a.flac', title: 'A' }], [...tracks, ...tracks], {}]) {
    await assert.rejects(loadMusicCatalogue(base, async () => ({ ok: true, json: async () => data })), /Invalid/);
  }
  await assert.rejects(loadMusicCatalogue(base, async () => ({ ok: false, status: 404 })), /404/);
});

test('random tracks advance, pause resumes, and individual and original choices are isolated', async () => {
  const audio = new MediaAudio();
  const ambient = new AmbientMusic(AudioContext);
  const tracks = [{ file: 'first.mp3', title: 'First' }, { file: 'a #1.ogg', title: 'Second' }];
  let choice = 0;
  const player = new MusicPlayer(tracks, {
    audio, ambient, random: () => choice, base: new URL('https://example.test/games/music/')
  });
  player.start();
  assert.match(audio.src, /first\.mp3$/);
  player.setVolume(0.6);
  assert.equal(audio.volume, 0.6);
  player.stop();
  player.start();
  assert.match(audio.src, /first\.mp3$/);
  choice = 0.9;
  audio.emit('ended');
  assert.equal(audio.src, 'https://example.test/games/music/a%20%231.ogg');
  player.setSelection('track:first.mp3');
  assert.equal(player.active, false);
  player.start();
  assert.equal(audio.loop, true);
  assert.match(audio.src, /first\.mp3$/);
  player.setSelection('original');
  player.start();
  await Promise.resolve();
  assert.equal(ambient.active, true);
  assert.ok(audio.pauses >= 3);
  player.stop();
  assert.equal(ambient.active, false);
});

test('music chooser includes scary tracks with distinct saved choices and correct playback URLs', async () => {
  const game = await readFile(new URL('../game.js', import.meta.url), 'utf8');
  const source = game.match(/async function initializeMusic\(\) \{[\s\S]*?\n\}/)[0];
  const audio = new MediaAudio();
  let choice = 0.99;
  const music = new MusicPlayer([], {
    audio, ambient: new AmbientMusic(AudioContext), random: () => choice,
    base: new URL('https://example.test/games/music/')
  });
  const select = {
    options: [{ value: 'random' }, { value: 'original' }],
    append(option) { this.options.push(option); }
  };
  const status = {};
  const ui = { 'music-choice': select, 'music-status': status, 'music-on': { checked: true } };
  const context = vm.createContext({
    music, ui, setText, console,
    document: { createElement: () => ({ dataset: {} }) },
    loadMusicCatalogue: (base = music.base) => loadMusicCatalogue(base, async () => ({
      ok: true, json: async () => [{ file: 'same #1.mp3', title: 'Same song' }]
    }))
  });
  await vm.runInContext(`${source}; initializeMusic()`, context);
  assert.deepEqual(select.options.map(option => option.value),
    ['random', 'original', 'track:same #1.mp3', 'track:scary_music/same #1.mp3']);
  assert.equal(select.options[3].dataset.i18n, 'music.scaryTrack');
  assert.equal(JSON.parse(select.options[3].dataset.i18nParams).title, 'Same song');
  assert.equal(select.disabled, false);
  assert.equal(status.hidden, true);
  music.start();
  assert.equal(audio.src, 'https://example.test/games/music/same%20%231.mp3');
  assert.equal(audio.loop, false);
  choice = 0;
  audio.emit('ended');
  assert.equal(audio.src, 'https://example.test/games/music/same%20%231.mp3');
  const savedChoice = select.options[3].value;
  music.restoreSelection(savedChoice);
  music.start();
  assert.equal(audio.src, 'https://example.test/games/music/scary_music/same%20%231.mp3');
  assert.equal(audio.loop, true);
  music.setScary(true);
  assert.equal(music.selection, savedChoice);
  assert.equal(audio.loop, false);
  music.setScary(false);
  assert.equal(music.selection, savedChoice);
  assert.equal(audio.src, 'https://example.test/games/music/scary_music/same%20%231.mp3');
  assert.equal(audio.loop, true);
  music.stop();
});

test('a missing catalogue keeps available music selectable and reports the failure', async t => {
  const game = await readFile(new URL('../game.js', import.meta.url), 'utf8');
  const source = game.match(/async function initializeMusic\(\) \{[\s\S]*?\n\}/)[0];
  for (const missing of ['normal', 'scary', 'both']) {
    await t.test(missing, async () => {
      const errors = [];
      const music = new MusicPlayer([], {
        audio: new MediaAudio(), ambient: new AmbientMusic(AudioContext),
        base: new URL('https://example.test/music/')
      });
      const select = {
        options: [{ value: 'random' }, { value: 'original' }],
        append(option) { this.options.push(option); }
      };
      const status = {};
      const context = vm.createContext({
        music, setText, ui: {
          'music-choice': select, 'music-status': status, 'music-on': { checked: false }
        },
        console: { error: (...args) => errors.push(args) },
        document: { createElement: () => ({ dataset: {} }) },
        loadMusicCatalogue: (base = music.base) => loadMusicCatalogue(base, async url => ({
          ok: missing !== 'both' && missing !== (url.href.includes('scary_music/') ? 'scary' : 'normal'),
          status: 404, json: async () => [{ file: 'a.mp3', title: 'A' }]
        }))
      });
      status.dataset = {};
      await vm.runInContext(`${source}; initializeMusic()`, context);
      assert.equal(errors.length, missing === 'both' ? 2 : 1);
      assert.equal(status.dataset.i18n, missing === 'both' ? 'music.catalogueFailed' : 'music.cataloguePartial');
      assert.equal(music.selection, missing === 'scary' ? 'random' : 'original');
      assert.equal(select.options[0].disabled, missing !== 'scary');
      assert.equal(select.options.length, missing === 'both' ? 2 : 3);
      assert.equal(select.disabled, true);
    });
  }
});

test('random exhaustion never falls back to scary tracks, which remain manually selectable', async () => {
  const audio = new MediaAudio();
  const fallbacks = [];
  const player = new MusicPlayer([
    { file: 'normal.mp3', title: 'Normal' },
    { file: 'scary_music/scary.mp3', title: 'Scary' }
  ], {
    audio, ambient: new AmbientMusic(AudioContext), random: () => 0.99,
    onFallback: (error, selection) => fallbacks.push(selection)
  });
  player.start();
  assert.match(audio.src, /\/music\/normal\.mp3$/);
  audio.emit('error');
  await Promise.resolve();
  assert.equal(player.selection, 'original');
  assert.deepEqual(fallbacks, ['original']);
  assert.throws(() => player.setSelection('random'), /No music tracks/);
  player.restoreSelection('track:scary_music/scary.mp3');
  player.start();
  assert.match(audio.src, /\/scary_music\/scary\.mp3$/);
  assert.equal(audio.loop, true);
  player.restoreSelection('track:removed.mp3');
  assert.equal(player.selection, 'original');
  player.stop();
});

test('scary mode immediately overrides and later restores the selected soundtrack', async () => {
  const audio = new MediaAudio();
  const ambient = new AmbientMusic(AudioContext);
  let choice = 0;
  const player = new MusicPlayer([{ file: 'normal.mp3', title: 'Normal' }], {
    audio, ambient, random: () => choice, base: new URL('https://example.test/music/')
  });
  player.scaryTracks = [{ file: 'first.mp3' }, { file: 'second #1.ogg' }];
  player.setSelection('original');
  player.start();
  await Promise.resolve();
  assert.equal(ambient.active, true);
  player.setScary(true);
  assert.equal(ambient.active, false);
  assert.equal(player.selection, 'original');
  assert.equal(audio.src, 'https://example.test/music/scary_music/first.mp3');
  assert.equal(audio.loop, false);
  choice = 0.9;
  audio.emit('ended');
  assert.equal(audio.src, 'https://example.test/music/scary_music/second%20%231.ogg');
  player.stop();
  player.start();
  assert.match(audio.src, /second%20%231\.ogg$/);
  player.setScary(false);
  await Promise.resolve();
  assert.equal(ambient.active, true);
  assert.equal(player.selection, 'original');
  player.stop();
  const plays = audio.plays;
  player.setScary(true);
  assert.equal(audio.plays, plays);
  player.start();
  assert.match(audio.src, /scary_music\/second%20%231\.ogg$/);
  player.setSelection('track:normal.mp3');
  player.start();
  assert.match(audio.src, /scary_music\//);
  player.setScary(false);
  assert.match(audio.src, /music\/normal\.mp3$/);
  assert.equal(audio.loop, true);
});

test('scary playback retries only scary tracks and reports exhaustion without changing the selection', () => {
  const audio = new MediaAudio();
  const errors = [];
  const player = new MusicPlayer([{ file: 'normal.mp3' }], {
    audio, ambient: new AmbientMusic(AudioContext), random: () => 0,
    onError: error => errors.push(error),
    onFallback: () => assert.fail('Scary failures must not change the normal soundtrack')
  });
  player.scaryTracks = [{ file: 'broken.mp3' }, { file: 'other.mp3' }];
  player.setScary(true);
  player.start();
  audio.emit('error');
  assert.match(audio.src, /scary_music\/other\.mp3$/);
  audio.emit('error');
  assert.equal(player.active, false);
  assert.equal(player.selection, 'random');
  assert.equal(errors.length, 1);
  player.setScary(false, true);
  assert.equal(player.active, true);
  assert.match(audio.src, /music\/normal\.mp3$/);
});

test('playback failures are reported once and stale rejections do not stop a resumed track', async () => {
  const audio = new MediaAudio();
  const errors = [];
  const fallbacks = [];
  let rejectOld;
  audio.nextPlay = new Promise((resolve, reject) => { rejectOld = reject; });
  const player = new MusicPlayer([{ file: 'a.mp3', title: 'A' }], {
    audio, ambient: new AmbientMusic(AudioContext), onError: error => errors.push(error),
    onFallback: (error, selection) => fallbacks.push(selection)
  });
  player.start();
  player.stop();
  audio.nextPlay = Promise.resolve();
  player.start();
  rejectOld(new Error('interrupted'));
  await Promise.resolve();
  assert.equal(player.active, true);
  assert.equal(errors.length, 0);
  audio.emit('error');
  audio.emit('error');
  assert.equal(player.active, true);
  assert.equal(player.selection, 'original');
  assert.deepEqual(fallbacks, ['original']);
  assert.equal(errors.length, 0);
});

test('world soundtrack choices restore independently, with Random for old or missing choices', () => {
  const audio = new MediaAudio();
  const fallbacks = [];
  const player = new MusicPlayer([
    { file: 'a.mp3', title: 'A' }, { file: 'b.ogg', title: 'B' }
  ], {
    audio, ambient: new AmbientMusic(AudioContext),
    onFallback: (error, selection) => fallbacks.push(selection)
  });
  player.restoreSelection('track:a.mp3');
  player.start();
  assert.match(audio.src, /a\.mp3$/);
  player.restoreSelection('track:b.ogg');
  assert.equal(player.active, false);
  player.start();
  assert.match(audio.src, /b\.ogg$/);
  player.restoreSelection('track:a.mp3');
  assert.equal(player.selection, 'track:a.mp3');
  player.restoreSelection('original');
  assert.equal(player.selection, 'original');
  player.restoreSelection();
  assert.equal(player.selection, 'random');
  assert.deepEqual(fallbacks, []);
  for (const selection of ['track:removed.mp3', '', null, {}, 42]) {
    player.restoreSelection(selection);
    assert.equal(player.selection, 'random');
  }
  assert.equal(fallbacks.length, 5);
  player.tracks = [];
  player.restoreSelection('track:a.mp3');
  assert.equal(player.selection, 'original');
  assert.equal(fallbacks.at(-1), 'original');
});

test('a failed assigned track falls back to random and is not retried by random mode', async () => {
  const audio = new MediaAudio();
  const fallbacks = [];
  let rejectOld;
  audio.nextPlay = new Promise((resolve, reject) => { rejectOld = reject; });
  const player = new MusicPlayer([
    { file: 'broken.mp3', title: 'Broken' }, { file: 'working.mp3', title: 'Working' }
  ], {
    audio, ambient: new AmbientMusic(AudioContext), random: () => 0,
    onFallback: (error, selection) => fallbacks.push(selection)
  });
  player.restoreSelection('track:broken.mp3');
  player.start();
  audio.nextPlay = Promise.resolve();
  audio.emit('error');
  assert.equal(player.selection, 'random');
  assert.equal(player.active, true);
  assert.match(audio.src, /working\.mp3$/);
  assert.equal(audio.loop, false);
  rejectOld(new Error('Old play rejection after media error'));
  await Promise.resolve();
  assert.deepEqual(fallbacks, ['random']);
  audio.emit('ended');
  assert.match(audio.src, /working\.mp3$/);
  player.restoreSelection('track:broken.mp3');
  assert.equal(player.selection, 'random');
  player.setSelection('track:broken.mp3');
  player.start();
  assert.match(audio.src, /broken\.mp3$/);
});

test('failed tracks and original music are tried only once before reporting a terminal error', async () => {
  const audio = new MediaAudio();
  audio.play = function () {
    this.plays++;
    return Promise.reject(new Error('Unsupported codec'));
  };
  class UnavailableAudioContext extends AudioContext {
    async resume() { throw new Error('Audio unavailable'); }
  }
  const errors = [];
  const fallbacks = [];
  const player = new MusicPlayer([
    { file: 'a.mp3', title: 'A' }, { file: 'b.mp3', title: 'B' }
  ], {
    audio, ambient: new AmbientMusic(UnavailableAudioContext), random: () => 0,
    onFallback: (error, selection) => fallbacks.push(selection),
    onError: error => errors.push(error)
  });
  player.setSelection('track:a.mp3');
  player.start();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(audio.plays, 2);
  assert.deepEqual(fallbacks, ['random', 'original']);
  assert.equal(player.active, false);
  assert.equal(errors.length, 1);
});

test('browser playback denial reports an error without cycling through every track', async () => {
  const audio = new MediaAudio();
  audio.nextPlay = Promise.reject(Object.assign(new Error('Playback blocked'), { name: 'NotAllowedError' }));
  const errors = [];
  const player = new MusicPlayer([
    { file: 'a.mp3', title: 'A' }, { file: 'b.mp3', title: 'B' }
  ], {
    audio, ambient: new AmbientMusic(AudioContext),
    onError: error => errors.push(error),
    onFallback: () => assert.fail('Autoplay denial is not a broken track')
  });
  player.start();
  await Promise.resolve();
  assert.equal(player.active, false);
  assert.equal(audio.plays, 1);
  assert.equal(errors.length, 1);
  assert.equal(player.failedTracks.size, 0);
});
