(() => {
  const columns = 24;
  const rows = 8;
  const path = [];
  for (let x = 0; x < columns; x++) path.push([x, 0]);
  for (let y = 1; y < rows; y++) {
    if (y % 2) {
      for (let x = columns - 1; x >= 1; x--) path.push([x, y]);
    } else {
      for (let x = 1; x < columns; x++) path.push([x, y]);
    }
  }
  for (let y = rows - 1; y >= 1; y--) path.push([0, y]);

  const flip = document.querySelector('.brand-flip');
  const faces = [...flip.querySelectorAll('.brand-face')];
  const preview = document.getElementById('banner-preview');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const gameEffects = new Set(gameBannerEffects);
  const scenes = [...faces, preview].map(face => ({
    face,
    canvas: face.querySelector('.banner-snake'),
    head: 6,
    length: 5,
    food: 17,
    frame: 0,
    drawnEffect: 'snake',
  }));
  const visible = new Set();
  let timer = null;

  function drawSnake(scene) {
    const ctx = scene.canvas.getContext('2d');
    const width = scene.canvas.width / columns;
    const height = scene.canvas.height / rows;
    ctx.clearRect(0, 0, scene.canvas.width, scene.canvas.height);
    ctx.fillStyle = 'rgba(104, 237, 255, .09)';
    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        ctx.fillRect(x * width + width / 2, y * height + height / 2, 1, 1);
      }
    }
    const [foodX, foodY] = path[scene.food];
    ctx.fillStyle = '#ff698b';
    ctx.fillRect(foodX * width + width * .3, foodY * height + height * .25, width * .4, height * .5);
    for (let i = scene.length - 1; i >= 0; i--) {
      const [x, y] = path[(scene.head - i + path.length) % path.length];
      ctx.fillStyle = i === 0 ? '#d9ff9b' : '#64db93';
      ctx.fillRect(x * width + 2, y * height + 2, width - 4, height - 4);
    }
  }

  function drawGame(scene, effect) {
    if (effect === 'snake') {
      drawSnake(scene);
      return;
    }
    const ctx = scene.canvas.getContext('2d');
    const frame = scene.frame;
    ctx.clearRect(0, 0, 720, 160);
    const rect = (color, x, y, width, height) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
    };
    if (effect === 'zombie-defense') {
      rect('#243a50', 0, 127, 720, 33);
      rect('#617086', 632, 64, 70, 63);
      rect('#a4c5d3', 646, 75, 12, 12);
      for (let i = 0; i < 3; i++) {
        const x = 570 + i * 18;
        rect('#f1c99a', x, 83, 10, 10);
        rect('#6aaed2', x - 2, 94, 14, 21);
        rect('#dceeff', x - 11, 99, 12, 4);
        rect('#263b55', x, 115, 10, 12);
      }
      for (let i = 0; i < 3; i++) {
        const x = (frame * 7 + i * 170) % 500;
        if (x >= 400) continue;
        const bob = frame % 2;
        rect('#8bd477', x, 87 + bob, 12, 12);
        rect('#527d63', x - 2, 99 + bob, 16, 20);
        rect('#a2da8c', x + 12, 102 + bob, 9, 4);
        rect('#435069', x, 119 + bob, 12, 8);
        rect('#ffe99c', 540 - x * .35, 102, 10, 3);
      }
    } else if (effect === 'platformer') {
      rect('#597b79', 0, 130, 720, 30);
      rect('#9edb83', 0, 130, 720, 5);
      for (let i = 0; i < 4; i++) {
        const x = ((i * 360 - frame * 9 + 520) % 1440 + 1440) % 1440 - 360;
        rect('#d49e63', x, 113, 30, 17);
        if (x + 11 > 169) rect('#f9d55f', x + 11, 89, 8, 12);
      }
      const obstacle = ((-frame * 9 + 520) % 360 + 360) % 360;
      const jump = obstacle < 220 && obstacle > 100
        ? Math.sin((220 - obstacle) / 120 * Math.PI) * 38 : 0;
      rect('#f5bf83', 153, 98 - jump, 14, 12);
      rect('#fa7777', 151, 94 - jump, 18, 5);
      rect('#69b0ea', 151, 110 - jump, 18, 14);
      rect('#263b55', 153, 124 - jump, 14, 6);
    } else if (effect === 'flappy') {
      rect('#335b72', 0, 130, 720, 30);
      rect('#b6d57c', 0, 130, 720, 5);
      for (let i = 0; i < 3; i++) {
        const x = (i * 250 - frame * 8 + 1000) % 750;
        const gapTop = 42 + (i % 2) * 13;
        rect('#62bb76', x, 0, 34, gapTop);
        rect('#83d98d', x - 4, gapTop - 8, 42, 8);
        rect('#62bb76', x, gapTop + 51, 34, 79 - gapTop);
        rect('#83d98d', x - 4, gapTop + 51, 42, 8);
      }
      const y = 69 + Math.sin(frame / 4) * 9;
      rect('#ffdd67', 145, y, 22, 16);
      rect('#fff4bb', 150, y + 4, 8, 5);
      rect('#ff935d', 167, y + 6, 8, 4);
      rect('#263b55', 161, y + 3, 3, 3);
    } else if (effect === 'archers') {
      rect('#405b6d', 45, 122, 115, 10);
      rect('#405b6d', 560, 122, 115, 10);
      for (const [x, color, direction] of [[85, '#6dd9bf', 1], [614, '#ed9869', -1]]) {
        rect('#f1c99a', x, 78, 13, 13);
        rect(color, x - 2, 91, 17, 21);
        rect('#2f435c', x, 112, 6, 10);
        rect('#2f435c', x + 9, 112, 6, 10);
        rect('#dfbd7d', x + (direction > 0 ? 20 : -12), 88, 4, 25);
        rect('#f1c99a', x + (direction > 0 ? 13 : -8), 96, 8, 4);
      }
      const progress = (frame % 25) / 25;
      const fromLeft = Math.floor(frame / 25) % 2 === 0;
      const x = fromLeft ? 112 + progress * 500 : 608 - progress * 500;
      const y = 97 - Math.sin(progress * Math.PI) * 55;
      rect('#fff2c5', x, y, 18, 3);
      rect('#ed9869', fromLeft ? x + 15 : x, y - 2, 3, 7);
    } else if (effect === 'castle-duel') {
      rect('#40515d', 0, 130, 720, 30);
      for (const x of [35, 595]) {
        rect('#8794a2', x, 79, 90, 51);
        rect('#aab7bf', x - 5, 65, 27, 65);
        rect('#aab7bf', x + 68, 65, 27, 65);
        rect('#d7dce0', x - 5, 59, 9, 6);
        rect('#d7dce0', x + 13, 59, 9, 6);
        rect('#d7dce0', x + 68, 59, 9, 6);
        rect('#d7dce0', x + 86, 59, 9, 6);
        rect('#344456', x + 36, 105, 18, 25);
      }
      const phase = frame % 34;
      const fromLeft = Math.floor(frame / 34) % 2 === 0;
      if (phase < 28) {
        const progress = phase / 28;
        const x = fromLeft ? 128 + progress * 464 : 592 - progress * 464;
        const y = 102 - Math.sin(progress * Math.PI) * 72;
        rect('#ffe5a0', x, y, 7, 7);
      } else {
        const x = fromLeft ? 590 : 116;
        rect('#40515d', x, 87, 10, 10);
        if (phase < 31) {
          rect('#ffd57e', x, 85, 10, 10);
          rect('#fa9c6d', x - 5, 89, 20, 3);
        }
      }
    } else if (effect === 'minecraft-building') {
      rect('#678862', 0, 130, 720, 30);
      rect('#9cd578', 0, 130, 720, 5);
      const blocks = [
        [270, 110], [290, 110], [310, 110], [330, 110], [350, 110],
        [270, 90], [350, 90], [270, 70], [350, 70],
        [270, 50], [290, 50], [310, 50], [330, 50], [350, 50],
      ];
      const count = Math.min(Math.floor((frame % 80) / 4), blocks.length);
      for (const [x, y] of blocks.slice(0, count)) {
        rect(y === 50 ? '#c9795d' : '#d6b486', x, y, 19, 19);
        rect(y === 50 ? '#edaa82' : '#f1d2a4', x + 2, y + 2, 15, 2);
      }
      const x = 225 + (frame % 4) * 4;
      rect('#eab98a', x, 91, 13, 13);
      rect('#69c1cc', x - 2, 104, 17, 15);
      rect('#374d72', x, 119, 13, 11);
      rect('#d6b486', x + 20, 106, 9, 9);
    } else if (effect === 'space-invaders') {
      const cycle = frame % 120;
      const defeated = Math.floor(cycle / 10);
      const target = 11 - Math.min(defeated, 11);
      const playerX = 175 + (target % 6) * 72;
      const descent = Math.floor(cycle / 30) * 4;
      for (let i = 0; i < 12; i++) {
        if (i > target) continue;
        const x = 175 + (i % 6) * 72;
        const y = 24 + Math.floor(i / 6) * 25 + descent;
        rect('#91dd9e', x, y, 18, 9);
        rect('#91dd9e', x - 3, y + 6, 24, 5);
        rect('#273b54', x + 4, y + 3, 3, 3);
        rect('#273b54', x + 11, y + 3, 3, 3);
      }
      rect('#82cce9', playerX - 4, 124, 26, 8);
      rect('#d2f3ff', playerX + 6, 117, 6, 7);
      const targetY = 30 + Math.floor(target / 6) * 25 + descent;
      rect('#fff0a0', playerX + 8, 115 - (cycle % 10) * (115 - targetY) / 9, 3, 7);
    } else if (effect === 'pong') {
      const phase = frame % 80;
      const x = 70 + (phase <= 40 ? phase : 80 - phase) * 14.3;
      const wave = frame % 32;
      const y = 22 + (wave <= 16 ? wave : 32 - wave) * 6;
      rect('#3d6270', 358, 0, 3, 160);
      rect('#75d6d1', 62, y - 13, 8, 32);
      rect('#f6b77c', 650, y - 13, 8, 32);
      rect('#fff0bf', x, y, 8, 8);
    } else if (effect === 'racing') {
      rect('#3b5360', 0, 15, 720, 130);
      rect('#e8d6a5', 0, 15, 720, 4);
      rect('#e8d6a5', 0, 141, 720, 4);
      for (const y of [57, 101]) {
        for (let x = -80; x < 720; x += 100) {
          rect('#a3b2b0', x + (frame * 13 % 100), y, 48, 3);
        }
      }
      for (const [lane, color, speed] of [[0, '#f08080', 5], [1, '#82cdea', 8], [2, '#f6d078', 6]]) {
        const x = 130 + (frame * speed + lane * 120) % 420;
        const y = 25 + lane * 44;
        rect(color, x, y + 3, 42, 19);
        rect('#ceeaf0', x + 25, y + 6, 10, 6);
        rect('#263b55', x + 6, y, 10, 4);
        rect('#263b55', x + 25, y, 10, 4);
        rect('#263b55', x + 6, y + 22, 10, 4);
        rect('#263b55', x + 25, y + 22, 10, 4);
      }
    } else if (effect === 'breakout') {
      const cycle = frame % 432;
      const shots = Math.floor(cycle / 24);
      const ballX = at => {
        const phase = at % 80;
        return 180 + (phase <= 40 ? phase : 80 - phase) * 8;
      };
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 7; col++) {
          let hit = false;
          for (let shot = 0; shot < shots; shot++) {
            const hitColumn = Math.floor((ballX(shot * 24 + 12) - 160) / 50);
            if (hitColumn === col && 2 - Math.floor(shot / 6) === row) hit = true;
          }
          if (!hit) rect(['#f0889b', '#f4c777', '#79d4c3'][row], 160 + col * 50, 20 + row * 11, 45, 8);
        }
      }
      const phase = cycle % 24;
      const x = ballX(cycle);
      const impactY = 42 - Math.floor(shots / 6) * 11;
      const y = 124 - (phase <= 12 ? phase : 24 - phase) * (124 - impactY) / 12;
      rect('#d6f4ff', x - 18, 137, 42, 6);
      rect('#fff1bb', x, y, 7, 7);
    }
  }

  function advance(scene) {
    const effect = scene.face.dataset.effect;
    if (effect !== 'snake') {
      scene.frame++;
      drawGame(scene, effect);
      return;
    }
    scene.head = (scene.head + 1) % path.length;
    if (scene.head === scene.food) {
      scene.length = Math.min(scene.length + 1, 16);
      scene.food = (scene.head + 8 + Math.floor(Math.random() * 25)) % path.length;
    }
    drawSnake(scene);
  }

  function activeScenes() {
    const currentFace = faces[flip.classList.contains('is-flipped') ? 1 : 0];
    return scenes.filter(scene => gameEffects.has(scene.face.dataset.effect) &&
      visible.has(scene.face === preview ? preview : flip) &&
      (scene.face === preview || scene.face === currentFace));
  }

  function sync() {
    for (const scene of scenes) {
      const effect = scene.face.dataset.effect;
      if (gameEffects.has(effect) && scene.drawnEffect !== effect) {
        scene.drawnEffect = effect;
        scene.frame = 0;
        drawGame(scene, effect);
      }
    }
    const running = !document.hidden && !motion.matches && activeScenes().length > 0;
    if (running && timer === null) {
      timer = setInterval(() => activeScenes().forEach(advance), 180);
    } else if (!running && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  scenes.forEach(drawSnake);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    sync();
  });
  observer.observe(flip);
  observer.observe(preview);
  const changes = new MutationObserver(sync);
  changes.observe(flip, { attributes: true, attributeFilter: ['class'] });
  for (const scene of scenes) {
    changes.observe(scene.face, { attributes: true, attributeFilter: ['data-effect'] });
  }
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
})();
