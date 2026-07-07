/* AllGoMath landing visualization engine -- pure canvas-2D, no deps.
   Ported behavior-preserving from allgoamth-refactor/viz.js (SP-12). */

const ACC = "#c8ff00";
const ACC_DEEP = "#7f9e1a";

function setup(canvas) {
  const ctx = canvas.getContext("2d");
  let dpr = 1, W = 0, H = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || canvas.parentElement.clientWidth;
    H = canvas.clientHeight || canvas.parentElement.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  return {
    ctx,
    get W() { return W; },
    get H() { return H; },
    resize,
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

/* ---------------- Saddle wireframe (hero + plotter) -------------- */
function makeSaddle(canvas, opts) {
  opts = opts || {};
  const s = setup(canvas);
  const ctx = s.ctx;
  const N = opts.density || 26;
  const range = 2.4;
  let raf = null, running = false;
  let rotX = opts.rotX != null ? opts.rotX : -0.95;
  let rotY = opts.rotY != null ? opts.rotY : 0.5;
  let tgX = rotX, tgY = rotY;
  let autoSpin = opts.autoSpin != null ? opts.autoSpin : 0.0016;
  let baseScale = opts.scale || 1;
  let mx = 0, my = 0;
  const surfZ = (x, y) => (x * x - y * y) * 0.42;

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    mx = nx; my = ny;
  }
  if (opts.parallax) window.addEventListener("mousemove", onMove);

  function project(x, y, z) {
    // rotate Y
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    let x1 = x * cy - z * sy, z1 = x * sy + z * cy, y1 = y;
    // rotate X
    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    let y2 = y1 * cx - z1 * sx, z2 = y1 * sx + z1 * cx, x2 = x1;
    const unit = Math.min(s.W, s.H) / (range * 2) * 0.82 * baseScale;
    const persp = 1 / (1 + z2 * 0.10);
    return {
      sx: s.W * (0.5 + (opts.xShift || 0)) + x2 * unit * persp,
      sy: s.H / 2 - y2 * unit * persp + s.H * (opts.yShift || 0),
      depth: z2,
    };
  }

  function frame() {
    if (!running) return;
    rotY += autoSpin;
    if (opts.parallax) {
      tgX = (opts.rotX != null ? opts.rotX : -0.95) + my * 0.35;
      tgY = rotY + mx * 0.0; // spin handles y; parallax tilts x
      rotX = lerp(rotX, tgX, 0.05);
    }
    ctx.clearRect(0, 0, s.W, s.H);

    const step = (range * 2) / N;
    // precompute grid
    const grid = [];
    for (let i = 0; i <= N; i++) {
      const row = [];
      const x = -range + i * step;
      for (let j = 0; j <= N; j++) {
        const y = -range + j * step;
        const z = surfZ(x, y);
        const p = project(x, y, z);
        p.zval = z;
        row.push(p);
      }
      grid.push(row);
    }
    function colorFor(z, depth) {
      // height-based lime intensity + depth fade
      const t = Math.max(0, Math.min(1, (z + 1.2) / 2.4));
      const a = Math.max(0.06, Math.min(0.85, 0.5 + depth * 0.18)) * (opts.alpha || 1);
      const g = Math.round(lerp(90, 255, t));
      const r = Math.round(lerp(40, 200, t));
      return `rgba(${r},${g},20,${a})`;
    }
    ctx.lineWidth = opts.lineWidth || 1;
    // u-lines
    for (let i = 0; i <= N; i++) {
      ctx.beginPath();
      for (let j = 0; j <= N; j++) {
        const p = grid[i][j];
        if (j === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = colorFor(grid[i][Math.floor(N / 2)].zval, grid[i][Math.floor(N / 2)].depth);
      ctx.stroke();
    }
    // v-lines
    for (let j = 0; j <= N; j++) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const p = grid[i][j];
        if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = colorFor(grid[Math.floor(N / 2)][j].zval, grid[Math.floor(N / 2)][j].depth);
      ctx.stroke();
    }
    // saddle point marker
    const c = project(0, 0, 0);
    ctx.fillStyle = ACC;
    ctx.beginPath(); ctx.arc(c.sx, c.sy, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(200,255,0,0.25)";
    ctx.beginPath(); ctx.arc(c.sx, c.sy, 8, 0, Math.PI * 2); ctx.stroke();

    raf = requestAnimationFrame(frame);
  }
  function onResize() { s.resize(); }
  return {
    start() { if (running) return; running = true; window.addEventListener("resize", onResize); frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); if (opts.parallax) window.removeEventListener("mousemove", onMove); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Fourier - epicycles ---------------- */
function makeFourier(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  const path = [];
  const K = 7;
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    const cx = s.W * 0.34, cy = s.H * 0.5;
    const baseR = Math.min(s.W, s.H) * 0.20;
    let x = cx, y = cy;
    ctx.lineWidth = 1;
    for (let k = 0; k < K; k++) {
      const n = 2 * k + 1;
      const r = baseR * (4 / (n * Math.PI));
      const px = x, py = y;
      x += r * Math.cos(n * t);
      y += r * Math.sin(n * t);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(200,255,0,0.5)";
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    }
    path.unshift(y);
    if (path.length > Math.round(s.W * 0.5)) path.pop();
    // connector
    ctx.strokeStyle = "rgba(200,255,0,0.3)";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(s.W * 0.5, path[0]); ctx.stroke();
    // wave
    ctx.strokeStyle = ACC; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const X = s.W * 0.5 + i;
      if (i === 0) ctx.moveTo(X, path[i]); else ctx.lineTo(X, path[i]);
    }
    ctx.stroke();
    ctx.fillStyle = ACC;
    ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    t += 0.03;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; path.length = 0; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Fractal - swaying recursive tree ---------------- */
function makeFractal(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  function branch(x, y, len, ang, depth, sway) {
    if (depth === 0 || len < 3) return;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    const lit = depth / 9;
    ctx.strokeStyle = `rgba(${Math.round(lerp(60,200,lit))},${Math.round(lerp(110,255,lit))},20,${0.25 + lit * 0.65})`;
    ctx.lineWidth = Math.max(0.6, depth * 0.45);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    const spread = 0.42 + Math.sin(t + depth) * 0.06 * sway;
    branch(x2, y2, len * 0.74, ang - spread, depth - 1, sway);
    branch(x2, y2, len * 0.74, ang + spread, depth - 1, sway);
  }
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    const sway = 1 + Math.sin(t * 0.6) * 0.5;
    branch(s.W / 2, s.H * 0.92, Math.min(s.W, s.H) * 0.20, -Math.PI / 2, 9, sway);
    t += 0.02;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Monte Carlo - pi estimate ---------------- */
function makeMonteCarlo(canvas, onStat) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false;
  let inside = 0, total = 0, pts = [];
  function reset() { inside = 0; total = 0; pts = []; }
  function frame() {
    if (!running) return;
    s.resize();
    const m = Math.min(s.W, s.H) * 0.78;
    const ox = (s.W - m) / 2, oy = (s.H - m) / 2;
    ctx.clearRect(0, 0, s.W, s.H);
    // frame + circle
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, m, m);
    ctx.beginPath(); ctx.arc(ox + m / 2, oy + m / 2, m / 2, 0, Math.PI * 2); ctx.stroke();
    // add a batch
    for (let i = 0; i < 12; i++) {
      const x = Math.random(), y = Math.random();
      const d = Math.hypot(x - 0.5, y - 0.5);
      const ins = d <= 0.5;
      if (ins) inside++; total++;
      pts.push([ox + x * m, oy + y * m, ins]);
    }
    if (pts.length > 1400) { reset(); }
    for (const p of pts) {
      ctx.fillStyle = p[2] ? "rgba(200,255,0,0.85)" : "rgba(255,255,255,0.16)";
      ctx.fillRect(p[0], p[1], 2, 2);
    }
    if (onStat && total) onStat((4 * inside / total).toFixed(4), total);
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; reset(); frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Bezier - cubic + de Casteljau ---------------- */
function makeBezier(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  const seeds = [
    [0.12, 0.75, 1.3], [0.32, 0.18, 1.7], [0.7, 0.85, 1.1], [0.9, 0.28, 1.9],
  ];
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    const pad = Math.min(s.W, s.H) * 0.14;
    const P = seeds.map((sd, i) => {
      const wob = Math.sin(t * sd[2] + i) * 0.07;
      return [
        (sd[0] + wob) * (s.W - pad * 2) + pad,
        (sd[1] + Math.cos(t * sd[2] + i) * 0.07) * (s.H - pad * 2) + pad,
      ];
    });
    // control polygon
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(P[i][0], P[i][1]);
    ctx.stroke(); ctx.setLineDash([]);
    // curve
    function bez(u) {
      const mu = 1 - u;
      const a = mu * mu * mu, b = 3 * mu * mu * u, c = 3 * mu * u * u, d = u * u * u;
      return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0],
              a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
    }
    ctx.strokeStyle = ACC; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let u = 0; u <= 1.001; u += 0.02) { const p = bez(u); u === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
    ctx.stroke();
    // de Casteljau at tt
    const tt = (Math.sin(t * 0.8) + 1) / 2;
    function lerpP(a, b, u) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; }
    const ab = lerpP(P[0], P[1], tt), bc = lerpP(P[1], P[2], tt), cd = lerpP(P[2], P[3], tt);
    const abc = lerpP(ab, bc, tt), bcd = lerpP(bc, cd, tt);
    const pt = lerpP(abc, bcd, tt);
    ctx.strokeStyle = "rgba(200,255,0,0.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ab[0], ab[1]); ctx.lineTo(bc[0], bc[1]); ctx.lineTo(cd[0], cd[1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(abc[0], abc[1]); ctx.lineTo(bcd[0], bcd[1]); ctx.stroke();
    // control points
    for (const p of P) {
      ctx.fillStyle = "#0a0b0c"; ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = ACC;
    ctx.beginPath(); ctx.arc(pt[0], pt[1], 4.5, 0, Math.PI * 2); ctx.fill();
    t += 0.018;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Perlin-style flow field ---------------- */
function makeFlow(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0, parts = [];
  function field(x, y) {
    return Math.sin(x * 0.010 + t) * 1.5 + Math.cos(y * 0.010 - t * 0.7) * 1.5 + Math.sin((x + y) * 0.005);
  }
  function spawn() { return { x: Math.random() * s.W, y: Math.random() * s.H, life: 30 + Math.random() * 120 }; }
  function onResize() { s.resize(); ctx.fillStyle = "#0a0b0c"; ctx.fillRect(0, 0, s.W, s.H); }
  function frame() {
    if (!running) return;
    if (parts.length < 280) for (let i = 0; i < 8; i++) parts.push(spawn());
    ctx.fillStyle = "rgba(10,11,12,0.085)";
    ctx.fillRect(0, 0, s.W, s.H);
    ctx.lineWidth = 1.1;
    for (const p of parts) {
      const a = field(p.x, p.y) * Math.PI;
      const nx = p.x + Math.cos(a) * 1.7, ny = p.y + Math.sin(a) * 1.7;
      const lit = (Math.sin(a * 0.5) + 1) / 2;
      ctx.strokeStyle = `rgba(${Math.round(lerp(70, 200, lit))},${Math.round(lerp(120, 255, lit))},20,0.5)`;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
      p.x = nx; p.y = ny; p.life--;
      if (p.life < 0 || p.x < 0 || p.x > s.W || p.y < 0 || p.y > s.H) Object.assign(p, spawn());
    }
    t += 0.004;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; parts = []; ctx.fillStyle = "#0a0b0c"; ctx.fillRect(0, 0, s.W, s.H); window.addEventListener("resize", onResize); frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Cellular automata - Game of Life ---------------- */
function makeLife(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, frames = 0;
  let cols, rows, cell, grid, age, prevPop = -1, stable = 0;
  function init() {
    cell = Math.max(8, Math.round(Math.min(s.W, s.H) / 26));
    cols = Math.ceil(s.W / cell); rows = Math.ceil(s.H / cell);
    grid = new Uint8Array(cols * rows); age = new Float32Array(cols * rows);
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.32 ? 1 : 0;
  }
  function stepLife() {
    const ng = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        n += grid[((y + dy + rows) % rows) * cols + (x + dx + cols) % cols];
      }
      const idx = y * cols + x, alive = grid[idx];
      ng[idx] = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
      age[idx] = ng[idx] ? Math.min(1, age[idx] + 0.18) : 0;
    }
    grid = ng;
    let pop = 0; for (let i = 0; i < grid.length; i++) pop += grid[i];
    if (pop === prevPop) stable++; else stable = 0; prevPop = pop;
    if (stable > 8 || pop < 4) { init(); stable = 0; }
  }
  function frame() {
    if (!running) return;
    if (frames % 5 === 0) stepLife();
    ctx.clearRect(0, 0, s.W, s.H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const idx = y * cols + x; if (!grid[idx]) continue;
      ctx.fillStyle = `rgba(200,255,0,${0.32 + age[idx] * 0.6})`;
      ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    }
    frames++;
    raf = requestAnimationFrame(frame);
  }
  function onResize() { s.resize(); init(); }
  return {
    start() { if (running) return; running = true; init(); frames = 0; prevPop = -1; stable = 0; window.addEventListener("resize", onResize); frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Lissajous figures ---------------- */
function makeLissajous(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  function onResize() { s.resize(); }
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, s.W, s.H);
    const cx = s.W / 2, cy = s.H / 2, R = Math.min(s.W, s.H) * 0.36;
    const a = 3 + Math.sin(t * 0.18), b = 2 + Math.cos(t * 0.15), d = t * 0.3;
    ctx.strokeStyle = "rgba(200,255,0,0.18)"; ctx.lineWidth = 6;
    ctx.beginPath();
    for (let u = 0; u <= Math.PI * 2 + 0.02; u += 0.02) {
      const x = cx + R * Math.sin(a * u + d), y = cy + R * Math.sin(b * u);
      u === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = ACC; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let u = 0; u <= Math.PI * 2 + 0.02; u += 0.02) {
      const x = cx + R * Math.sin(a * u + d), y = cy + R * Math.sin(b * u);
      u === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    const uu = (t * 0.7) % (Math.PI * 2);
    const dx = cx + R * Math.sin(a * uu + d), dy = cy + R * Math.sin(b * uu);
    ctx.fillStyle = ACC; ctx.beginPath(); ctx.arc(dx, dy, 3.6, 0, Math.PI * 2); ctx.fill();
    t += 0.02;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; window.addEventListener("resize", onResize); frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Double pendulum - chaos ---------------- */
function makePendulum(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false;
  let st, trail = [];
  const g = 1.1, m1 = 1, m2 = 1, L1 = 1, L2 = 1, dt = 0.08;
  function step() {
    const { t1, t2, w1, w2 } = st, d = t1 - t2;
    const den1 = (m1 + m2) * L1 - m2 * L1 * Math.cos(d) * Math.cos(d);
    const a1 = (m2 * L1 * w1 * w1 * Math.sin(d) * Math.cos(d) + m2 * g * Math.sin(t2) * Math.cos(d)
      + m2 * L2 * w2 * w2 * Math.sin(d) - (m1 + m2) * g * Math.sin(t1)) / den1;
    const den2 = (L2 / L1) * den1;
    const a2 = (-m2 * L2 * w2 * w2 * Math.sin(d) * Math.cos(d) + (m1 + m2) * g * Math.sin(t1) * Math.cos(d)
      - (m1 + m2) * L1 * w1 * w1 * Math.sin(d) - (m1 + m2) * g * Math.sin(t2)) / den2;
    st.w1 += a1 * dt; st.w2 += a2 * dt; st.t1 += st.w1 * dt; st.t2 += st.w2 * dt;
  }
  function frame() {
    if (!running) return;
    step(); step();
    ctx.clearRect(0, 0, s.W, s.H);
    const cx = s.W / 2, cy = s.H * 0.40, L = Math.min(s.W, s.H) * 0.21;
    const x1 = cx + L * Math.sin(st.t1), y1 = cy + L * Math.cos(st.t1);
    const x2 = x1 + L * Math.sin(st.t2), y2 = y1 + L * Math.cos(st.t2);
    trail.push([x2, y2]); if (trail.length > 140) trail.shift();
    ctx.lineWidth = 1.4;
    for (let i = 1; i < trail.length; i++) {
      ctx.strokeStyle = `rgba(200,255,0,${(i / trail.length) * 0.7})`;
      ctx.beginPath(); ctx.moveTo(trail[i - 1][0], trail[i - 1][1]); ctx.lineTo(trail[i][0], trail[i][1]); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = "#0a0b0c"; ctx.strokeStyle = "rgba(255,255,255,0.6)";
    [[cx, cy], [x1, y1]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = ACC; ctx.beginPath(); ctx.arc(x2, y2, 4.6, 0, Math.PI * 2); ctx.fill();
    raf = requestAnimationFrame(frame);
  }
  function onResize() { s.resize(); }
  return {
    start() { if (running) return; running = true; st = { t1: Math.PI * 0.72 + Math.random() * 0.2, t2: Math.PI * 0.9, w1: 0, w2: 0 }; trail = []; window.addEventListener("resize", onResize); frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Voronoi diagram ---------------- */
function makeVoronoi(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, sites = [];
  function init() {
    sites = []; const n = 9;
    for (let i = 0; i < n; i++) sites.push({
      x: Math.random() * s.W, y: Math.random() * s.H,
      vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.5) * 0.7,
      shade: 0.1 + (i / n) * 0.52,
    });
  }
  function frame() {
    if (!running) return;
    for (const p of sites) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > s.W) p.vx *= -1; if (p.y < 0 || p.y > s.H) p.vy *= -1; }
    const step = Math.max(5, Math.round(Math.min(s.W, s.H) / 64));
    for (let y = 0; y < s.H; y += step) for (let x = 0; x < s.W; x += step) {
      let best = 1e9, bi = 0;
      for (let i = 0; i < sites.length; i++) { const dx = x - sites[i].x, dy = y - sites[i].y, d = dx * dx + dy * dy; if (d < best) { best = d; bi = i; } }
      const sh = sites[bi].shade;
      ctx.fillStyle = `rgba(${Math.round(sh * 175)},${Math.round(sh * 255)},${Math.round(sh * 40)},0.92)`;
      ctx.fillRect(x, y, step, step);
    }
    ctx.fillStyle = ACC;
    for (const p of sites) { ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fill(); }
    raf = requestAnimationFrame(frame);
  }
  function onResize() { s.resize(); init(); }
  return {
    start() { if (running) return; running = true; init(); window.addEventListener("resize", onResize); frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- DP grid preview ---------------- */
function makeDp(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  const N = 6;
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    const cw = s.W / N, ch = s.H / N;
    const total = N * N;
    const filled = Math.floor(((Math.sin(t * 0.5) + 1) / 2) * (total + 1));
    // path: diagonal from top-left to bottom-right
    const pathSet = new Set();
    let r = 0, c = 0;
    while (r < N && c < N) {
      pathSet.add(r * N + c);
      if (r < N - 1 && c < N - 1) { r % 2 === 0 ? c++ : r++; }
      else if (r < N - 1) { r++; }
      else { c++; }
    }
    pathSet.add((N - 1) * N + (N - 1));
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        const fi = row * N + col;
        const isFilled = fi < filled;
        const onPath = isFilled && pathSet.has(fi);
        ctx.fillStyle = onPath ? 'rgba(200,255,0,0.22)' : isFilled ? 'rgba(60,80,40,0.35)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(col * cw + 1, row * ch + 1, cw - 2, ch - 2);
        if (onPath) {
          ctx.strokeStyle = ACC; ctx.lineWidth = 1.5;
          ctx.strokeRect(col * cw + 2, row * ch + 2, cw - 4, ch - 4);
        }
      }
    }
    t += 0.022;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- BFS grid preview ---------------- */
function makeBfs(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  const COLS = 18, ROWS = 12;
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    const cw = s.W / COLS, ch = s.H / ROWS;
    const cx = Math.floor(COLS / 2), cy = Math.floor(ROWS / 2);
    const wave = (Math.sin(t * 0.7) + 1) * 0.5 * Math.max(COLS, ROWS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dist = Math.abs(c - cx) + Math.abs(r - cy);
        const lit = dist <= wave;
        const onPath = lit && (c === cx || r === cy) && dist <= Math.round(wave * 0.6);
        if (onPath) {
          ctx.fillStyle = ACC;
        } else if (lit) {
          const alpha = Math.max(0.08, 0.55 - (dist / (wave + 1)) * 0.45);
          ctx.fillStyle = `rgba(200,255,0,${alpha.toFixed(2)})`;
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
        }
        ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
      }
    }
    // start marker
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx * cw + cw / 2, cy * ch + ch / 2, Math.min(cw, ch) * 0.22, 0, Math.PI * 2); ctx.fill();
    t += 0.025;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- DFS maze preview ---------------- */
function makeDfs(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  const COLS = 18, ROWS = 12;
  // decorative snake path that dives & backtracks - no real DFS compute
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    const cw = s.W / COLS, ch = s.H / ROWS;
    // progress oscillates: dive forward then backtrack
    const prog = (Math.sin(t * 0.6) + 1) / 2;
    const total = COLS * ROWS;
    const head = Math.floor(prog * total);
    // snake path: column-first dive
    const pathSet = new Set();
    for (let i = 0; i < head; i++) {
      const col = Math.floor(i / ROWS);
      const row = col % 2 === 0 ? i % ROWS : ROWS - 1 - (i % ROWS);
      pathSet.add(row * COLS + col);
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const onPath = pathSet.has(r * COLS + c);
        if (onPath) {
          const depth = c / COLS;
          ctx.fillStyle = `rgba(${Math.round(120 + depth * 80)},${Math.round(180 + depth * 75)},20,0.9)`;
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
        }
        ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
      }
    }
    // head marker
    if (head > 0 && head < total) {
      const hi = head - 1;
      const col = Math.floor(hi / ROWS);
      const row = col % 2 === 0 ? hi % ROWS : ROWS - 1 - (hi % ROWS);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.strokeRect(col * cw + 2, row * ch + 2, cw - 4, ch - 4);
    }
    t += 0.022;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Greedy timeline preview ---------------- */
function makeGreedy(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  const BARS = 8;
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    const padX = 12, padBot = 14, padTop = 8;
    const lh = (s.H - padTop - padBot) / BARS;
    const barW = s.W - padX * 2;
    // animate a sweep cursor that lights bars up sequentially
    const sweep = ((Math.sin(t * 0.6) + 1) / 2) * BARS;
    for (let i = 0; i < BARS; i++) {
      const y = padTop + i * lh + lh * 0.15;
      const bh = lh * 0.7;
      // decorative bar sizes: alternate widths
      const start = (i * 0.13) % 1;
      const len = 0.18 + ((i * 0.17 + 0.1) % 0.55);
      const x0 = padX + start * barW;
      const x1 = x0 + len * barW;
      const accepted = i < Math.floor(sweep) && (i % 3 !== 1);
      let fill, stroke;
      if (i >= Math.ceil(sweep)) {
        fill = 'rgba(255,255,255,0.04)'; stroke = 'rgba(255,255,255,0.12)';
      } else if (accepted) {
        fill = 'rgba(200,255,0,0.85)'; stroke = ACC;
      } else {
        fill = 'rgba(150,60,60,0.15)'; stroke = 'rgba(190,80,80,0.45)';
      }
      ctx.beginPath();
      const r = Math.min(4, bh / 2);
      ctx.moveTo(x0 + r, y); ctx.arcTo(x1, y, x1, y + bh, r);
      ctx.arcTo(x1, y + bh, x0, y + bh, r); ctx.arcTo(x0, y + bh, x0, y, r);
      ctx.arcTo(x0, y, x1, y, r); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke();
    }
    // sweep cursor line
    const cx = padX + (((t * 0.3) % 1)) * barW;
    ctx.strokeStyle = 'rgba(200,255,0,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx, padTop - 2); ctx.lineTo(cx, s.H - padBot + 2); ctx.stroke();
    ctx.setLineDash([]);
    t += 0.025;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Fourier Transform - decorative winding spiral ---------------- */
function makeFourierTransform(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false, t = 0;
  const COMPS = [{ f: 3, a: 1 }, { f: 7, a: 0.5 }];
  const NS = 120;
  function g(time) {
    let v = 0;
    for (const c of COMPS) v += c.a * Math.cos(2 * Math.PI * c.f * time);
    return v;
  }
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    const windF = 3 + Math.sin(t * 0.3) * 2.5;
    const cx = s.W / 2, cy = s.H / 2;
    const DUR = 2;
    const ma = 1.5;
    const R = Math.min(s.W, s.H) * 0.38;
    const sc = R / ma;
    // wound path
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < NS; i++) {
      const tt = i / NS * DUR, v = g(tt), ang = 2 * Math.PI * windF * tt;
      const px = cx + sc * v * Math.cos(ang), py = cy - sc * v * Math.sin(ang);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.strokeStyle = ACC; ctx.stroke();
    // COM dot
    let rx = 0, ry = 0;
    for (let i = 0; i < NS; i++) {
      const tt = i / NS * DUR, v = g(tt), ang = 2 * Math.PI * windF * tt;
      rx += v * Math.cos(ang); ry -= v * Math.sin(ang);
    }
    rx /= NS; ry /= NS;
    const MAG = 4;
    const mx = cx + sc * rx * MAG, my = cy - sc * ry * MAG;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill();
    t += 0.022;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

/* ---------------- Sorting - decorative endless bubble sort ---------------- */
function makeSorting(canvas) {
  const s = setup(canvas);
  const ctx = s.ctx;
  let raf = null, running = false;
  const N = 26;
  let vals = [], i = 0, end = N - 1, cool = 0;
  function shuffle() {
    vals = Array.from({ length: N }, (_, k) => k + 1);
    for (let k = N - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); const t = vals[k]; vals[k] = vals[j]; vals[j] = t; }
    i = 0; end = N - 1;
  }
  shuffle();
  function stepSort() {
    if (end <= 0) { if (++cool > 60) { shuffle(); cool = 0; } return; }
    for (let k = 0; k < 2 && end > 0; k++) {
      if (vals[i] > vals[i + 1]) { const t = vals[i]; vals[i] = vals[i + 1]; vals[i + 1] = t; }
      i++;
      if (i >= end) { i = 0; end--; }
    }
  }
  function frame() {
    if (!running) return;
    s.resize();
    ctx.clearRect(0, 0, s.W, s.H);
    stepSort();
    const padX = s.W * 0.12, padY = s.H * 0.18;
    const bw = (s.W - padX * 2) / N;
    for (let k = 0; k < N; k++) {
      const bh = (vals[k] / N) * (s.H - padY * 2);
      const sorted = k > end;
      ctx.fillStyle = sorted ? "rgba(200,255,0,0.5)" : (k === i || k === i + 1) && end > 0 ? "#e8ecef" : "rgba(120,140,150,0.4)";
      ctx.fillRect(padX + k * bw + 1, s.H - padY - bh, Math.max(1, bw - 2), bh);
    }
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; frame(); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); ctx.clearRect(0, 0, s.W, s.H); },
  };
}

export { makeSaddle };

export const previews = {
  plotter: (c) => makeSaddle(c, { density: 20, autoSpin: 0.006, rotX: -0.9, scale: 0.92, alpha: 1, parallax: false }),
  fourier: (c) => makeFourier(c),
  fractal: (c) => makeFractal(c),
  montecarlo: (c, cb) => makeMonteCarlo(c, cb),
  bezier: (c) => makeBezier(c),
  flowfield: (c) => makeFlow(c),
  life: (c) => makeLife(c),
  lissajous: (c) => makeLissajous(c),
  pendulum: (c) => makePendulum(c),
  voronoi: (c) => makeVoronoi(c),
  bfs: (c) => makeBfs(c),
  dp: (c) => makeDp(c),
  dfs: (c) => makeDfs(c),
  greedy: (c) => makeGreedy(c),
  fouriertransform: (c) => makeFourierTransform(c),
  sorting: (c) => makeSorting(c),
};
