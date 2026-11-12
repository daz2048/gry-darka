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
  disconnect() {}
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

test('music starts only after preparation, schedules notes and stops on pause', async () => {
  const music = new AmbientMusic(AudioContext);
  music.tick();
  assert.equal(music.context, null);
  await music.prepare();
  music.tick();
  assert.equal(music.context.oscillators.length, 0);
  music.start();
  music.tick();
  assert.equal(music.context.oscillators.length, 3);
  assert.ok(music.context.oscillators.every(voice => voice.started > 0));
  music.tick();
  assert.equal(music.context.oscillators.length, 3);
  music.context.currentTime = 2;
  music.tick();
  assert.equal(music.context.oscillators.length, 4);
  music.stop();
  assert.ok(music.context.oscillators.every(voice => voice.stopped === 2.08));
  assert.equal(music.output.gain.targets.at(-1), 0);
  music.tick();
  assert.equal(music.context.oscillators.length, 4);
  music.setVolume(0.6);
  music.start();
  music.tick();
  assert.equal(music.output.gain.targets.at(-1), 0.6);
  assert.ok(music.context.oscillators.length > 4);
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
});
