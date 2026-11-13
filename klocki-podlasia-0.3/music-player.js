import { AmbientMusic } from './music.js?v=3';

export async function loadMusicCatalogue(base = new URL('../music/', import.meta.url), fetcher = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetcher(new URL('catalogue.json', base), {
      cache: 'no-store', signal: controller.signal
    });
    if (!response.ok) throw new Error(`Music catalogue HTTP ${response.status}`);
    const tracks = await response.json();
    if (!Array.isArray(tracks) || tracks.some(track =>
      !track || typeof track.file !== 'string' || !/\.(mp3|wav|ogg|m4a)$/i.test(track.file) ||
      /[/\\]/.test(track.file) || typeof track.title !== 'string' || !track.title.trim()) ||
      new Set(tracks.map(track => track.file)).size !== tracks.length) {
      throw new Error('Invalid music catalogue.');
    }
    return tracks;
  } finally {
    clearTimeout(timeout);
  }
}

export class MusicPlayer {
  constructor(tracks, { ambient = new AmbientMusic(), audio = new Audio(),
    random = Math.random, onError = console.error,
    base = new URL('../music/', import.meta.url) } = {}) {
    this.tracks = tracks;
    this.ambient = ambient;
    this.audio = audio;
    this.random = random;
    this.onError = onError;
    this.base = base;
    this.selection = tracks.length ? 'random' : 'original';
    this.active = false;
    this.generation = 0;
    this.current = null;
    this.audio.preload = 'none';
    this.audio.volume = 0.35;
    this.audio.addEventListener('ended', () => {
      if (!this.active || this.selection !== 'random') return;
      this.current = null;
      this.playTrack();
    });
    this.audio.addEventListener('error', () => {
      if (this.active && this.selection !== 'original') {
        this.fail(new Error('The audio file could not be played.'), this.generation);
      }
    });
  }

  setSelection(selection) {
    if (selection !== 'random' && selection !== 'original' &&
        !this.tracks.some(track => `track:${track.file}` === selection)) {
      throw new Error('Unknown music selection.');
    }
    if (selection === 'random' && !this.tracks.length) throw new Error('No music tracks available.');
    if (selection === this.selection) return;
    this.stop();
    this.selection = selection;
    this.current = null;
  }

  setVolume(volume) {
    this.ambient.setVolume(volume);
    this.audio.volume = volume;
  }

  start() {
    if (this.active) return;
    this.active = true;
    const generation = ++this.generation;
    if (this.selection === 'original') {
      this.ambient.prepare().catch(error => this.fail(error, generation));
      this.ambient.start();
    } else {
      this.playTrack();
    }
  }

  playTrack() {
    const generation = this.generation;
    if (!this.current) {
      const track = this.selection === 'random'
        ? this.tracks[Math.floor(this.random() * this.tracks.length)]
        : this.tracks.find(item => `track:${item.file}` === this.selection);
      this.current = track.file;
      this.audio.src = new URL(encodeURIComponent(track.file), track.base ?? this.base).href;
    }
    this.audio.loop = this.selection !== 'random';
    this.audio.play().catch(error => this.fail(error, generation));
  }

  fail(error, generation) {
    if (!this.active || generation !== this.generation) return;
    this.stop();
    this.onError(error);
  }

  stop() {
    this.active = false;
    this.generation++;
    this.audio.pause();
    this.ambient.stop();
  }

  tick() {
    if (this.active && this.selection === 'original') this.ambient.tick();
  }
}
