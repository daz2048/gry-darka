import { SIZE, VILLAGES, BIOME_VILLAGES } from './world.js?v=11';

const PASTURES = [
  { kind: 'cow', x: 25.4, z: 28.2, radius: 0.58, height: 1.62, speed: 0.55,
    bounds: { minX: 24, maxX: 27.2, minZ: 25.5, maxZ: 30.6 } },
  { kind: 'sheep', x: 9.5, z: 42, radius: 0.5, height: 1.42, speed: 0.42,
    bounds: { minX: 7.5, maxX: 13, minZ: 40, maxZ: 44 } },
  { kind: 'pig', x: 40, z: 28.2, radius: 0.52, height: 1.38, speed: 0.62,
    bounds: { minX: 38.6, maxX: 41.4, minZ: 25.5, maxZ: 30.6 } },
  { kind: 'chicken', x: 54, z: 28.2, radius: 0.32, height: 1.38, speed: 0.7,
    bounds: { minX: 51.5, maxX: 56.5, minZ: 25.5, maxZ: 30.6 } },
  { kind: 'ironGolem', x: 23.5, z: 33.5, radius: 0.78, height: 2.85, speed: 0.32,
    bounds: { minX: 22, maxX: 27, minZ: 32, maxZ: 35 } },
  { kind: 'ironGolem', x: 13.5, z: 33.5, radius: 0.78, height: 2.85, speed: 0.32,
    bounds: { minX: 8, maxX: 19, minZ: 32, maxZ: 35 } },
  { kind: 'ironGolem', x: 50.5, z: 33.5, radius: 0.78, height: 2.85, speed: 0.32,
    bounds: { minX: 45, maxX: 57, minZ: 32, maxZ: 35 } }
];

const RESIDENTS = [
  { x: 32.5, z: 29.5, bounds: { minX: 29.4, maxX: 36.6, minZ: 26.4, maxZ: 31.6 },
    shirt: '#416d68', apron: '#d2ad78', pants: '#475461', skin: '#bd8564', hair: '#493b32' },
  { x: 27.5, z: 38.5, bounds: { minX: 25.4, maxX: 29.6, minZ: 36.4, maxZ: 40.6 },
    shirt: '#a94f3e', apron: '#e1c794', pants: '#4d5365', skin: '#e0b48d', hair: '#694332' },
  { x: 38.5, z: 38.5, bounds: { minX: 36.4, maxX: 40.6, minZ: 36.4, maxZ: 40.6 },
    shirt: '#70864f', apron: '#c4a06b', pants: '#55483e', skin: '#a96f51', hair: '#382f2a' },
  { x: 10.5, z: 28.5, bounds: { minX: 8.4, maxX: 12.6, minZ: 26.4, maxZ: 30.6 },
    shirt: '#d0a646', apron: '#eee1c6', pants: '#496269', skin: '#efc49a', hair: '#8b5937' },
  { x: 17.5, z: 39.5, bounds: { minX: 15.4, maxX: 19.6, minZ: 36.4, maxZ: 40.6 },
    shirt: '#775b80', apron: '#c9ae83', pants: '#454946', skin: '#bd815f', hair: '#392f2a' },
  { x: 47.5, z: 28.5, bounds: { minX: 45.4, maxX: 49.6, minZ: 26.4, maxZ: 30.6 },
    shirt: '#47818a', apron: '#d7c08d', pants: '#62513f', skin: '#dda987', hair: '#50352b' },
  { x: 54.5, z: 39.5, bounds: { minX: 52.4, maxX: 56.6, minZ: 36.4, maxZ: 40.6 },
    shirt: '#a05f3e', apron: '#efe0bd', pants: '#4d5960', skin: '#f0c99f', hair: '#765139' }
].map(resident => ({
  ...resident,
  kind: 'villager',
  radius: 0.28,
  height: 1.88,
  speed: 0.3,
  groundY: 9
}));

const NEW_VILLAGERS = VILLAGES.flatMap((village, index) =>
  [[-7, -7], [7, -7], [-7, 7]].map(([dx, dz], house) => ({
    kind: 'villager', x: village.x + dx + 0.5, z: village.z + dz + 0.5,
    haunted: house === 2,
    bounds: { minX: village.x + dx - 1.6, maxX: village.x + dx + 2.6,
      minZ: village.z + dz - 1.6, maxZ: village.z + dz + 2.6 },
    shirt: ['#416d68', '#a94f3e', '#70864f', '#47818a'][(index + house) % 4],
    apron: '#d2ad78', pants: '#475461', skin: '#bd8564', hair: '#493b32',
    radius: 0.28, height: 1.88, speed: 0.3, groundY: 9
  })));

const WILDLIFE = VILLAGES.flatMap(village => [
  { kind: 'rabbit', x: village.x + 4.5, z: village.z + 7.5, radius: 0.22, height: 0.95,
    speed: 0.75, groundY: 8,
    bounds: { minX: village.x + 3, maxX: village.x + 12, minZ: village.z + 3, maxZ: village.z + 12 } },
  { kind: 'fox', x: village.x + 10.5, z: village.z + 10.5, radius: 0.35, height: 1.1,
    speed: 0.65, groundY: 8,
    bounds: { minX: village.x + 3, maxX: village.x + 12, minZ: village.z + 3, maxZ: village.z + 12 } }
]);

const BIOME_RESIDENTS = BIOME_VILLAGES.map((village, index) => ({
  kind: 'villager', x: village.x - 6.5, z: village.z + 7.5, haunted: true,
  bounds: { minX: village.x - 8.6, maxX: village.x - 4.4,
    minZ: village.z + 5.4, maxZ: village.z + 9.6 },
  shirt: ['#416d68', '#a94f3e', '#70864f', '#47818a'][index % 4],
  apron: '#d2ad78', pants: '#475461', skin: '#bd8564', hair: '#493b32',
  radius: 0.28, height: 1.88, speed: 0.3, groundY: 9
}));

const CHARACTERS = [...PASTURES, ...RESIDENTS, ...NEW_VILLAGERS, ...WILDLIFE, ...BIOME_RESIDENTS];

function random(mob) {
  mob.randomState = (Math.imul(mob.randomState, 1664525) + 1013904223) >>> 0;
  return mob.randomState / 4294967296;
}

function openAt(world, mob, x, z) {
  const minX = Math.floor(x - mob.radius);
  const maxX = Math.floor(x + mob.radius);
  const minZ = Math.floor(z - mob.radius);
  const maxZ = Math.floor(z + mob.radius);
  for (let cellX = minX; cellX <= maxX; cellX++) {
    for (let cellZ = minZ; cellZ <= maxZ; cellZ++) {
      if (!world.get(cellX, mob.groundY - 1, cellZ)) return false;
      for (let y = mob.groundY; y < mob.groundY + mob.height; y++) {
        if (world.get(cellX, y, cellZ)) return false;
      }
    }
  }
  return true;
}

function chooseTarget(world, mob) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const x = mob.bounds.minX + mob.radius + random(mob) *
      (mob.bounds.maxX - mob.bounds.minX - mob.radius * 2);
    const z = mob.bounds.minZ + mob.radius + random(mob) *
      (mob.bounds.maxZ - mob.bounds.minZ - mob.radius * 2);
    if (openAt(world, mob, x, z)) {
      mob.targetX = x;
      mob.targetZ = z;
      return;
    }
  }
  mob.targetX = mob.x;
  mob.targetZ = mob.z;
}

export function createMobs(world) {
  return CHARACTERS.flatMap((pasture, index) => {
    const mob = {
      ...pasture,
      bounds: { ...pasture.bounds },
      groundY: pasture.groundY ?? 0,
      yaw: 0,
      wait: 0,
      animation: 0,
      phase: 0,
      walking: false,
      randomState: (world.seed + Math.imul(index + 1, 0x9e3779b9)) >>> 0
    };
    const cellX = Math.floor(mob.x);
    const cellZ = Math.floor(mob.z);
    if (!mob.groundY) {
      for (let y = SIZE[1] - 1; y >= 0; y--) {
        if (world.get(cellX, y, cellZ)) {
          mob.groundY = y + 1;
          break;
        }
      }
    }
    mob.phase = random(mob) * Math.PI * 2;
    if (!mob.groundY || !openAt(world, mob, mob.x, mob.z)) return [];
    chooseTarget(world, mob);
    mob.wait = random(mob) * 0.8;
    return [mob];
  });
}

export function stepMobs(world, mobs, elapsed) {
  const delta = Math.min(Math.max(elapsed, 0), 0.1);
  for (const mob of mobs) {
    mob.animation += delta;
    mob.walking = false;
    if (mob.wait > 0) {
      mob.wait = Math.max(0, mob.wait - delta);
      continue;
    }
    const dx = mob.targetX - mob.x;
    const dz = mob.targetZ - mob.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.12) {
      chooseTarget(world, mob);
      mob.wait = 0.5 + random(mob) * 1.3;
      continue;
    }
    mob.yaw = Math.atan2(dx, dz);
    const travel = Math.min(distance, mob.speed * delta);
    const nextX = mob.x + dx / distance * travel;
    const nextZ = mob.z + dz / distance * travel;
    if (!openAt(world, mob, nextX, nextZ)) {
      chooseTarget(world, mob);
      mob.wait = 0.25;
      continue;
    }
    mob.x = nextX;
    mob.z = nextZ;
    mob.walking = true;
  }
}

function materialTexture(THREE, color, pattern) {
  const size = 16;
  const data = new Uint8Array(size * size * 4);
  const hex = parseInt(color.slice(1), 16);
  const base = [hex >> 16, (hex >> 8) & 255, hex & 255];
  const random = (x, y) => {
    let value = Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let variation = (random(x, y) - 0.5) * 9;
    const patch = random(Math.floor(x / 3), Math.floor(y / 3));
    if (pattern === 'hide') variation += (patch - 0.5) * 18;
    if (pattern === 'cow') variation += patch > 0.64 ? -105 : (patch - 0.5) * 12;
    if (pattern === 'wool') variation += (patch - 0.5) * 25 + (x % 4 === 0 || y % 4 === 0 ? -7 : 4);
    if (pattern === 'feather') variation += (patch - 0.5) * 16 + ((x + Math.floor(y / 3)) % 5 === 0 ? -9 : 0);
    if (pattern === 'fabric') variation += (y % 4 === 0 ? -8 : 2) + (x % 5 === 0 ? 5 : 0);
    if (pattern === 'hair') variation += (random(Math.floor(x / 2), 0) - 0.5) * 22;
    if (pattern === 'iron') variation += (patch - 0.5) * 22 + (x === 0 || y === 0 ? -12 : 0);
    const index = (y * size + x) * 4;
    for (let channel = 0; channel < 3; channel++) {
      data[index + channel] = Math.max(0, Math.min(255, base[channel] + variation));
    }
    data[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

function addCube(THREE, group, materials, color, size, position, pattern = '') {
  const key = `${color}:${pattern}`;
  if (!materials.has(key)) {
    materials.set(key, pattern ?
      new THREE.MeshLambertMaterial({ map: materialTexture(THREE, color, pattern) }) :
      new THREE.MeshLambertMaterial({ color }));
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), materials.get(key));
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addLegs(THREE, group, materials, mob, color, offsets, length, pattern = '', footColor = color, width = 0.19) {
  const legs = [];
  for (const [x, z] of offsets) {
    const leg = new THREE.Group();
    leg.position.set(x, length + 0.06, z);
    addCube(THREE, leg, materials, color, [width, length, width], [0, -length / 2, 0], pattern);
    addCube(THREE, leg, materials, footColor, [width + 0.02, 0.1, width + 0.05], [0, -length + 0.05, 0.025]);
    group.add(leg);
    legs.push(leg);
  }
  mob.legs = legs;
}

function addArms(THREE, group, materials, color, handColor, x, top, length, width, pattern) {
  return [-1, 1].map(side => {
    const arm = new THREE.Group();
    arm.position.set(side * x, top, 0);
    addCube(THREE, arm, materials, color, [width, length, width], [0, -length / 2, 0], pattern);
    addCube(THREE, arm, materials, handColor, [width * 0.88, width * 0.8, width * 0.9],
      [0, -length + width * 0.15, 0], pattern === 'iron' ? 'iron' : 'hide');
    group.add(arm);
    return arm;
  });
}

export function createMobModel(THREE, mob) {
  const group = new THREE.Group();
  const materials = new Map();
  const cube = (color, size, position, pattern = '') => addCube(THREE, group, materials, color, size, position, pattern);
  let arms = [];
  const eyes = (color, y, z, offset = 0.2) => {
    cube(color, [0.07, 0.07, 0.035], [-offset, y, z]);
    cube(color, [0.07, 0.07, 0.035], [offset, y, z]);
  };

  if (mob.kind === 'pig') {
    cube('#e89b88', [0.72, 0.65, 0.96], [0, 0.8, 0], 'hide');
    cube('#eda893', [0.52, 0.48, 0.46], [0, 0.91, 0.63], 'hide');
    cube('#cb7768', [0.33, 0.23, 0.16], [0, 0.79, 0.91], 'hide');
    cube('#824e49', [0.055, 0.055, 0.02], [-0.08, 0.8, 1]);
    cube('#824e49', [0.055, 0.055, 0.02], [0.08, 0.8, 1]);
    cube('#d78575', [0.16, 0.2, 0.12], [-0.19, 1.23, 0.57], 'hide');
    cube('#d78575', [0.16, 0.2, 0.12], [0.19, 1.23, 0.57], 'hide');
    cube('#d78575', [0.09, 0.09, 0.2], [0, 0.93, -0.55], 'hide');
    eyes('#302b2a', 1.02, 0.87, 0.17);
    addLegs(THREE, group, materials, mob, '#d98a79',
      [[-0.25, -0.34], [0.25, -0.34], [-0.25, 0.34], [0.25, 0.34]], 0.38, 'hide', '#a7655e', 0.21);
  } else if (mob.kind === 'cow') {
    cube('#f0eee3', [0.76, 0.78, 1.12], [0, 0.88, 0], 'cow');
    cube('#f0eee3', [0.54, 0.57, 0.48], [0, 1.08, 0.67], 'hide');
    cube('#c68f7e', [0.38, 0.23, 0.18], [0, 0.88, 0.96], 'hide');
    cube('#704d44', [0.055, 0.05, 0.02], [-0.09, 0.89, 1.06]);
    cube('#704d44', [0.055, 0.05, 0.02], [0.09, 0.89, 1.06]);
    cube('#d9c49b', [0.12, 0.23, 0.12], [-0.23, 1.47, 0.6], 'hide');
    cube('#d9c49b', [0.12, 0.23, 0.12], [0.23, 1.47, 0.6], 'hide');
    cube('#d8d1c2', [0.2, 0.12, 0.16], [-0.34, 1.22, 0.58], 'hide');
    cube('#d8d1c2', [0.2, 0.12, 0.16], [0.34, 1.22, 0.58], 'hide');
    cube('#62594e', [0.09, 0.35, 0.09], [0, 0.83, -0.61], 'hair');
    eyes('#292a27', 1.13, 0.92, 0.2);
    addLegs(THREE, group, materials, mob, '#e8e4d7',
      [[-0.26, -0.38], [0.26, -0.38], [-0.26, 0.38], [0.26, 0.38]], 0.46, 'cow', '#62594e', 0.23);
  } else if (mob.kind === 'sheep') {
    cube('#eee8d8', [0.83, 0.82, 1], [0, 0.91, 0], 'wool');
    for (const [x, y, z] of [[-0.36, 1.17, 0], [0.36, 1.17, 0],
      [-0.28, 0.8, 0.4], [0.28, 0.8, 0.4], [-0.32, 0.8, -0.38], [0.32, 0.8, -0.38]]) {
      cube('#f5f0e4', [0.35, 0.34, 0.35], [x, y, z], 'wool');
    }
    cube('#a68b70', [0.43, 0.5, 0.42], [0, 1.02, 0.69], 'hide');
    cube('#f5f0e4', [0.48, 0.16, 0.44], [0, 1.32, 0.66], 'wool');
    cube('#bda287', [0.16, 0.13, 0.2], [-0.29, 1.07, 0.65], 'hide');
    cube('#bda287', [0.16, 0.13, 0.2], [0.29, 1.07, 0.65], 'hide');
    cube('#6e594b', [0.16, 0.07, 0.035], [0, 0.88, 0.91]);
    eyes('#302b2a', 1.1, 0.91, 0.15);
    addLegs(THREE, group, materials, mob, '#5e5147',
      [[-0.27, -0.35], [0.27, -0.35], [-0.27, 0.35], [0.27, 0.35]], 0.4, 'hide', '#483d36', 0.21);
  } else if (mob.kind === 'chicken') {
    cube('#f5f1e7', [0.58, 0.67, 0.62], [0, 0.72, 0], 'feather');
    cube('#fffaf0', [0.37, 0.39, 0.38], [0, 1.12, 0.29], 'feather');
    cube('#e4aa38', [0.2, 0.14, 0.2], [0, 1.04, 0.58]);
    cube('#c84d43', [0.17, 0.18, 0.16], [0, 1.4, 0.28]);
    cube('#e8ded0', [0.18, 0.35, 0.42], [-0.34, 0.75, 0], 'feather');
    cube('#e8ded0', [0.18, 0.35, 0.42], [0.34, 0.75, 0], 'feather');
    cube('#fffaf0', [0.4, 0.28, 0.16], [0, 0.99, -0.38], 'feather');
    cube('#c84d43', [0.1, 0.15, 0.08], [0, 0.91, 0.54]);
    eyes('#272826', 1.19, 0.5, 0.14);
    addLegs(THREE, group, materials, mob, '#d08b3f', [[-0.13, -0.12], [0.13, -0.12]], 0.27);
  } else if (mob.kind === 'fox') {
    cube('#c96c32', [0.5, 0.45, 0.8], [0, 0.49, 0], 'hide');
    cube('#dc8240', [0.47, 0.43, 0.4], [0, 0.7, 0.49], 'hide');
    cube('#f0d8bb', [0.3, 0.18, 0.2], [0, 0.59, 0.75], 'hide');
    cube('#292720', [0.11, 0.08, 0.08], [0, 0.65, 0.87]);
    for (const x of [-0.17, 0.17]) {
      cube('#b95b2e', [0.15, 0.25, 0.13], [x, 1, 0.43], 'hide');
      cube('#41352d', [0.1, 0.1, 0.14], [x, 1.08, 0.43], 'hide');
    }
    cube('#c96c32', [0.35, 0.32, 0.48], [0, 0.55, -0.6], 'hide');
    cube('#f0d8bb', [0.34, 0.3, 0.19], [0, 0.55, -0.91], 'hide');
    eyes('#272420', 0.78, 0.71, 0.14);
    addLegs(THREE, group, materials, mob, '#47372e',
      [[-0.17, -0.26], [0.17, -0.26], [-0.17, 0.26], [0.17, 0.26]], 0.25, 'hide', '#302922', 0.13);
  } else if (mob.kind === 'rabbit') {
    cube('#b7a99a', [0.38, 0.38, 0.55], [0, 0.38, 0], 'hide');
    cube('#cdbdaf', [0.32, 0.32, 0.3], [0, 0.59, 0.36], 'hide');
    for (const x of [-0.1, 0.1]) {
      cube('#c4b4a4', [0.1, 0.38, 0.1], [x, 0.94, 0.3], 'hide');
      cube('#d69e9a', [0.045, 0.25, 0.015], [x, 0.95, 0.36]);
    }
    cube('#efe6d9', [0.16, 0.16, 0.15], [0, 0.4, -0.33], 'wool');
    cube('#ce8e89', [0.07, 0.05, 0.03], [0, 0.54, 0.53]);
    eyes('#302b2a', 0.65, 0.52, 0.1);
    addLegs(THREE, group, materials, mob, '#a99a8b',
      [[-0.13, -0.18], [0.13, -0.18], [-0.13, 0.18], [0.13, 0.18]], 0.18, 'hide', '#9c8d80', 0.11);
  } else if (mob.kind === 'villager' && mob.haunted) {
    cube('#17191c', [0.62, 1.1, 0.42], [0, 1.02, 0], 'fabric');
    cube('#25282c', [0.74, 0.34, 0.5], [0, 0.48, 0], 'fabric');
    cube('#34383c', [0.42, 0.45, 0.4], [0, 1.66, 0.03], 'hide');
    cube('#111315', [0.48, 0.17, 0.46], [0, 1.86, 0], 'hair');
    cube('#111315', [0.13, 0.36, 0.4], [-0.2, 1.68, 0], 'hair');
    cube('#111315', [0.13, 0.27, 0.4], [0.19, 1.72, 0], 'hair');
    eyes('#d64343', 1.68, 0.25, 0.11);
    cube('#08090a', [0.16, 0.14, 0.04], [0, 1.49, 0.23]);
    arms = addArms(THREE, group, materials, '#17191c', '#34383c', 0.36, 1.36, 0.58, 0.18, 'fabric');
    addLegs(THREE, group, materials, mob, '#17191c',
      [[-0.14, 0], [0.14, 0]], 0.47, 'fabric', '#25282c', 0.22);
  } else if (mob.kind === 'villager') {
    cube(mob.pants, [0.48, 0.46, 0.32], [0, 0.52, 0], 'fabric');
    cube(mob.shirt, [0.56, 0.67, 0.34], [0, 1.08, 0], 'fabric');
    cube(mob.apron, [0.34, 0.48, 0.035], [0, 0.98, 0.19], 'fabric');
    cube('#766449', [0.37, 0.055, 0.045], [0, 0.87, 0.215], 'fabric');
    cube(mob.apron, [0.14, 0.12, 0.025], [0, 0.98, 0.218], 'fabric');
    arms = addArms(THREE, group, materials, mob.shirt, mob.skin, 0.36, 1.37, 0.58, 0.18, 'fabric');
    cube(mob.skin, [0.4, 0.42, 0.39], [0, 1.65, 0.02], 'hide');
    cube(mob.hair, [0.44, 0.16, 0.43], [0, 1.85, -0.01], 'hair');
    cube(mob.hair, [0.12, 0.3, 0.41], [-0.2, 1.69, -0.02], 'hair');
    cube(mob.hair, [0.12, 0.3, 0.41], [0.2, 1.69, -0.02], 'hair');
    cube(mob.hair, [0.13, 0.035, 0.03], [-0.1, 1.74, 0.23]);
    cube(mob.hair, [0.13, 0.035, 0.03], [0.1, 1.74, 0.23]);
    eyes('#302b2a', 1.67, 0.23, 0.105);
    cube(mob.skin, [0.075, 0.1, 0.08], [0, 1.57, 0.24], 'hide');
    cube('#825941', [0.1, 0.025, 0.025], [0, 1.49, 0.23]);
    addLegs(THREE, group, materials, mob, mob.pants,
      [[-0.14, 0], [0.14, 0]], 0.47, 'fabric', '#463c35', 0.22);
  } else {
    cube('#aebbb2', [0.9, 1.2, 0.64], [0, 1.43, 0], 'iron');
    cube('#c1ccc4', [0.72, 0.68, 0.66], [0, 2.34, 0.03], 'iron');
    arms = addArms(THREE, group, materials, '#87958c', '#738078', 0.62, 2.31, 1.42, 0.32, 'iron');
    cube('#c7d0c8', [0.7, 0.16, 0.045], [0, 1.84, 0.34], 'iron');
    cube('#7b887e', [0.28, 0.38, 0.1], [0, 2.14, 0.39], 'iron');
    cube('#53675a', [0.12, 0.48, 0.055], [-0.22, 1.5, 0.34]);
    cube('#53675a', [0.1, 0.32, 0.055], [0.18, 1.08, 0.34]);
    cube('#6f8e63', [0.22, 0.1, 0.06], [-0.17, 1.55, 0.35]);
    cube('#6f8e63', [0.19, 0.1, 0.06], [0.13, 1.12, 0.35]);
    cube('#574842', [0.12, 0.09, 0.045], [-0.2, 2.39, 0.38]);
    cube('#574842', [0.12, 0.09, 0.045], [0.2, 2.39, 0.38]);
    addLegs(THREE, group, materials, mob, '#738078',
      [[-0.25, 0], [0.25, 0]], 0.78, 'iron', '#66736b', 0.36);
  }
  return { group, legs: mob.legs, arms, materials };
}