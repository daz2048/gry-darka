const HARMONIES = [
  [48, 55, 60, 64, 67],
  [50, 57, 62, 65, 69],
  [45, 52, 57, 60, 64],
  [46, 53, 58, 62, 65]
];
const NOTES = [2, 4, 1, 3, 4, 2, 3, 1];
const SPACING = [1.7, 2.2, 1.8, 2.5, 1.9, 2.3, 1.7, 2.7];

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

  note(midi, time, duration, level) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + 0.12);
    envelope.gain.exponentialRampToValueAtTime(level * 0.25, time + duration * 0.55);
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
    if (now < this.nextNote) return;
    const time = now + 0.05;
    const chord = HARMONIES[Math.floor(this.step / NOTES.length) % HARMONIES.length];
    if (this.step % NOTES.length === 0) {
      this.note(chord[0], time, 6, 0.11);
      this.note(chord[1] + 12, time + 0.3, 5, 0.055);
    }
    this.note(chord[NOTES[this.step % NOTES.length]] + 12, time, 3.8, 0.12);
    this.nextNote = time + SPACING[this.step % SPACING.length];
    this.step++;
  }
}
