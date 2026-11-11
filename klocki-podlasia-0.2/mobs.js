import { SIZE } from './world.js';

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
    bounds: { minX: 22, maxX: 27, minZ: 32.78, maxZ: 33.22 } },
  { kind: 'ironGolem', x: 13.5, z: 33.5, radius: 0.78, height: 2.85, speed: 0.32,
    bounds: { minX: 8, maxX: 19, minZ: 32.78, maxZ: 33.22 } },
  { kind: 'ironGolem', x: 50.5, z: 33.5, radius: 0.78, height: 2.85, speed: 0.32,
    bounds: { minX: 45, maxX: 57, minZ: 32.78, maxZ: 33.22 } }
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

const CHARACTERS = [...PASTURES, ...RESIDENTS];

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

function addCube(THREE, group, materials, color, size, position) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color }));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), materials.get(color));
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addLegs(THREE, group, materials, mob, color, offsets, length) {
  const legs = [];
  for (const [x, z] of offsets) {
    const leg = new THREE.Group();
    leg.position.set(x, length + 0.06, z);
    addCube(THREE, leg, materials, color, [0.17, length, 0.17], [0, -length / 2, 0]);
    group.add(leg);
    legs.push(leg);
  }
  mob.legs = legs;
}

export function createMobModel(THREE, mob) {
  const group = new THREE.Group();
  const materials = new Map();
  const cube = (color, size, position) => addCube(THREE, group, materials, color, size, position);
  const eyes = (color, y, z, offset = 0.2) => {
    cube(color, [0.07, 0.07, 0.035], [-offset, y, z]);
    cube(color, [0.07, 0.07, 0.035], [offset, y, z]);
  };

  if (mob.kind === 'pig') {
    cube('#e89b88', [0.96, 0.65, 0.72], [0, 0.8, 0]);
    cube('#eda893', [0.48, 0.48, 0.44], [0, 0.91, 0.47]);
    cube('#cb7768', [0.31, 0.22, 0.18], [0, 0.78, 0.77]);
    cube('#d78575', [0.16, 0.23, 0.12], [-0.16, 1.23, 0.42]);
    cube('#d78575', [0.16, 0.23, 0.12], [0.16, 1.23, 0.42]);
    eyes('#302b2a', 1.02, 0.68, 0.17);
    addLegs(THREE, group, materials, mob, '#b96f64',
      [[-0.31, -0.23], [0.31, -0.23], [-0.31, 0.23], [0.31, 0.23]], 0.38);
  } else if (mob.kind === 'cow') {
    cube('#f0eee3', [1.12, 0.78, 0.76], [0, 0.88, 0]);
    cube('#3d3935', [0.035, 0.34, 0.27], [-0.57, 0.91, -0.2]);
    cube('#3d3935', [0.035, 0.28, 0.25], [0.57, 0.77, 0.19]);
    cube('#3d3935', [0.3, 0.035, 0.28], [-0.24, 1.28, 0.1]);
    cube('#3d3935', [0.27, 0.035, 0.24], [0.28, 1.28, -0.19]);
    cube('#f0eee3', [0.5, 0.57, 0.46], [0, 1.08, 0.52]);
    cube('#c68f7e', [0.35, 0.23, 0.2], [0, 0.87, 0.83]);
    cube('#d9c49b', [0.12, 0.23, 0.12], [-0.23, 1.47, 0.45]);
    cube('#d9c49b', [0.12, 0.23, 0.12], [0.23, 1.47, 0.45]);
    eyes('#292a27', 1.13, 0.75, 0.2);
    addLegs(THREE, group, materials, mob, '#62594e',
      [[-0.37, -0.25], [0.37, -0.25], [-0.37, 0.25], [0.37, 0.25]], 0.46);
  } else if (mob.kind === 'sheep') {
    cube('#eee8d8', [1, 0.82, 0.83], [0, 0.91, 0]);
    for (const [x, y, z] of [[-0.36, 1.17, 0], [0.36, 1.17, 0],
      [-0.28, 0.8, 0.4], [0.28, 0.8, 0.4], [-0.32, 0.8, -0.38], [0.32, 0.8, -0.38]]) {
      cube('#f5f0e4', [0.35, 0.34, 0.35], [x, y, z]);
    }
    cube('#a68b70', [0.43, 0.5, 0.42], [0, 1.02, 0.55]);
    cube('#bda287', [0.13, 0.16, 0.18], [-0.27, 1.02, 0.53]);
    cube('#bda287', [0.13, 0.16, 0.18], [0.27, 1.02, 0.53]);
    eyes('#302b2a', 1.1, 0.77, 0.17);
    addLegs(THREE, group, materials, mob, '#5e5147',
      [[-0.31, -0.25], [0.31, -0.25], [-0.31, 0.25], [0.31, 0.25]], 0.4);
  } else if (mob.kind === 'chicken') {
    cube('#f5f1e7', [0.58, 0.67, 0.62], [0, 0.72, 0]);
    cube('#fffaf0', [0.37, 0.39, 0.38], [0, 1.12, 0.29]);
    cube('#e4aa38', [0.2, 0.14, 0.2], [0, 1.04, 0.58]);
    cube('#c84d43', [0.17, 0.18, 0.16], [0, 1.4, 0.28]);
    cube('#e8ded0', [0.18, 0.35, 0.42], [-0.34, 0.75, 0]);
    cube('#e8ded0', [0.18, 0.35, 0.42], [0.34, 0.75, 0]);
    eyes('#272826', 1.19, 0.46, 0.14);
    addLegs(THREE, group, materials, mob, '#d08b3f', [[-0.13, -0.12], [0.13, -0.12]], 0.27);
  } else if (mob.kind === 'villager') {
    cube(mob.pants, [0.48, 0.46, 0.32], [0, 0.52, 0]);
    cube(mob.shirt, [0.56, 0.67, 0.34], [0, 1.08, 0]);
    cube(mob.apron, [0.34, 0.48, 0.035], [0, 0.98, 0.19]);
    cube(mob.shirt, [0.17, 0.58, 0.2], [-0.36, 1.08, 0]);
    cube(mob.shirt, [0.17, 0.58, 0.2], [0.36, 1.08, 0]);
    cube(mob.skin, [0.15, 0.13, 0.17], [-0.36, 0.75, 0]);
    cube(mob.skin, [0.15, 0.13, 0.17], [0.36, 0.75, 0]);
    cube(mob.skin, [0.4, 0.42, 0.39], [0, 1.65, 0.02]);
    cube(mob.hair, [0.44, 0.16, 0.43], [0, 1.85, -0.01]);
    cube(mob.hair, [0.12, 0.3, 0.41], [-0.2, 1.69, -0.02]);
    cube(mob.hair, [0.12, 0.3, 0.41], [0.2, 1.69, -0.02]);
    eyes('#302b2a', 1.67, 0.22, 0.105);
    cube('#825941', [0.07, 0.12, 0.08], [0, 1.55, 0.24]);
    addLegs(THREE, group, materials, mob, mob.pants,
      [[-0.14, 0], [0.14, 0]], 0.47);
  } else {
    cube('#aebbb2', [0.9, 1.2, 0.64], [0, 1.43, 0]);
    cube('#c1ccc4', [0.72, 0.68, 0.66], [0, 2.34, 0.03]);
    cube('#87958c', [0.32, 1.42, 0.4], [-0.62, 1.6, 0]);
    cube('#87958c', [0.32, 1.42, 0.4], [0.62, 1.6, 0]);
    cube('#7b887e', [0.28, 0.38, 0.1], [0, 2.14, 0.39]);
    cube('#53675a', [0.12, 0.48, 0.055], [-0.22, 1.5, 0.34]);
    cube('#53675a', [0.1, 0.32, 0.055], [0.18, 1.08, 0.34]);
    cube('#46564c', [0.1, 0.09, 0.045], [-0.2, 2.39, 0.38]);
    cube('#46564c', [0.1, 0.09, 0.045], [0.2, 2.39, 0.38]);
    addLegs(THREE, group, materials, mob, '#738078',
      [[-0.25, -0.12], [0.25, -0.12], [-0.25, 0.12], [0.25, 0.12]], 0.78);
  }
  return { group, legs: mob.legs, materials };
}