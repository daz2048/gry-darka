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
  const gameEffects = new Set(['snake', 'zombie-defense', 'platformer', 'flappy']);
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
