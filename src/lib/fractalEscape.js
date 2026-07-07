/* ============================================================
   AllGoMath - Fractal lab v2. Escape-time explorer.
   Ported from Allgomath-publish/fractal-lab.js.
   Mandelbrot / Julia / Burning Ship. Deep zoom (wheel /
   double-click), drag to pan, shift+click to zoom out.
   Iteration depth, render resolution, colour schemes,
   smooth shading, axes, auto-quality.

   createFractalLab(canvas, opts) - factory export.
   viewRanges / escapeIter - pure helper exports for testing.

   NOTE: escapeIter and viewRanges are also inlined inside the
   factory's per-pixel render loop for performance (avoids the
   function-call overhead in the tight inner loop). This is an
   intentional, spec-justified duplication.
   ============================================================ */

function clamp(v, a, b) { return v < a ? a : v > b ? b : v }

/* ---- palette LUTs (256 stops) ----------------------------------- */
function stops(list) {
  // list: [ [pos0..1, r,g,b], ... ]  -> Uint8 LUT 256*3
  const lut = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    let a = list[0], b = list[list.length - 1]
    for (let k = 0; k < list.length - 1; k++) {
      if (t >= list[k][0] && t <= list[k + 1][0]) { a = list[k]; b = list[k + 1]; break }
    }
    const sp = (b[0] - a[0]) || 1, f = (t - a[0]) / sp
    lut[i * 3] = a[1] + (b[1] - a[1]) * f
    lut[i * 3 + 1] = a[2] + (b[2] - a[2]) * f
    lut[i * 3 + 2] = a[3] + (b[3] - a[3]) * f
  }
  return lut
}

const SCHEMES = {
  classic: stops([[0, 8, 12, 40], [0.16, 14, 40, 120], [0.42, 30, 130, 200], [0.62, 220, 235, 245], [0.78, 250, 170, 40], [0.9, 150, 60, 10], [1, 30, 8, 5]]),
  lime:    stops([[0, 6, 9, 6], [0.3, 30, 60, 12], [0.6, 110, 170, 20], [0.82, 200, 255, 0], [1, 245, 255, 200]]),
  fire:    stops([[0, 5, 2, 2], [0.3, 110, 14, 6], [0.55, 220, 60, 8], [0.78, 250, 180, 30], [1, 255, 248, 210]]),
  ice:     stops([[0, 4, 8, 18], [0.32, 12, 50, 95], [0.58, 30, 130, 190], [0.8, 120, 215, 240], [1, 240, 252, 255]]),
  mono:    stops([[0, 8, 8, 9], [0.5, 120, 122, 126], [0.82, 220, 222, 226], [1, 255, 255, 255]]),
  ultra:   stops([[0, 18, 4, 30], [0.25, 90, 10, 120], [0.5, 220, 30, 140], [0.7, 255, 120, 40], [0.86, 255, 220, 90], [1, 255, 255, 240]]),
}
const SCHEME_NAMES = { classic: 'classic', lime: 'neon lime', fire: 'fire', ice: 'ice', mono: 'grayscale', ultra: 'ultraviolet' }

/* ---- Pure exported helpers (used by spec + inlined in render for perf) ---- */

/**
 * Compute the view rectangle in complex-plane units.
 * @param {number} cx  centre real
 * @param {number} cy  centre imag
 * @param {number} span  vertical span in complex units
 * @param {number} W  canvas pixel width
 * @param {number} H  canvas pixel height
 * @returns {{ x0: number, x1: number, y0: number, y1: number }}
 */
export function viewRanges(cx, cy, span, W, H) {
  const upp = span / H
  const hx = upp * W / 2, hy = upp * H / 2
  return { x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy }
}

/**
 * Escape-time iteration count for a single pixel.
 * Bailout when zx²+zy² > 4. Returns maxIter if point is inside the set.
 * @param {'mandelbrot'|'julia'|'burningship'} type
 * @param {number} x0  real component of the point
 * @param {number} y0  imag component of the point
 * @param {number} maxIter
 * @param {number} [jRe=-0.745]  Julia constant real part
 * @param {number} [jIm=0.113]   Julia constant imag part
 * @returns {number}  integer in [0, maxIter]
 */
export function escapeIter(type, x0, y0, maxIter, jRe = -0.745, jIm = 0.113) {
  let zx, zy, cx, cy
  const isJulia = type === 'julia'
  if (isJulia) { zx = x0; zy = y0; cx = jRe; cy = jIm }
  else { zx = 0; zy = 0; cx = x0; cy = y0 }
  const isShip = type === 'burningship'
  let it = 0, zx2 = zx * zx, zy2 = zy * zy
  while (it < maxIter && zx2 + zy2 <= 4) {
    if (isShip) { zx = Math.abs(zx); zy = Math.abs(zy) }
    zy = 2 * zx * zy + cy
    zx = zx2 - zy2 + cx
    zx2 = zx * zx; zy2 = zy * zy
    it++
  }
  return it
}

/* ---- Factory --------------------------------------------------------- */

export function createFractalLab(canvas, opts = {}) {
  const ctx = canvas.getContext('2d')
  const buf = document.createElement('canvas')
  const bctx = buf.getContext('2d')
  let dpr = 1, W = 0, H = 0
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = canvas.clientWidth; H = canvas.clientHeight
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = true
    dirty = true
  }

  const HOME = {
    mandelbrot:  { cx: -0.55, cy: 0,    span: 2.6 },
    julia:       { cx: 0,     cy: 0,    span: 3.0 },
    burningship: { cx: -0.4,  cy: -0.5, span: 3.2 },
  }
  const st = {
    type: 'mandelbrot', maxIter: 120, baseRes: 520, scheme: 'classic',
    smooth: true, axes: false, autoQ: true,
    jRe: -0.745, jIm: 0.113,
    cx: HOME.mandelbrot.cx, cy: HOME.mandelbrot.cy, span: HOME.mandelbrot.span,
    onStat: opts.onStat || null,
  }

  let dirty = true, interacting = false, idleTimer = null, raf = null, alive = false

  function unitsPerPixel() { return st.span / H }
  function _viewRanges() {
    const upp = unitsPerPixel()
    const hx = upp * W / 2, hy = upp * H / 2
    return { x0: st.cx - hx, x1: st.cx + hx, y0: st.cy - hy, y1: st.cy + hy }
  }

  /* ---- core escape-time render --------------------------------- */
  function render(quality) {
    const t0 = performance.now()
    const aspect = W / H
    let rw = Math.round(st.baseRes * (quality || 1))
    rw = clamp(rw, 24, 1400)
    let rh = Math.max(16, Math.round(rw / aspect))
    buf.width = rw; buf.height = rh
    const img = bctx.createImageData(rw, rh)
    const data = img.data
    const lut = SCHEMES[st.scheme] || SCHEMES.classic
    const maxIter = st.maxIter
    const r = _viewRanges()
    const sx = (r.x1 - r.x0) / rw, sy = (r.y1 - r.y0) / rh
    const isJulia = st.type === 'julia', isShip = st.type === 'burningship'
    const jr = st.jRe, ji = st.jIm
    const bail = 256 // larger bailout => smoother
    const invLog2 = 1 / Math.log(2)
    const smooth = st.smooth

    for (let py = 0; py < rh; py++) {
      const y0 = r.y0 + py * sy
      for (let px = 0; px < rw; px++) {
        const x0 = r.x0 + px * sx
        let zx, zy, cx, cy
        if (isJulia) { zx = x0; zy = y0; cx = jr; cy = ji }
        else { zx = 0; zy = 0; cx = x0; cy = y0 }
        let it = 0, zx2 = zx * zx, zy2 = zy * zy
        while (it < maxIter && zx2 + zy2 <= bail) {
          if (isShip) { zx = Math.abs(zx); zy = Math.abs(zy) }
          zy = 2 * zx * zy + cy
          zx = zx2 - zy2 + cx
          zx2 = zx * zx; zy2 = zy * zy
          it++
        }
        const o = (py * rw + px) * 4
        if (it >= maxIter) { data[o] = 6; data[o + 1] = 7; data[o + 2] = 9; data[o + 3] = 255; continue }
        let v = it
        if (smooth) {
          const mag = zx2 + zy2
          v = it + 1 - Math.log(0.5 * Math.log(mag)) * invLog2
        }
        const t = Math.sqrt(clamp(v / maxIter, 0, 1))
        const idx = (clamp(t * 255, 0, 255) | 0) * 3
        data[o] = lut[idx]; data[o + 1] = lut[idx + 1]; data[o + 2] = lut[idx + 2]; data[o + 3] = 255
      }
    }
    bctx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = quality < 1 || rw < W
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(buf, 0, 0, rw, rh, 0, 0, W, H)
    if (st.axes) drawAxes(r)
    const ms = Math.round(performance.now() - t0)
    if (st.onStat) st.onStat(buildStat(rw, rh, ms))
  }

  function drawAxes(r) {
    const x0px = (0 - r.x0) / (r.x1 - r.x0) * W
    const y0px = (0 - r.y0) / (r.y1 - r.y0) * H
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1
    ctx.beginPath()
    if (x0px >= 0 && x0px <= W) { ctx.moveTo(x0px, 0); ctx.lineTo(x0px, H) }
    if (y0px >= 0 && y0px <= H) { ctx.moveTo(0, y0px); ctx.lineTo(W, y0px) }
    ctx.stroke()
    const upp = unitsPerPixel()
    const targetPx = 70
    let step = Math.pow(10, Math.floor(Math.log10(upp * targetPx)))
    const ratio = (upp * targetPx) / step
    if (ratio > 5) step *= 5; else if (ratio > 2) step *= 2
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = "10px 'Space Mono', monospace"
    for (let gx = Math.ceil(r.x0 / step) * step; gx <= r.x1; gx += step) {
      const sxp = (gx - r.x0) / (r.x1 - r.x0) * W
      ctx.beginPath(); ctx.moveTo(sxp, y0px - 4); ctx.lineTo(sxp, y0px + 4); ctx.stroke()
      if (Math.abs(gx) > step * 0.4) ctx.fillText(gx.toFixed(step < 0.01 ? 4 : 2), sxp + 3, y0px - 6)
    }
    for (let gy = Math.ceil(r.y0 / step) * step; gy <= r.y1; gy += step) {
      const syp = (gy - r.y0) / (r.y1 - r.y0) * H
      ctx.beginPath(); ctx.moveTo(x0px - 4, syp); ctx.lineTo(x0px + 4, syp); ctx.stroke()
      if (Math.abs(gy) > step * 0.4) ctx.fillText((-gy).toFixed(step < 0.01 ? 4 : 2) + 'i', x0px + 6, syp - 4)
    }
    ctx.restore()
  }

  function buildStat(rw, rh, ms) {
    const r = _viewRanges()
    const zoom = HOME[st.type].span / st.span
    return {
      type: st.type, zoom, cx: st.cx, cy: st.cy,
      x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1,
      rw, rh, ms, iter: st.maxIter,
      scheme: SCHEME_NAMES[st.scheme],
    }
  }

  /* ---- render scheduling --------------------------------------- */
  function schedule() { dirty = true }
  function loop() {
    if (!alive) return
    if (dirty) {
      dirty = false
      render(st.autoQ && interacting ? 0.34 : 1)
    }
    raf = requestAnimationFrame(loop)
  }
  function beginInteract() { interacting = true; schedule(); clearTimeout(idleTimer) }
  function endInteract() {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { interacting = false; schedule() }, 150)
  }

  /* ---- pointer interaction ------------------------------------- */
  function pos(e) { const rect = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - rect.left, t.clientY - rect.top] }
  function pxToComplex(x, y) {
    const r = _viewRanges()
    return [r.x0 + x / W * (r.x1 - r.x0), r.y0 + y / H * (r.y1 - r.y0)]
  }
  let dragging = false, lastX = 0, lastY = 0, moved = 0
  function down(e) {
    const [x, y] = pos(e)
    if (e.shiftKey && !e.touches) { zoomAt(x, y, 2.2); if (e.cancelable) e.preventDefault(); return }
    dragging = true; moved = 0; lastX = x; lastY = y; beginInteract()
    if (e.cancelable) e.preventDefault()
  }
  function move(e) {
    if (!dragging) return
    const [x, y] = pos(e)
    const upp = unitsPerPixel()
    st.cx -= (x - lastX) * upp; st.cy -= (y - lastY) * upp
    moved += Math.abs(x - lastX) + Math.abs(y - lastY)
    lastX = x; lastY = y; schedule()
    if (e.cancelable) e.preventDefault()
  }
  function up() { if (!dragging) return; dragging = false; endInteract() }
  function zoomAt(x, y, factor) {
    const [mx, my] = pxToComplex(x, y)
    st.span = clamp(st.span * factor, 1e-13, 8)
    const r2 = _viewRanges()
    const nx = r2.x0 + x / W * (r2.x1 - r2.x0), ny = r2.y0 + y / H * (r2.y1 - r2.y0)
    st.cx += mx - nx; st.cy += my - ny
    beginInteract(); schedule(); endInteract()
  }
  function wheel(e) {
    const [x, y] = pos(e)
    zoomAt(x, y, e.deltaY > 0 ? 1.18 : 1 / 1.18)
    e.preventDefault()
  }
  function dbl(e) { const [x, y] = pos(e); zoomAt(x, y, 1 / 2.2) }

  canvas.addEventListener('mousedown', down)
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
  canvas.addEventListener('wheel', wheel, { passive: false })
  canvas.addEventListener('dblclick', dbl)
  canvas.addEventListener('touchstart', down, { passive: false })
  canvas.addEventListener('touchmove', move, { passive: false })
  window.addEventListener('touchend', up)
  window.addEventListener('resize', resize)

  resize(); alive = true; loop()

  return {
    setType(v) {
      st.type = v
      const h = HOME[v]; st.cx = h.cx; st.cy = h.cy; st.span = h.span; schedule()
    },
    setIter(v) { st.maxIter = v | 0; schedule() },
    setRes(v) { st.baseRes = v | 0; schedule() },
    setScheme(v) { st.scheme = v; schedule() },
    setJulia(re, im) { if (re != null) st.jRe = re; if (im != null) st.jIm = im; schedule() },
    toggle(k, v) {
      if (k === 'smooth') st.smooth = !!v
      else if (k === 'axes') st.axes = !!v
      else if (k === 'autoQ') st.autoQ = !!v
      schedule()
    },
    reset() { const h = HOME[st.type]; st.cx = h.cx; st.cy = h.cy; st.span = h.span; schedule() },
    getView() { return { cx: st.cx, cy: st.cy, span: st.span } },
    setView(cx, cy, span) {
      if (Number.isFinite(cx)) st.cx = cx
      if (Number.isFinite(cy)) st.cy = cy
      if (Number.isFinite(span) && span > 0) st.span = span
      schedule()
    },
    onStat(cb) { st.onStat = cb },
    schemeName(k) { return SCHEME_NAMES[k] },
    dispose() {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      canvas.removeEventListener('mousedown', down)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      canvas.removeEventListener('wheel', wheel)
      canvas.removeEventListener('dblclick', dbl)
      canvas.removeEventListener('touchstart', down)
      canvas.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
      window.removeEventListener('resize', resize)
    },
  }
}
