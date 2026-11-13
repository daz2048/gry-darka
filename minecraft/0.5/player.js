export function createPlayer(world) {
  return { ...world.spawn, vy: 0, grounded: false };
}

export function collides(world, player) {
  const epsilon = 0.00001;
  for (let x = Math.floor(player.x - 0.3 + epsilon); x <= Math.floor(player.x + 0.3 - epsilon); x++) {
    for (let y = Math.floor(player.y + epsilon); y <= Math.floor(player.y + 1.75 - epsilon); y++) {
      for (let z = Math.floor(player.z - 0.3 + epsilon); z <= Math.floor(player.z + 0.3 - epsilon); z++) {
        const height = world.blockHeight(x, y, z);
        if (height && player.y < y + height - epsilon && player.y + 1.75 > y + epsilon) return true;
      }
    }
  }
  return false;
}

export function stepPlayer(world, player, input, yaw, dt) {
  const movementSpeed = input.overpowered ? 9 : 4.5;
  const jumpVelocity = input.overpowered ? 13 : 7.5;
  let forward = Number(Boolean(input.forward)) - Number(Boolean(input.back));
  let side = Number(Boolean(input.right)) - Number(Boolean(input.left));
  const length = Math.hypot(forward, side);
  if (length > 1) { forward /= length; side /= length; }
  if (input.jump && player.grounded) {
    player.vy = jumpVelocity;
    player.grounded = false;
  }
  player.vy = Math.max(-18, player.vy - 22 * dt);
  const motion = {
    x: (Math.cos(yaw) * side - Math.sin(yaw) * forward) * movementSpeed * dt,
    z: (-Math.sin(yaw) * side - Math.cos(yaw) * forward) * movementSpeed * dt,
    y: player.vy * dt
  };
  const steps = Math.max(1, Math.ceil(Math.max(...Object.values(motion).map(Math.abs)) / 0.15));
  player.grounded = false;
  for (let i = 0; i < steps; i++) {
    for (const axis of ['x', 'z', 'y']) {
      const old = player[axis];
      player[axis] += motion[axis] / steps;
      if (collides(world, player)) {
        player[axis] = old;
        if (axis === 'y') {
          if (motion.y < 0) player.grounded = true;
          player.vy = 0;
        }
      }
    }
  }
}
