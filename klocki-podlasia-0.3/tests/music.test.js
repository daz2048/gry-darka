import test from 'node:test';
import assert from 'node:assert/strict';
import { AmbientMusic } from '../music.js';

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
