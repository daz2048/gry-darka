import { ATLAS_COLUMNS, ATLAS_ROWS, TEXTURE_SIZE, blockTexture } from './textures.js?v=3';

export const SIZE = [256, 32, 256];
export const CHUNK = 16;
export const REACH = 5;
export const VILLAGES = [
  { name: 'Brzozowa', x: 112, z: 56, floor: 17, wall: 10, roof: 8, path: 6, landmark: 'tree' },
  { name: 'Ceglane Wzgórze', x: 196, z: 80, floor: 7, wall: 9, roof: 20, path: 11, landmark: 'tower' },
  { name: 'Kamienny Gród', x: 100, z: 168, floor: 16, wall: 12, roof: 14, path: 11, landmark: 'arch' },
  { name: 'Turkusowa Łąka', x: 196, z: 192, floor: 17, wall: 7, roof: 24, path: 6, landmark: 'beacon' }
];
export const BIOMES = {
  meadow: { name: 'Łąka' },
  desert: { name: 'Pustynia' },
  savanna: { name: 'Sawanna' },
  tundra: { name: 'Tundra' },
  taiga: { name: 'Tajga' },
  jungle: { name: 'Dżungla' },
  badlands: { name: 'Pustkowia' },
  birch: { name: 'Las brzozowy' },
  swamp: { name: 'Bagna' },
  mountains: { name: 'Góry' },
  cherry: { name: 'Wiśniowy gaj' }
};

const BIOME_GRID = [
  ['meadow', 'meadow', 'jungle', 'badlands'],
  ['desert', 'meadow', 'meadow', 'meadow'],
  ['savanna', 'meadow', 'birch', 'swamp'],
  ['tundra', 'taiga', 'mountains', 'cherry']
];

export function biomeAt(x, z) {
  if (x < 0 || z < 0 || x >= SIZE[0] || z >= SIZE[2]) return null;
  return BIOME_GRID[Math.floor(z / 64)][Math.floor(x / 64)];
}

export const BIOME_VILLAGES = [
  { biome: 'desert', name: 'Piaskowa Oaza', x: 28, z: 90, floor: 7, wall: 10, roof: 6, path: 6, landmark: 'tower' },
  { biome: 'savanna', name: 'Złota Sawanna', x: 28, z: 156, floor: 7, wall: 9, roof: 16, path: 6, landmark: 'tree' },
  { biome: 'tundra', name: 'Śnieżna Osada', x: 28, z: 220, floor: 17, wall: 19, roof: 21, path: 19, landmark: 'beacon' },
  { biome: 'taiga', name: 'Sosnowa Wioska', x: 88, z: 220, floor: 16, wall: 7, roof: 19, path: 11, landmark: 'tree' },
  { biome: 'jungle', name: 'Zielona Dżungla', x: 152, z: 28, floor: 7, wall: 18, roof: 16, path: 6, landmark: 'tree' },
  { biome: 'badlands', name: 'Miedziane Skały', x: 224, z: 28, floor: 16, wall: 9, roof: 20, path: 6, landmark: 'tower' },
  { biome: 'birch', name: 'Biały Las', x: 152, z: 128, floor: 17, wall: 10, roof: 17, path: 6, landmark: 'tree' },
  { biome: 'swamp', name: 'Bagienna Przystań', x: 224, z: 130, floor: 16, wall: 18, roof: 14, path: 11, landmark: 'arch' },
  { biome: 'mountains', name: 'Górska Grań', x: 152, z: 220, floor: 11, wall: 3, roof: 19, path: 11, landmark: 'arch' },
  { biome: 'cherry', name: 'Wiśniowa Polana', x: 224, z: 220, floor: 17, wall: 23, roof: 8, path: 6, landmark: 'tree' }
];
const ALL_VILLAGES = [...VILLAGES, ...BIOME_VILLAGES];
export function hauntedHouseIdAt(x, z) {
  const village = ALL_VILLAGES.find(village =>
    x >= village.x - 10 && x <= village.x - 4 &&
    z >= village.z + 4 && z <= village.z + 10);
  return village ? `${village.x - 7},${village.z + 7}` : null;
}

export function hauntedHouseAt(x, z) {
  return hauntedHouseIdAt(x, z) !== null;
}

export function updateHauntedCurse(world, houseId) {
  if (!houseId) {
    world.currentHauntedHouse = null;
    return false;
  }
  if (world.currentHauntedHouse === houseId) return false;
  world.currentHauntedHouse = houseId;
  if (world.opMode) return false;
  world.hauntedVisits = Math.min(world.hauntedVisits + 1, 4);
  world.curseHouse = houseId;
  if (world.hauntedVisits === 1) {
    world.cursed = true;
  } else if (world.hauntedVisits === 2) {
    world.cursed = false;
    world.curseLifted = true;
    world.nightmare = false;
  } else if (world.hauntedVisits === 3) {
    world.nightmare = true;
  } else if (world.hauntedVisits === 4) {
    world.cursed = false;
    world.nightmare = false;
    world.opMode = true;
  } else {
    return false;
  }
  return true;
}

export function isHauntedHouseBlock(x, y, z) {
  return y >= 8 && y <= 15 && hauntedHouseAt(x, z);
}

export const STRUCTURES = [
  { name: 'Wieża obserwacyjna', x: 82, z: 44, rx: 5, rz: 5 },
  { name: 'Obozowisko', x: 151, z: 67, rx: 6, rz: 5 },
  { name: 'Kamienne ruiny', x: 100, z: 112, rx: 6, rz: 6 },
  { name: 'Gospodarstwo', x: 154, z: 180, rx: 8, rz: 7 }
];
export const BLOCKS = [
  { name: 'Powietrze', color: '#ffffff' },
  { name: 'Trawa', color: '#79ae53' },
  { name: 'Ziemia', color: '#a37650' },
  { name: 'Kamień', color: '#99a5a3' },
  { name: 'Pień', color: '#88613e' },
  { name: 'Liście', color: '#478751' },
  { name: 'Piasek', color: '#e6ce8b' },
  { name: 'Deski', color: '#ce9d62' },
  { name: 'Dachówka', color: '#b55c46' },
  { name: 'Cegła', color: '#bf6e57' },
  { name: 'Jasna cegła', color: '#dfbfa1' },
  { name: 'Bruk', color: '#727e7a' },
  { name: 'Marmur', color: '#eee8df' },
  { name: 'Granit', color: '#b6a1a1' },
  { name: 'Bazalt', color: '#454b58' },
  { name: 'Beton', color: '#c3c6c0' },
  { name: 'Ciemne deski', color: '#563e35' },
  { name: 'Białe deski', color: '#f1e4cf' },
  { name: 'Mech', color: '#57864d' },
  { name: 'Śnieg', color: '#f0f8ff' },
  { name: 'Miedź', color: '#cb865b' },
  { name: 'Stal', color: '#95b3c2' },
  { name: 'Złoto', color: '#f4cc52' },
  { name: 'Koral', color: '#e992a1' },
  { name: 'Turkus', color: '#55c4b8' },
  { name: 'Ruda węgla', color: '#555b59' },
  { name: 'Ruda żelaza', color: '#c59078' },
  { name: 'Ruda miedzi', color: '#c47d56' },
  { name: 'Ruda złota', color: '#e2bd45' },
  { name: 'Ruda diamentu', color: '#49bad1' },
  { name: 'Pień brzozy', color: '#e9e3d5' },
  { name: 'Liście wiśni', color: '#e8a7bc' },
  { name: 'Łóżko — kołdra', color: '#b94f4a', height: 0.5 },
  { name: 'Łóżko — poduszka', color: '#e9dccb', height: 0.5 },
  { name: 'Stół', color: '#ad794b', height: 0.75, shape: 'table' },
  { name: 'Regał z książkami', color: '#80532e' },
  { name: 'Skrzynia', color: '#b67c39', height: 0.75 },
  { name: 'Piec', color: '#6f7677' }
];

export function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const ROADS = [
  [5, 33, 112, 33], [112, 33, 112, 56],
  [112, 56, 196, 56], [196, 56, 196, 80],
  [112, 56, 112, 168], [100, 168, 112, 168],
  [100, 168, 196, 168], [196, 168, 196, 192],
  [82, 33, 82, 41], [151, 56, 151, 62], [106, 112, 112, 112],
  [154, 168, 154, 173], [150, 173, 154, 173], [150, 173, 150, 175],
  [5, 33, 5, 90], [5, 90, 28, 90], [28, 90, 28, 220],
  [28, 220, 224, 220], [224, 28, 224, 220], [152, 28, 224, 28],
  [112, 128, 152, 128]
];

function onRoad(x, z, margin = 0) {
  return ROADS.some(([x1, z1, x2, z2]) => x1 === x2 ?
    Math.abs(x - x1) <= 1 + margin && z >= Math.min(z1, z2) - margin && z <= Math.max(z1, z2) + margin :
    Math.abs(z - z1) <= 1 + margin && x >= Math.min(x1, x2) - margin && x <= Math.max(x1, x2) + margin);
}

function inVillage(x, z, margin = 0) {
  const villageClearing = z >= 24 && z <= 44 &&
    ((x >= 5 && x <= 21) || (x >= 23 && x <= 42) || (x >= 43 && x <= 58));
  return villageClearing ||
    ALL_VILLAGES.some(village => Math.abs(x - village.x) <= 14 + margin &&
      Math.abs(z - village.z) <= 14 + margin);
}

function inSettlement(x, z, margin = 0) {
  return inVillage(x, z, margin) || onRoad(x, z, margin);
}

function inStructureSite(x, z, margin = 0) {
  return STRUCTURES.some(site => Math.abs(x - site.x) <= site.rx + margin &&
    Math.abs(z - site.z) <= site.rz + margin);
}

const terrainAreas = new Uint8Array(SIZE[0] * SIZE[2]);
for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) {
  terrainAreas[x + SIZE[0] * z] = (inSettlement(x, z) || inStructureSite(x, z) ? 1 : 0) |
    (onRoad(x, z) ? 2 : 0);
}

const LAKES = [
  { x: 17, z: 14, rx: 6, rz: 5 },
  { x: 32, z: 51, rx: 7, rz: 4 },
  { x: 245, z: 148, rx: 4, rz: 3 }
];

function lakeDistance(lake, x, z, seed) {
  const distance = Math.hypot((x - lake.x) / lake.rx, (z - lake.z) / lake.rz);
  return distance + 0.06 * Math.sin(x * 1.3 + z * 0.8 + (seed % 97));
}

function generateLakes(world) {
  for (const lake of LAKES) {
    let level = SIZE[1] - 1;
    while (level > 1 && !world.get(lake.x, level, lake.z)) level--;
    const extentX = Math.ceil(lake.rx * 1.52), extentZ = Math.ceil(lake.rz * 1.52);
    for (let x = Math.max(1, lake.x - extentX); x <= Math.min(SIZE[0] - 2, lake.x + extentX); x++) {
      for (let z = Math.max(1, lake.z - extentZ); z <= Math.min(SIZE[2] - 2, lake.z + extentZ); z++) {
        const distance = lakeDistance(lake, x, z, world.seed);
        if (distance >= 1.45 || inSettlement(x, z)) continue;
        let ground = SIZE[1] - 1;
        while (ground > 0 && !world.get(x, ground, z)) ground--;
        const underwater = distance < 1;
        const blend = Math.min(1, Math.max(0, (distance - 1) / 0.45));
        const target = underwater ? level - 1 : Math.max(level, Math.round(level + (ground - level) * blend));
        for (let y = ground + 1; y < target; y++) world.write(x, y, z, 2);
        for (let y = target + 1; y < SIZE[1]; y++) world.write(x, y, z, 0);
        world.write(x, target, z, underwater || distance < 1.16 ? 6 : 1);
        if (underwater) world.water[world.index(x, level, z)] = 1;
      }
    }
  }
}

function streamDistance(x, z, seed) {
  const phase = (seed % 97) / 97 * Math.PI * 2;
  const bend = Math.max(0, Math.min(1, (x - 45) / 45));
  const eastWest = Math.round(112 - 13 * bend + 2 * Math.sin(x / 16 + phase));
  const northSouth = Math.round(68 + 1.5 * Math.sin(z / 17 + phase));
  return Math.min(Math.abs(z - eastWest), Math.abs(x - northSouth));
}

function generateStreams(world) {
  for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) {
    const distance = streamDistance(x, z, world.seed);
    if (distance > 7 || inVillage(x, z) || inStructureSite(x, z) ||
        LAKES.some(lake => lakeDistance(lake, x, z, world.seed) < 1.6)) continue;
    const road = onRoad(x, z);
    if (road && distance > 2) continue;

    let ground = SIZE[1] - 1;
    while (ground > 0 && !world.get(x, ground, z)) ground--;
    const target = distance <= 2 ? 5 : Math.max(6, Math.min(ground, distance + 3));
    for (let y = ground + 1; y <= target; y++) world.write(x, y, z, 2);
    for (let y = target + 1; y < (road ? 7 : SIZE[1]); y++) world.write(x, y, z, 0);
    world.write(x, target, z, distance <= 3 ? 6 : terrainSurface(biomeAt(x, z), x, z, target));
    if (distance <= 2) world.water[world.index(x, 6, z)] = 1;
  }
}

function generateOres(world, random, expanded = false) {
  const deposits = [
    { id: 25, veins: 96, depth: 8, length: 7 },
    { id: 26, veins: 72, depth: 7, length: 6 },
    { id: 27, veins: 54, depth: 6, length: 6 },
    { id: 28, veins: 30, depth: 6, length: 4 },
    { id: 29, veins: 18, depth: 5, length: 3 }
  ];
  for (const deposit of deposits) for (let vein = 0; vein < deposit.veins * (expanded ? 16 : 1); vein++) {
    const centerX = 2 + Math.floor(random() * (expanded ? SIZE[0] - 4 : 60));
    const centerZ = 2 + Math.floor(random() * (expanded ? SIZE[2] - 4 : 60));
    let surface = SIZE[1] - 1;
    while (surface > 0 && !world.get(centerX, surface, centerZ)) surface--;
    const centerY = surface - 3 - Math.floor(random() * deposit.depth);
    for (let step = 0; step < deposit.length; step++) {
      const x = centerX + Math.floor(random() * 3) - 1;
      const y = centerY + Math.floor(random() * 3) - 1;
      const z = centerZ + Math.floor(random() * 3) - 1;
      if (y > 0 && (!expanded || x >= 64 || z >= 64) && world.get(x, y, z) === 3) world.write(x, y, z, deposit.id);
    }
  }
}

function terrainSurface(biome, x, z, height) {
  const patch = Math.sin(x * 0.21) + Math.cos(z * 0.24);
  if (biome === 'desert') return 6;
  if (biome === 'savanna') return patch > 0.3 ? 1 : 6;
  if (biome === 'tundra') return 19;
  if (biome === 'taiga') return patch > 0.4 ? 19 : 1;
  if (biome === 'badlands') return patch > 0.5 ? 6 : 13;
  if (biome === 'swamp') return 18;
  if (biome === 'mountains') return height >= 11 ? 19 : 3;
  return 1;
}

function growBiomeVegetation(world, x, z) {
  const biome = biomeAt(x, z);
  let ground = SIZE[1] - 1;
  while (ground > 0 && !world.get(x, ground, z)) ground--;
  const surface = world.get(x, ground, z);
  if (![1, 6, 13, 18, 19].includes(surface)) return;
  if (biome === 'desert' || biome === 'badlands') {
    if (surface === 18) return;
    if ((x + z) % 3 === 0) for (let y = 1; y <= 3; y++) world.write(x, ground + y, z, 18);
    return;
  }
  if (biome === 'mountains' || (biome === 'tundra' && (x + z) % 4 !== 0)) return;
  const height = biome === 'jungle' ? 7 : biome === 'taiga' || biome === 'tundra' ? 6 : 4;
  const trunk = biome === 'birch' ? 30 : 4;
  const leaves = biome === 'cherry' ? 31 : 5;
  for (let y = 1; y <= height; y++) world.write(x, ground + y, z, trunk);
  if (biome === 'taiga' || biome === 'tundra') {
    for (let dy = 3; dy <= 7; dy++) {
      const radius = dy < 5 ? 2 : 1;
      for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) + Math.abs(dz) <= radius + 1 && !world.get(x + dx, ground + dy, z + dz)) {
          world.write(x + dx, ground + dy, z + dz, leaves);
        }
      }
    }
  } else {
    const radius = biome === 'jungle' || biome === 'savanna' ? 3 : 2;
    for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
      for (let dy = height - 1; dy <= height + 1; dy++) {
        if (Math.abs(dx) + Math.abs(dz) < radius + 2 && !world.get(x + dx, ground + dy, z + dz)) {
          world.write(x + dx, ground + dy, z + dz, leaves);
        }
      }
    }
  }
}

function buildHouse(world, minX, maxX, minZ, maxZ, floor, wall, roof, front = 'maxZ') {
  const doorX = Math.floor((minX + maxX) / 2);
  const frontZ = front === 'minZ' ? minZ : maxZ;
  for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) {
    world.write(x, 8, z, floor);
    for (let y = 9; y <= 12; y++) {
      const boundary = x === minX || x === maxX || z === minZ || z === maxZ;
      const doorway = z === frontZ && x === doorX && y <= 11;
      const window = y >= 10 && y <= 11 &&
        ((z === maxZ && (x === minX + 1 || x === maxX - 1)) ||
          (x === minX && z === Math.floor((minZ + maxZ) / 2)) ||
          (x === maxX && z === Math.floor((minZ + maxZ) / 2)));
      if (boundary && !doorway && !window) world.write(x, y, z, wall);
    }
    world.write(x, 13, z, roof);
    if (x > minX && x < maxX) world.write(x, 14, z, roof);
    if (x === doorX) world.write(x, 15, z, roof);
  }
  furnishHouse(world, minX, maxX, minZ, maxZ, front);
}

function furnishHouse(world, minX, maxX, minZ, maxZ, front) {
  const direction = front === 'maxZ' ? 1 : -1;
  const backZ = front === 'maxZ' ? minZ + 1 : maxZ - 1;
  const frontInsideZ = front === 'maxZ' ? maxZ - 1 : minZ + 1;
  world.write(minX + 1, 9, backZ, 33);
  world.write(minX + 1, 9, backZ + direction, 32);
  world.write(maxX - 1, 9, backZ, 36);
  world.write(maxX - 1, 9, Math.floor((minZ + maxZ) / 2), 34);
  world.write(maxX - 1, 9, frontInsideZ, 35);
  world.write(minX + 1, 9, frontInsideZ, 37);
}

function buildHauntedHouse(world, village) {
  const { x, z } = village;
  buildHouse(world, x - 10, x - 4, z + 4, z + 10, 14, 16, 14, 'minZ');
  world.write(x - 10, 9, z + 5, 18);
  world.write(x - 4, 9, z + 9, 18);
  world.write(x - 10, 10, z + 6, 25);
  world.write(x - 4, 10, z + 8, 25);
}

function buildWell(world, x, z) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const edge = Math.abs(dx) === 1 || Math.abs(dz) === 1;
    world.write(x + dx, 8, z + dz, edge ? 11 : 6);
    if (edge && Math.abs(dx) === Math.abs(dz)) {
      world.write(x + dx, 9, z + dz, 4);
      world.write(x + dx, 10, z + dz, 4);
      world.write(x + dx, 11, z + dz, 7);
    }
  }
  world.write(x, 10, z, 22);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    world.write(x + dx, 12, z + dz, 7);
  }
}

function buildLandmark(world, village) {
  const x = village.x + 12, z = village.z + 12;
  if (village.landmark === 'tree') {
    const trunk = village.biome === 'birch' ? 30 : village.biome ? 4 : 17;
    const leaves = village.biome === 'cherry' ? 31 : 5;
    for (let y = 8; y <= 13; y++) world.write(x, y, z, trunk);
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      for (let y = 13; y <= 15; y++) {
        if (Math.abs(dx) + Math.abs(dz) <= 3 && !world.get(x + dx, y, z + dz)) {
          world.write(x + dx, y, z + dz, leaves);
        }
      }
    }
  } else if (village.landmark === 'tower') {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      for (let y = 8; y <= 17; y++) world.write(x + dx, y, z + dz, 9);
      world.write(x + dx, 18, z + dz, 20);
    }
  } else if (village.landmark === 'arch') {
    for (const dx of [-1, 1]) for (let y = 8; y <= 15; y++) world.write(x + dx, y, z, 12);
    for (let dx = -1; dx <= 1; dx++) world.write(x + dx, 16, z, 14);
    world.write(x, 17, z, 22);
  } else if (village.landmark === 'beacon') {
    for (let y = 8; y <= 16; y++) world.write(x, y, z, y % 2 ? 24 : 12);
    world.write(x, 17, z, 22);
  }
}

function buildStructures(world) {
  const [tower, camp, ruins, farm] = STRUCTURES;

  for (const dx of [-3, 3]) for (const dz of [-3, 3]) {
    for (let y = 8; y <= 20; y++) world.write(tower.x + dx, y, tower.z + dz, 16);
  }
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    world.write(tower.x + dx, 13, tower.z + dz, 7);
    world.write(tower.x + dx, 21, tower.z + dz, 8);
    if ((Math.abs(dx) === 3 || Math.abs(dz) === 3) && !(dx === 2 && dz === 3)) {
      world.write(tower.x + dx, 14, tower.z + dz, 16);
    }
  }
  for (let step = 0; step < 6; step++) {
    for (let y = 8; y <= 8 + step; y++) {
      world.write(tower.x - 3 + step, y, tower.z + 4, 7);
    }
  }

  for (const side of [-1, 1]) {
    const tentX = camp.x + side * 4;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -1; dx <= 1; dx++) world.write(tentX + dx, 7, camp.z + dz, 16);
      for (let y = 8; y <= 9; y++) {
        world.write(tentX - 1, y, camp.z + dz, 23);
        world.write(tentX + 1, y, camp.z + dz, 23);
      }
      world.write(tentX, 10, camp.z + dz, 23);
    }
  }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    world.write(camp.x + dx, 7, camp.z + dz, 11);
  }
  world.write(camp.x, 8, camp.z, 4);
  world.write(camp.x, 9, camp.z, 20);

  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    world.write(ruins.x + dx, 7, ruins.z + dz, (dx + dz) % 4 === 0 ? 18 : 11);
  }
  for (const [dx, dz, height] of [[-4, -4, 6], [4, -4, 6], [-4, 4, 3], [4, 4, 5]]) {
    for (let y = 8; y < 8 + height; y++) world.write(ruins.x + dx, y, ruins.z + dz, y % 3 ? 11 : 18);
  }
  for (let dx = -4; dx <= 4; dx++) world.write(ruins.x + dx, 14, ruins.z - 4, 12);
  world.write(ruins.x - 2, 8, ruins.z, 12);
  world.write(ruins.x - 2, 9, ruins.z, 22);

  buildHouse(world, farm.x - 7, farm.x - 1, farm.z - 5, farm.z + 1, 7, 10, 8, 'minZ');
  for (let dx = 2; dx <= 7; dx++) for (let dz = -3; dz <= 5; dz++) {
    world.write(farm.x + dx, 7, farm.z + dz, 2);
    if (dx % 2 === 0 && dz % 2 === 0) world.write(farm.x + dx, 8, farm.z + dz, 18);
  }
  for (let dz = -3; dz <= 5; dz++) {
    world.write(farm.x + 7, 8, farm.z + dz, 4);
  }
}

export function nearbyChunks(x, z, radius = 4) {
  const keys = new Set();
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  for (let ix = Math.max(0, cx - radius); ix <= Math.min(SIZE[0] / CHUNK - 1, cx + radius); ix++) {
    for (let iz = Math.max(0, cz - radius); iz <= Math.min(SIZE[2] / CHUNK - 1, cz + radius); iz++) {
      for (let iy = 0; iy < SIZE[1] / CHUNK; iy++) keys.add(`${ix},${iy},${iz}`);
    }
  }
  return keys;
}

export class World {
  constructor(seed = 2026) {
    this.seed = seed >>> 0;
    this.cursed = false;
    this.curseHouse = null;
    this.curseLifted = false;
    this.nightmare = false;
    this.hauntedVisits = 0;
    this.currentHauntedHouse = null;
    this.opMode = false;
    this.blocks = new Uint8Array(SIZE[0] * SIZE[1] * SIZE[2]);
    this.water = new Uint8Array(this.blocks.length);
    this.dirty = new Set();
    this.spawn = { x: 32.5, y: 9, z: 39.5 };
    this.generate();
  }

  inside(x, y, z) {
    return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z) &&
      x >= 0 && y >= 0 && z >= 0 && x < SIZE[0] && y < SIZE[1] && z < SIZE[2];
  }

  index(x, y, z) { return x + SIZE[0] * (z + SIZE[2] * y); }
  get(x, y, z) { return this.inside(x, y, z) ? this.blocks[this.index(x, y, z)] : 0; }
  getWater(x, y, z) {
    return this.inside(x, y, z) && this.water[this.index(x, y, z)] !== 0 && !this.get(x, y, z);
  }
  solid(x, y, z) {
    return x < 0 || z < 0 || x >= SIZE[0] || z >= SIZE[2] || y < 0 ||
      y >= SIZE[1] || this.get(x, y, z) !== 0;
  }

  blockHeight(x, y, z) {
    if (!this.inside(x, y, z)) return 1;
    const id = this.get(x, y, z);
    return id ? (BLOCKS[id].height ?? 1) : 0;
  }

  write(x, y, z, id) {
    if (this.inside(x, y, z)) this.blocks[this.index(x, y, z)] = id;
  }

  generate() {
    const random = randomGenerator(this.seed);
    const phase = random() * Math.PI * 2;
    for (let x = 0; x < SIZE[0]; x++) {
      for (let z = 0; z < SIZE[2]; z++) {
        const area = terrainAreas[x + SIZE[0] * z];
        const clearing = (area & 1) !== 0;
        const biome = biomeAt(x, z);
        const mountain = biome === 'mountains' ?
          4 * Math.max(0, Math.min(1, (x - 128) / 12, (192 - x) / 12, (z - 192) / 12, (256 - z) / 12)) : 0;
        const height = clearing ? 7 :
          Math.max(4, Math.floor(7 + Math.sin(x / 8 + phase) * 2 + Math.cos(z / 9) * 2 + mountain));
        const surface = terrainSurface(biome, x, z, height);
        for (let y = 0; y <= height; y++) {
          this.blocks[x + SIZE[0] * (z + SIZE[2] * y)] = y === height ? surface :
            y > height - 3 ? biome === 'desert' ? 6 : biome === 'badlands' ? 13 : 2 : 3;
        }
        if ((clearing && (x === 32 || x === 33) && z >= 29 && z <= 44) || (area & 2)) {
          this.write(x, height, z, 6);
        }
      }
    }
    generateLakes(this);
    generateStreams(this);
    generateOres(this, random);
    for (let i = 0; i < 80; i++) {
      const x = 3 + Math.floor(random() * 58);
      const z = 3 + Math.floor(random() * 58);
      if (inSettlement(x, z, 3) || inStructureSite(x, z, 3) ||
          LAKES.some(lake => lakeDistance(lake, x, z, this.seed) < 1.6) ||
          streamDistance(x, z, this.seed) <= 5) continue;
      let ground = 20;
      while (ground > 0 && !this.get(x, ground, z)) ground--;
      if (this.get(x, ground, z) !== 1) continue;
      for (let y = 1; y <= 4; y++) this.write(x, ground + y, z, 4);
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 3; dy <= 5; dy++) {
          if (Math.abs(dx) + Math.abs(dz) < 4 && !this.get(x + dx, ground + dy, z + dz)) {
            this.write(x + dx, ground + dy, z + dz, 5);
          }
        }
      }
    }
    const extraRandom = randomGenerator(this.seed ^ 0x9e3779b9);
    generateOres(this, extraRandom, true);
    for (let i = 0; i < 1280; i++) {
      const x = 3 + Math.floor(extraRandom() * (SIZE[0] - 6));
      const z = 3 + Math.floor(extraRandom() * (SIZE[2] - 6));
      if ((x < 67 && z < 67) || inSettlement(x, z, 3) || inStructureSite(x, z, 3) ||
          LAKES.some(lake => lakeDistance(lake, x, z, this.seed) < 1.6) ||
          streamDistance(x, z, this.seed) <= 5) continue;
      growBiomeVegetation(this, x, z);
    }
    for (let x = 5; x <= 58; x++) for (let z = 32; z <= 34; z++) this.write(x, 7, z, 6);
    // A small original cottage gives the first view scale and a building idea.
    for (let x = 28; x <= 37; x++) for (let z = 25; z <= 32; z++) {
      this.write(x, 8, z, 7);
      for (let y = 9; y <= 12; y++) {
        if (x === 28 || x === 37 || z === 25 || z === 32) this.write(x, y, z, 7);
      }
      this.write(x, 13, z, 8);
      if (x >= 29 && x <= 36) this.write(x, 14, z, 8);
    }
    for (let y = 9; y <= 11; y++) for (let x = 32; x <= 33; x++) this.write(x, y, 32, 0);
    for (const x of [30, 35]) for (const y of [10, 11]) this.write(x, y, 32, 0);
    furnishHouse(this, 28, 37, 25, 32, 'maxZ');
    buildHouse(this, 24, 30, 35, 41, 17, 10, 8);
    buildHouse(this, 35, 41, 35, 41, 16, 9, 20);
    buildHouse(this, 7, 13, 25, 31, 17, 10, 8);
    buildHouse(this, 14, 20, 36, 42, 7, 9, 20, 'minZ');
    buildHouse(this, 44, 50, 25, 31, 16, 12, 8);
    buildHouse(this, 51, 57, 36, 42, 7, 10, 20, 'minZ');
    buildWell(this, 10, 38);
    buildWell(this, 47, 38);
    for (const village of ALL_VILLAGES) {
      const { x, z, floor, wall, roof, path } = village;
      for (let n = -12; n <= 12; n++) for (let width = -1; width <= 1; width++) {
        this.write(x + n, 7, z + width, path);
        this.write(x + width, 7, z + n, path);
      }
      buildHouse(this, x - 10, x - 4, z - 10, z - 4, floor, wall, roof);
      buildHouse(this, x + 4, x + 10, z - 10, z - 4, floor, wall, roof);
      buildHauntedHouse(this, village);
      buildWell(this, x + 7, z + 7);
      buildLandmark(this, village);
    }
    buildStructures(this);
    for (let x = 0; x < SIZE[0] / CHUNK; x++) for (let y = 0; y < SIZE[1] / CHUNK; y++) {
      for (let z = 0; z < SIZE[2] / CHUNK; z++) this.dirty.add(`${x},${y},${z}`);
    }
  }

  // Returns null on success, otherwise a message key translated by i18n.js.
  edit(x, y, z, id, player) {
    if (!this.inside(x, y, z) || y === 0) return 'edit.boundary';
    if (!Number.isInteger(id) || id < 0 || id >= BLOCKS.length) return 'edit.unknown';
    if (id && this.get(x, y, z)) return 'edit.occupied';
    if (!id && !this.get(x, y, z)) return 'edit.empty';
    if (id && player && overlaps(player, x, y, z, BLOCKS[id].height ?? 1)) return 'edit.player';
    this.write(x, y, z, id);
    for (const [dx, dy, dz] of [[0, 0, 0], [-1, 0, 0], [1, 0, 0],
      [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]]) {
      if (this.inside(x + dx, y + dy, z + dz)) {
        this.dirty.add([x + dx, y + dy, z + dz].map(n => Math.floor(n / CHUNK)).join(','));
      }
    }
    return null;
  }
}

export function overlaps(player, x, y, z, height = 1) {
  return player.x + 0.3 > x && player.x - 0.3 < x + 1 &&
    player.y + 1.75 > y && player.y < y + height &&
    player.z + 0.3 > z && player.z - 0.3 < z + 1;
}

const FACES = [
  { n: [1, 0, 0], v: [[1, 0, 1], [1, 0, 0], [1, 1, 1], [1, 1, 0]], shade: 0.85 },
  { n: [-1, 0, 0], v: [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1]], shade: 0.72 },
  { n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]], shade: 1 },
  { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]], shade: 0.5 },
  { n: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], shade: 0.9 },
  { n: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [1, 1, 0], [0, 1, 0]], shade: 0.77 }
];

const TABLE_PARTS = [
  [0, 0.62, 0, 1, 0.75, 1],
  [0.08, 0, 0.08, 0.22, 0.62, 0.22],
  [0.78, 0, 0.08, 0.92, 0.62, 0.22],
  [0.08, 0, 0.78, 0.22, 0.62, 0.92],
  [0.78, 0, 0.78, 0.92, 0.62, 0.92]
];

export function chunkGeometry(world, cx, cy, cz) {
  const positions = [], normals = [], colors = [], uvs = [], haunted = [], hauntedFloor = [], indices = [];
  function addFace(x, y, z, id, face, box, hauntedBlock, hauntedFloorBlock) {
    const offset = positions.length / 3;
    const hauntedFloorFace = hauntedFloorBlock && face.n[1] > 0 ? 1 : 0;
    const tile = blockTexture(id, face.n);
    const column = tile % ATLAS_COLUMNS;
    const row = Math.floor(tile / ATLAS_COLUMNS);
    const inset = 0.5 / TEXTURE_SIZE;
    const u0 = (column + inset) / ATLAS_COLUMNS;
    const u1 = (column + 1 - inset) / ATLAS_COLUMNS;
    const v0 = 1 - (row + 1 - inset) / ATLAS_ROWS;
    const v1 = 1 - (row + inset) / ATLAS_ROWS;
    for (let i = 0; i < face.v.length; i++) {
      const vertex = face.v[i];
      positions.push(x + box[0] + vertex[0] * (box[3] - box[0]),
        y + box[1] + vertex[1] * (box[4] - box[1]),
        z + box[2] + vertex[2] * (box[5] - box[2]));
      normals.push(...face.n);
      colors.push(face.shade, face.shade, face.shade);
      uvs.push(i % 2 ? u1 : u0, i < 2 ? v0 : v1);
      haunted.push(hauntedBlock);
      hauntedFloor.push(hauntedFloorFace);
    }
    indices.push(offset, offset + 1, offset + 2, offset + 2, offset + 1, offset + 3);
  }
  for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++) {
    for (let y = cy * CHUNK; y < (cy + 1) * CHUNK; y++) {
      for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) {
        const id = world.get(x, y, z);
        if (!id) continue;
        const hauntedBlock = isHauntedHouseBlock(x, y, z) ? 1 : 0;
        const hauntedFloorBlock = hauntedBlock && y === 8;
        if (BLOCKS[id].shape === 'table') {
          for (const box of TABLE_PARTS) for (const face of FACES) {
            addFace(x, y, z, id, face, box, hauntedBlock, hauntedFloorBlock);
          }
          continue;
        }
        const height = BLOCKS[id].height ?? 1;
        for (const face of FACES) {
          const neighbor = world.get(x + face.n[0], y + face.n[1], z + face.n[2]);
          if (neighbor && BLOCKS[neighbor].shape !== 'table') {
            const neighborHeight = BLOCKS[neighbor].height ?? 1;
            if (face.n[1] > 0 ? height === 1 :
              face.n[1] < 0 ? neighborHeight === 1 : neighborHeight >= height) continue;
          }
          addFace(x, y, z, id, face, [0, 0, 0, 1, height, 1], hauntedBlock, hauntedFloorBlock);
        }
      }
    }
  }
  return { positions, normals, colors, uvs, haunted, hauntedFloor, indices };
}

export function waterGeometry(world, cx, cy, cz) {
  const positions = [], normals = [], uvs = [], indices = [];
  for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++) {
    for (let y = cy * CHUNK; y < (cy + 1) * CHUNK; y++) {
      for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) {
        if (!world.getWater(x, y, z)) continue;
        for (const face of FACES) {
          const nx = x + face.n[0], ny = y + face.n[1], nz = z + face.n[2];
          const neighbor = world.get(nx, ny, nz);
          if ((neighbor && (BLOCKS[neighbor].height ?? 1) === 1 &&
              BLOCKS[neighbor].shape !== 'table') || world.getWater(nx, ny, nz)) continue;
          const offset = positions.length / 3;
          for (const vertex of face.v) {
            const px = x + vertex[0], py = y + vertex[1] * 0.92, pz = z + vertex[2];
            positions.push(px, py, pz);
            normals.push(...face.n);
            uvs.push((face.n[0] ? pz : px) / 5, (face.n[1] ? pz : py) / 5);
          }
          indices.push(offset, offset + 1, offset + 2, offset + 2, offset + 1, offset + 3);
        }
      }
    }
  }
  return { positions, normals, uvs, indices };
}

export function pick(world, origin, direction, reach = REACH) {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (!Number.isFinite(length) || length === 0) return null;
  const ray = [direction.x / length, direction.y / length, direction.z / length];
  const start = [origin.x, origin.y, origin.z];
  const cell = start.map(Math.floor);
  const step = ray.map(n => n > 0 ? 1 : n < 0 ? -1 : 0);
  const delta = ray.map(n => n === 0 ? Infinity : Math.abs(1 / n));
  const next = ray.map((n, axis) => n === 0 ? Infinity :
    ((cell[axis] + (step[axis] > 0 ? 1 : 0)) - start[axis]) / n);
  let distance = 0;
  let normal = [0, 0, 0];
  while (distance <= reach) {
    const id = world.get(...cell);
    if (id) {
      const height = BLOCKS[id].height ?? 1;
      if (height === 1 || origin.y + ray[1] * distance < cell[1] + height) {
        return { cell: [...cell], normal, distance };
      }
      if (ray[1] < 0) {
        const topDistance = (cell[1] + height - origin.y) / ray[1];
        if (topDistance >= distance && topDistance <= Math.min(...next, reach)) {
          return { cell: [...cell], normal: [0, 1, 0], distance: topDistance };
        }
      }
    }
    const axis = next[0] <= next[1] && next[0] <= next[2] ? 0 : next[1] <= next[2] ? 1 : 2;
    distance = next[axis];
    cell[axis] += step[axis];
    next[axis] += delta[axis];
    normal = [0, 0, 0];
    normal[axis] = -step[axis];
  }
  return null;
}
