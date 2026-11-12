export const TEXTURE_SIZE = 32;
export const ATLAS_COLUMNS = 8;
export const ATLAS_ROWS = 4;

export function blockTexture(id, normal) {
  if (id === 1) return normal[1] > 0 ? 1 : normal[1] < 0 ? 2 : 30;
  if (id === 4 && normal[1] !== 0) return 31;
  return id;
}

function hash(x, y, seed) {
  let value = Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263) + Math.imul(seed + 1, 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function rgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

function mix(a, b, amount) {
  return a.map((channel, index) => channel * (1 - amount) + b[index] * amount);
}

function pixel(id, x, y, blocks) {
  const noise = hash(x, y, id);
  const coarse = hash(Math.floor(x / 4), Math.floor(y / 4), id);
  let base = rgb(blocks[id <= 29 ? id : id === 30 ? 2 : 4].color);
  let light = (noise - 0.5) * 14 + (coarse - 0.5) * 12;

  if (id === 1 || id === 5 || id === 18) {
    const leaf = hash(Math.floor(x / 3), Math.floor(y / 3), id);
    light += (leaf - 0.5) * (id === 5 ? 46 : 26);
    if (id === 5 && (x + y * 3) % 13 < 2) light -= 15;
    if (id === 18 && noise > 0.92) light += 15;
  } else if (id === 30) {
    const edge = 7 + Math.floor(hash(Math.floor(x / 3), 0, id) * 4);
    if (y < edge) {
      base = rgb(blocks[1].color);
      light += (coarse - 0.5) * 22;
    } else if (y === edge || (y < edge + 4 && hash(x, 0, id) > 0.82)) {
      base = rgb('#668b48');
    }
  } else if (id === 4) {
    const stripe = hash(Math.floor(x / 3), 0, id);
    light += (stripe - 0.5) * 48 + (x % 8 === 0 ? -25 : 0);
    if (hash(Math.floor(x / 3), Math.floor(y / 8), id) > 0.86) light -= 14;
  } else if (id === 31) {
    base = rgb('#c49a68');
    const distance = Math.max(Math.abs(x - 15.5), Math.abs(y - 15.5));
    light += distance > 13 ? -48 : Math.floor(distance / 3) % 2 ? -14 : 9;
    if (Math.abs(x - 16) < 2 && Math.abs(y - 16) < 2) light -= 18;
  } else if ([7, 16, 17].includes(id)) {
    const row = Math.floor(y / 8);
    const seam = y % 8 === 0;
    const joint = (x + (row % 2) * 16) % 32 === 0;
    light += (hash(row, 0, id) - 0.5) * 18 + (hash(x, row, id) - 0.5) * 18;
    if (seam || joint) light -= 37;
    else if (y % 8 === 1) light += 12;
  } else if ([8, 9, 10, 11].includes(id)) {
    const height = id === 8 ? 8 : id === 11 ? 10 : 8;
    const row = Math.floor(y / height);
    const offset = row % 2 ? 8 : 0;
    const width = id === 11 ? 11 : 16;
    const seam = y % height === 0 || (x + offset) % width === 0;
    light += (hash(Math.floor((x + offset) / width), row, id) - 0.5) * 32;
    if (seam) base = mix(base, rgb(id === 8 ? '#683b32' : '#c8b7a3'), id === 8 ? 0.55 : 0.7);
    else if (y % height === 1) light += 12;
  } else if (id >= 25 && id <= 29) {
    base = rgb(blocks[3].color);
    light += (coarse - 0.5) * 24;
    const vein = hash(Math.floor(x / 5), Math.floor(y / 5), id);
    const detail = hash(Math.floor((x + 2) / 3), Math.floor((y + 2) / 3), id);
    if (vein > 0.6 && detail > 0.25) {
      base = rgb(blocks[id].color);
      light += 12;
    }
  } else if (id === 12) {
    const vein = Math.abs((x + Math.floor(y * 0.55) + Math.floor(hash(0, Math.floor(y / 4), id) * 4)) % 19 - 9);
    if (vein < 2) base = mix(base, rgb('#a9a9a4'), vein === 0 ? 0.5 : 0.25);
  } else if (id === 13 || id === 3 || id === 6 || id === 2 || id === 15 || id === 19) {
    const strength = id === 13 ? 28 : id === 15 || id === 19 ? 8 : 18;
    light += (coarse - 0.5) * strength;
    if (id === 13 && noise > 0.87) light += 28;
    if (id === 3 && noise > 0.93) light -= 22;
  } else if (id === 14) {
    light += (hash(Math.floor(x / 4), 0, id) - 0.5) * 30;
    if ((x + Math.floor(y / 8)) % 11 === 0) light -= 15;
  } else if (id >= 20 && id <= 22) {
    const panel = x === 0 || y === 0;
    const highlight = x === 1 || y === 1;
    if (panel) light -= 30;
    else if (highlight) light += 22;
    light += (Math.floor((x + y) / 6) % 2 ? 3 : -3);
  } else if (id === 23) {
    const coral = hash(Math.floor(x / 4), Math.floor(y / 4), id);
    light += (coral - 0.5) * 40;
    if (coral > 0.72 && noise > 0.45) light -= 22;
  } else if (id === 24) {
    const vein = (x + Math.floor(y * 0.6) + Math.floor(coarse * 4)) % 17;
    if (vein < 2) base = mix(base, rgb('#e7c68b'), 0.65);
    light += (coarse - 0.5) * 25;
  }
  return base.map(channel => Math.max(0, Math.min(255, Math.round(channel + light))));
}

export function createBlockAtlas(blocks) {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLUMNS * TEXTURE_SIZE;
  canvas.height = ATLAS_ROWS * TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Nie można utworzyć tekstur klocków.');
  const image = context.createImageData(canvas.width, canvas.height);
  for (let id = 1; id < ATLAS_COLUMNS * ATLAS_ROWS; id++) {
    const tileX = (id % ATLAS_COLUMNS) * TEXTURE_SIZE;
    const tileY = Math.floor(id / ATLAS_COLUMNS) * TEXTURE_SIZE;
    for (let y = 0; y < TEXTURE_SIZE; y++) for (let x = 0; x < TEXTURE_SIZE; x++) {
      const color = pixel(id, x, y, blocks);
      const index = ((tileY + y) * canvas.width + tileX + x) * 4;
      image.data.set([...color, 255], index);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
