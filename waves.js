(function initWaves() {
  const svg = document.getElementById('wave-svg');
  const hero = document.getElementById('hero');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!svg || !hero || prefersReducedMotion) return;

  const xGap = Number(svg.getAttribute('data-wave-x-gap')) || 24;
  const yGap = Number(svg.getAttribute('data-wave-y-gap')) || 18;
  const stroke = svg.getAttribute('data-wave-stroke') || 'rgba(232,224,212,0.065)';
  const strokeWidth = svg.getAttribute('data-wave-stroke-width') || '1.1';
  const amplitudeX = Number(svg.getAttribute('data-wave-amplitude-x')) || 5;
  const amplitudeY = Number(svg.getAttribute('data-wave-amplitude-y')) || 2.5;
  const cursorLimit = Number(svg.getAttribute('data-wave-cursor-limit')) || 18;
  const cursorForce = Number(svg.getAttribute('data-wave-cursor-force')) || 0.00014;

  const perm = new Uint8Array(512);
  const p = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30,
    69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94,
    252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171,
    168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60,
    211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1,
    216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
    164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118,
    126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170,
    213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39,
    253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49,
    192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
    138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
  ];

  for (let i = 0; i < 256; i += 1) {
    perm[i] = p[i];
    perm[i + 256] = p[i];
  }

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a, b, t) {
    return a + t * (b - a);
  }

  function grad(h, x, y) {
    const hash = h & 3;
    const u = hash < 2 ? x : y;
    const v = hash < 2 ? y : x;
    return ((hash & 1) ? -u : u) + ((hash & 2) ? -v : v);
  }

  function noise2(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const a = perm[X] + Y;
    const b = perm[X + 1] + Y;

    return lerp(
      lerp(grad(perm[a], xf, yf), grad(perm[b], xf - 1, yf), u),
      lerp(grad(perm[a + 1], xf, yf - 1), grad(perm[b + 1], xf - 1, yf - 1), u),
      v
    );
  }

  const mouse = { x: -200, y: 0, lx: 0, ly: 0, sx: -200, sy: 0, v: 0, vs: 0, a: 0 };
  let paths = [];
  let lines = [];
  let bounding = null;

  function resize() {
    bounding = hero.getBoundingClientRect();
    svg.setAttribute('width', bounding.width);
    svg.setAttribute('height', bounding.height);
    svg.setAttribute('viewBox', `0 0 ${bounding.width} ${bounding.height}`);
    buildLines();
  }

  function buildLines() {
    paths.forEach((path) => path.remove());
    paths = [];
    lines = [];
    if (!bounding) return;

    const width = bounding.width;
    const height = bounding.height;
    const cols = Math.ceil((width + 200) / xGap);
    const rows = Math.ceil((height + 40) / yGap);
    const xStart = (width - xGap * cols) / 2;
    const yStart = (height - yGap * rows) / 2;

    for (let i = 0; i < cols; i += 1) {
      const pts = [];

      for (let j = 0; j < rows; j += 1) {
        pts.push({
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wx: 0,
          wy: 0,
          cx: 0,
          cy: 0,
          cvx: 0,
          cvy: 0
        });
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', stroke);
      path.setAttribute('stroke-width', strokeWidth);
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
      paths.push(path);
      lines.push(pts);
    }
  }

  function movePoints(time) {
    lines.forEach((pts) => {
      pts.forEach((point) => {
        const n = noise2((point.x + time * 0.012) * 0.0028, (point.y + time * 0.005) * 0.0018) * 9;
        point.wx = Math.cos(n) * amplitudeX;
        point.wy = Math.sin(n) * amplitudeY;

        const dx = point.x - mouse.sx;
        const dy = point.y - mouse.sy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const limit = Math.max(160, mouse.vs);

        if (distance < limit) {
          const strength = 1 - distance / limit;
          const force = Math.cos(distance * 0.001) * strength;
          point.cvx += Math.cos(mouse.a) * force * limit * mouse.vs * cursorForce;
          point.cvy += Math.sin(mouse.a) * force * limit * mouse.vs * cursorForce;
        }

        point.cvx += (0 - point.cx) * 0.012;
        point.cvy += (0 - point.cy) * 0.012;
        point.cvx *= 0.94;
        point.cvy *= 0.94;
        point.cx += point.cvx;
        point.cy += point.cvy;
        point.cx = Math.max(-cursorLimit, Math.min(cursorLimit, point.cx));
        point.cy = Math.max(-cursorLimit, Math.min(cursorLimit, point.cy));
      });
    });
  }

  function draw() {
    lines.forEach((pts, index) => {
      if (!paths[index] || pts.length < 2) return;

      const first = pts[0];
      let d = `M ${first.x + first.wx} ${first.y + first.wy}`;

      for (let j = 1; j < pts.length; j += 1) {
        const point = pts[j];
        d += ` L ${point.x + point.wx + point.cx} ${point.y + point.wy + point.cy}`;
      }

      paths[index].setAttribute('d', d);
    });
  }

  function tick(time) {
    mouse.sx += (mouse.x - mouse.sx) * 0.1;
    mouse.sy += (mouse.y - mouse.sy) * 0.1;
    const dx = mouse.x - mouse.lx;
    const dy = mouse.y - mouse.ly;
    mouse.v = Math.sqrt(dx * dx + dy * dy);
    mouse.vs += (mouse.v - mouse.vs) * 0.1;
    mouse.vs = Math.min(100, mouse.vs);
    mouse.lx = mouse.x;
    mouse.ly = mouse.y;
    mouse.a = Math.atan2(dy, dx);
    movePoints(time);
    draw();
    requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', (event) => {
    if (!bounding) return;
    mouse.x = event.clientX - bounding.left;
    mouse.y = event.clientY - bounding.top;
  });

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(tick);
})();
