import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { AmbientMusic } from '../music.js';
import { loadMusicCatalogue, MusicPlayer } from '../music-player.js';

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
  addEventListener(name, callback) { this.listeners[name] = callback; }
  play() { this.plays++; return this.nextPlay || Promise.resolve(); }
  pause() { this.pauses++; }
  emit(name) { this.listeners[name](); }
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

test('homepage combines both catalogues and plays random tracks from their own folders', async () => {
  const homepage = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
  const script = [...homepage.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)]
    .find(match => match[1].includes("const button = document.getElementById('site-music-toggle')"))[1];
  const base = new URL('https://example.test/games/index.html');
  const requested = [];
  const expectedUrls = [];
  const audio = new MediaAudio();
  let choice = 0.999;
  let player;
  const tooltip = {};
  const button = {
    disabled: true, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    querySelector() { return tooltip; },
    addEventListener(name, callback) { this[name] = callback; }
  };
  const status = {};
  const catalogueFetcher = async url => {
    requested.push(url.href);
    const file = new URL(`../../${url.pathname.slice('/games/'.length)}`, import.meta.url);
    const tracks = JSON.parse(await readFile(file, 'utf8'));
    await Promise.all(tracks.map(track => access(new URL(encodeURIComponent(track.file), file))));
    expectedUrls.push(...tracks.map(track => new URL(encodeURIComponent(track.file), url).href));
    return { ok: true, json: async () => tracks };
  };
  const context = vm.createContext({
    URL, console,
    document: { getElementById: id => id === 'site-music-toggle' ? button : status },
    musicModule: {
      loadMusicCatalogue: folder => loadMusicCatalogue(folder, catalogueFetcher),
      MusicPlayer: class extends MusicPlayer {
        constructor(tracks, options) {
          super(tracks, { ...options, audio, ambient: new AmbientMusic(AudioContext),
            random: () => choice });
          player = this;
        }
      }
    },
    pageUrl: base.href
  });
  const source = script
    .replace(/await import\('[^']+'\)/, 'musicModule')
    .replaceAll('import.meta.url', 'pageUrl');
  await vm.runInContext(`(async () => { ${source} })()`, context);
  assert.deepEqual(requested, [
    'https://example.test/games/music/catalogue.json',
    'https://example.test/games/music/scary_music/catalogue.json'
  ]);
  assert.equal(button.disabled, false);
  assert.deepEqual(Array.from(player.tracks, track =>
    new URL(encodeURIComponent(track.file), track.base).href).sort(), expectedUrls.sort());
  button.click();
  assert.equal(audio.src, new URL(encodeURIComponent(player.tracks.at(-1).file),
    'https://example.test/games/music/scary_music/').href);
  choice = 0;
  audio.emit('ended');
  assert.equal(audio.src, new URL(encodeURIComponent(player.tracks[0].file),
    'https://example.test/games/music/').href);
  button.click();
  assert.equal(player.active, false);
  assert.equal(button.attributes['aria-pressed'], 'false');
});

test('playback failures are reported once and stale rejections do not stop a resumed track', async () => {
  const audio = new MediaAudio();
  const errors = [];
  let rejectOld;
  audio.nextPlay = new Promise((resolve, reject) => { rejectOld = reject; });
  const player = new MusicPlayer([{ file: 'a.mp3', title: 'A' }], {
    audio, ambient: new AmbientMusic(AudioContext), onError: error => errors.push(error)
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
  assert.equal(player.active, false);
  assert.equal(errors.length, 1);
});
