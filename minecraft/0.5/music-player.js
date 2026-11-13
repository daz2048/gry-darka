import { AmbientMusic } from './music.js?v=3';

export async function loadMusicCatalogue(base = new URL('../../music/', import.meta.url), fetcher = fetch) {
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
    random = Math.random, onError = console.error, onFallback = console.error,
    base = new URL('../../music/', import.meta.url) } = {}) {
    this.tracks = tracks;
    this.ambient = ambient;
    this.audio = audio;
    this.random = random;
    this.onError = onError;
    this.onFallback = onFallback;
    this.base = base;
    this.scaryBase = new URL('scary_music/', base);
    this.scaryTracks = [];
    this.scary = false;
    this.failedScaryTracks = new Set();
    this.selection = tracks.length ? 'random' : 'original';
    this.active = false;
    this.generation = 0;
    this.current = null;
    this.failedTracks = new Set();
    this.failedOriginal = false;
    this.audio.preload = 'none';
    this.audio.volume = 0.35;
    this.audio.addEventListener('ended', () => {
      if (!this.active || (!this.scary && this.selection !== 'random')) return;
      this.current = null;
      this.playTrack();
    });
    this.audio.addEventListener('error', () => {
      if (this.audio.error && this.active && (this.scary || this.selection !== 'original')) {
        this.fail(new Error('The audio file could not be played.'), this.generation);
      }
    });
  }

  availableTracks() {
    return this.tracks.filter(track => !this.failedTracks.has(track.file));
  }

  restoreSelection(selection = 'random') {
    this.stop();
    this.current = null;
    const available = this.availableTracks();
    this.selection = selection === 'original' ||
      (selection === 'random' && available.length) ||
      available.some(track => `track:${track.file}` === selection)
      ? selection : available.length ? 'random' : 'original';
    if (this.selection !== selection) {
      this.onFallback(new Error('The saved soundtrack is unavailable.'), this.selection);
    }
  }

  setSelection(selection) {
    if (selection !== 'random' && selection !== 'original' &&
        !this.tracks.some(track => `track:${track.file}` === selection)) {
      throw new Error('Unknown music selection.');
    }
    if (selection === 'random' && !this.tracks.length) throw new Error('No music tracks available.');
    if (selection === this.selection) return;
    this.stop();
    if (selection.startsWith('track:')) this.failedTracks.delete(selection.slice(6));
    if (selection === 'original') this.failedOriginal = false;
    this.selection = selection;
    this.current = null;
  }

  setVolume(volume) {
    this.ambient.setVolume(volume);
    this.audio.volume = volume;
  }

  setScary(scary, shouldPlay = this.active) {
    if (this.scary === scary) return;
    this.stop();
    this.scary = scary;
    this.current = null;
    if (shouldPlay) this.start();
  }

  start() {
    if (this.active) return;
    this.active = true;
    const generation = ++this.generation;
    if (!this.scary && this.selection === 'original') {
      this.ambient.prepare().catch(error => this.fail(error, generation));
      this.ambient.start();
    } else {
      this.playTrack();
    }
  }

  playTrack() {
    const generation = ++this.generation;
    if (!this.current) {
      const available = this.scary
        ? this.scaryTracks.filter(track => !this.failedScaryTracks.has(track.file))
        : this.availableTracks();
      const track = this.scary || this.selection === 'random'
        ? available[Math.floor(this.random() * available.length)]
        : this.tracks.find(item => `track:${item.file}` === this.selection);
      if (!track) {
        this.fail(new Error('No playable music tracks are available.'), generation);
        return;
      }
      this.current = track.file;
      this.audio.src = new URL(encodeURIComponent(track.file), this.scary ? this.scaryBase : this.base).href;
    }
    this.audio.loop = !this.scary && this.selection !== 'random';
    this.audio.play().catch(error => this.fail(error, generation));
  }

  fail(error, generation) {
    if (!this.active || generation !== this.generation) return;
    this.stop();
    if (error.name === 'NotAllowedError') {
      this.onError(error);
      return;
    }
    if (this.scary) {
      if (this.current) this.failedScaryTracks.add(this.current);
      this.current = null;
      if (this.scaryTracks.some(track => !this.failedScaryTracks.has(track.file))) {
        this.start();
      } else {
        this.onError(error);
      }
      return;
    }
    if (this.selection === 'original') this.failedOriginal = true;
    else if (this.current) this.failedTracks.add(this.current);
    this.current = null;
    if (this.availableTracks().length) {
      this.selection = 'random';
    } else if (!this.failedOriginal) {
      this.selection = 'original';
    } else {
      this.onError(error);
      return;
    }
    this.onFallback(error, this.selection);
    this.start();
  }

  stop() {
    this.active = false;
    this.generation++;
    this.audio.pause();
    this.ambient.stop();
  }

  tick() {
    if (this.active && !this.scary && this.selection === 'original') this.ambient.tick();
  }
}
