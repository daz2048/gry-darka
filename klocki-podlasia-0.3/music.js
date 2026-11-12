const BEAT = 60 / 76;
const CHORDS = [
  { bass: 48, pad: [48, 52, 55], keys: [60, 64, 67, 71] },
  { bass: 43, pad: [47, 50, 55], keys: [59, 62, 67, 71] },
  { bass: 45, pad: [48, 52, 57], keys: [60, 64, 69, 72] },
  { bass: 41, pad: [48, 53, 57], keys: [60, 65, 69, 72] }
];

// Each phrase contains a chord and melody notes: eighth-note position, MIDI pitch, beats.
const SCORE = [
  [0, [[2, 76, 1], [4, 79, 0.75], [6, 81, 0.5], [7, 79, 0.5]]],
  [1, [[0, 74, 1.5], [3, 71, 0.5], [4, 74, 1], [6, 79, 1]]],
  [2, [[0, 76, 1], [2, 72, 0.5], [4, 69, 1.5], [7, 72, 0.5]]],
  [3, [[0, 77, 1], [2, 76, 0.5], [4, 72, 2]]],
  [0, [[1, 72, 0.5], [2, 76, 1], [4, 79, 1], [6, 83, 1]]],
  [1, [[0, 81, 1], [2, 79, 0.5], [3, 74, 0.5], [5, 71, 1]]],
  [2, [[0, 72, 0.75], [2, 76, 0.75], [4, 81, 1], [6, 79, 0.5]]],
  [3, [[0, 77, 1], [2, 76, 0.5], [3, 72, 0.5], [4, 69, 2]]],
  [2, [[2, 81, 1], [4, 84, 0.75], [6, 83, 0.5], [7, 81, 0.5]]],
  [3, [[0, 77, 1], [2, 81, 1], [4, 79, 1], [6, 77, 1]]],
  [0, [[0, 76, 1.5], [3, 79, 0.5], [4, 84, 1], [6, 83, 0.5]]],
  [1, [[0, 79, 1], [2, 74, 1], [5, 71, 1]]],
  [2, [[0, 72, 1], [2, 76, 0.5], [3, 81, 1], [5, 84, 1]]],
  [3, [[0, 81, 1], [2, 77, 1], [4, 76, 0.5], [5, 72, 1]]],
  [0, [[0, 76, 1], [2, 79, 1], [4, 76, 1], [6, 72, 1]]],
  [1, [[0, 74, 1], [2, 71, 0.5], [4, 67, 2]]],
  [0, [[2, 76, 1], [4, 79, 0.5], [5, 84, 1], [7, 83, 0.5]]],
  [1, [[0, 79, 1], [2, 74, 0.5], [3, 71, 0.5], [4, 74, 1.5]]],
  [2, [[0, 76, 1], [2, 81, 1], [4, 84, 0.5], [5, 81, 1]]],
  [3, [[0, 77, 1], [2, 81, 0.5], [4, 79, 1], [6, 76, 1]]],
  [0, [[0, 72, 1], [2, 76, 1], [4, 79, 1], [6, 76, 0.5]]],
  [1, [[0, 74, 1], [2, 79, 0.5], [3, 74, 0.5], [5, 71, 1]]],
  [3, [[0, 69, 1], [2, 72, 1], [4, 77, 1], [6, 76, 0.5]]],
  [0, [[0, 74, 0.5], [2, 72, 3]]]
];

export class AmbientMusic {
  constructor(AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext) {
    this.AudioContextClass = AudioContextClass;
    this.context = null;
    this.output = null;
    this.voices = new Set();
    this.volume = 0.35;
    this.active = false;
    this.nextNote = 0;
    this.step = 0;
  }

  async prepare() {
    if (!this.AudioContextClass) throw new Error('Web Audio jest niedostępne.');
    if (!this.context) {
      this.context = new this.AudioContextClass();
      this.output = this.context.createGain();
      this.output.gain.value = 0;
      this.output.connect(this.context.destination);
    }
    if (this.context.state !== 'running') await this.context.resume();
    if (this.context.state !== 'running') throw new Error('Przeglądarka zablokowała dźwięk.');
  }

  setVolume(volume) {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw new RangeError('Nieprawidłowa głośność muzyki.');
    this.volume = volume;
    if (this.active && this.output) {
      this.output.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
    }
  }

  start() {
    this.active = true;
    this.nextNote = 0;
    if (this.output) this.output.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.05);
  }

  stop() {
    this.active = false;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.output.gain.setTargetAtTime(0, now, 0.02);
    for (const voice of this.voices) voice.stop(now + 0.08);
    this.voices.clear();
  }

  note(midi, time, duration, level, type, attack) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + attack);
    envelope.gain.exponentialRampToValueAtTime(level * 0.5, time + duration * 0.55);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(this.output);
    oscillator.onended = () => {
      this.voices.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
    this.voices.add(oscillator);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }

  tick() {
    if (!this.active || !this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    if (!this.nextNote || this.nextNote < now - 0.25) this.nextNote = now + 0.05;
    while (this.nextNote <= now + 0.15) {
      const time = this.nextNote;
      const bar = Math.floor(this.step / 8) % SCORE.length;
      const position = this.step % 8;
      const [chordIndex, melody] = SCORE[bar];
      const chord = CHORDS[chordIndex];

      if (position === 0) {
        this.note(chord.bass, time, BEAT * 3.5, 0.055, 'sine', 0.08);
        for (const pitch of chord.pad) {
          this.note(pitch, time, BEAT * 3.9, 0.018, 'sine', 0.6);
        }
      }
      if (position % 2 === 0) {
        const pitch = chord.keys[(position / 2 + bar) % chord.keys.length];
        this.note(pitch, time, BEAT * 0.9, 0.026, 'sine', 0.025);
      }
      for (const [at, pitch, beats] of melody) {
        if (at !== position) continue;
        this.note(pitch, time, BEAT * beats, 0.075, 'triangle', 0.025);
        this.note(pitch + 12, time, BEAT * beats * 0.45, 0.012, 'sine', 0.015);
      }
      this.nextNote += BEAT / 2;
      this.step++;
    }
  }
}
