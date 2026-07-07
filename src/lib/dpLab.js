/* DP lab - 2D canvas renderer + animation. Compute lives on the BE;
   this module only edits the grid locally and replays an injected trace.
   Ported from Allgomath-publish/dp-lab.js. */
import { randomGrid, cycleValue } from './dpGrid.js'

const ACC = '#c8ff00'

export function createDpLab(canvas, opts = {}) {
  const ctx = canvas.getContext('2d')
  const onStat = opts.onStat || null
  const onEdit = opts.onEdit || null

  let dpr = 1, W = 0, H = 0
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = canvas.clientWidth; H = canvas.clientHeight
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const st = { n: 6, mode: 'max', speed: 3 }
  let grid = randomGrid(st.n)

  // injected trace (empty until setTrace)
  let dp = [], from = [], fillOrder = [], path = []
  let best = 0
  let head = 0, pathHead = 0, phase = 'idle', playing = false, raf = null, alive = false
  let cell = 60, ox = 0, oy = 0

  function clearTrace() {
    dp = []; from = []; fillOrder = []; path = []
    best = 0; head = 0; pathHead = 0; phase = 'idle'
    emit()
  }
  function emitEdit() { if (onEdit) onEdit() }

  function setTrace(t) {
    dp = t.dp || []; from = t.from || []; fillOrder = t.fillOrder || []; path = t.path || []
    best = t.best || 0
    head = 0; pathHead = 0; phase = 'idle'
    emit()
  }

  function getState() {
    return { grid, mode: st.mode }
  }

  function geom() {
    cell = Math.floor(Math.min((W - 8) / st.n, (H - 8) / st.n))
    ox = Math.round((W - cell * st.n) / 2); oy = Math.round((H - cell * st.n) / 2)
  }

  function fillIndex(r, c) { return r * st.n + c }

  function draw() {
    geom()
    ctx.clearRect(0, 0, W, H)
    const n = st.n
    const filled = phase === 'idle' ? 0 : head
    const pathSet = new Set()
    if (phase === 'path' || phase === 'done') for (let k = 0; k < pathHead && k < path.length; k++) pathSet.add(path[k][0] * n + path[k][1])
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const x = ox + c * cell, y = oy + r * cell
      const fi = r * n + c
      const isFilled = phase !== 'idle' && fillIndex(r, c) < filled
      const onPath = pathSet.has(fi)
      ctx.fillStyle = onPath ? 'rgba(200,255,0,0.16)' : isFilled ? 'rgba(60,80,40,0.32)' : '#0e1013'
      ctx.fillRect(x, y, cell - 2, cell - 2)
      if (onPath) { ctx.strokeStyle = ACC; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, cell - 4, cell - 4) }
      // gold value (top-left small)
      ctx.fillStyle = onPath ? 'rgba(200,255,0,0.7)' : 'rgba(154,158,164,0.7)'
      ctx.font = `${Math.max(9, Math.round(cell * 0.2))}px 'Space Mono', monospace`
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'
      ctx.fillText(grid[r][c], x + 5, y + 4)
      // dp value (center) when filled
      if (isFilled && dp.length > 0) {
        ctx.fillStyle = onPath ? ACC : '#edeef0'
        ctx.font = `600 ${Math.max(12, Math.round(cell * 0.34))}px 'Archivo', sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(dp[r][c], x + cell / 2, y + cell / 2 + 2)
        // choice arrow
        const s = from[r] && from[r][c]
        if (s && cell >= 40) {
          ctx.strokeStyle = onPath ? ACC : 'rgba(200,255,0,0.4)'; ctx.lineWidth = 1.5
          ctx.beginPath()
          if (s === 'up') { ctx.moveTo(x + cell / 2, y + 4); ctx.lineTo(x + cell / 2, y + 13); ctx.moveTo(x + cell / 2 - 3, y + 9); ctx.lineTo(x + cell / 2, y + 4); ctx.lineTo(x + cell / 2 + 3, y + 9) }
          else { ctx.moveTo(x + 4, y + cell / 2); ctx.lineTo(x + 14, y + cell / 2); ctx.moveTo(x + 9, y + cell / 2 - 3); ctx.lineTo(x + 4, y + cell / 2); ctx.lineTo(x + 9, y + cell / 2 + 3) }
          ctx.stroke()
        }
      }
    }
    // current cell highlight
    if (phase === 'fill' && filled > 0 && filled <= fillOrder.length) {
      const [cr, cc] = fillOrder[filled - 1]
      const x = ox + cc * cell, y = oy + cr * cell
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, cell - 4, cell - 4)
    }
    // grid outline
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.strokeRect(ox, oy, cell * n, cell * n)
  }

  function emit() {
    if (!onStat) return
    if (phase === 'idle' || dp.length === 0) {
      onStat({ filled: 0, total: st.n * st.n, best: '—', pathLen: 0, phase, mode: st.mode })
      return
    }
    const filled = Math.min(head, fillOrder.length)
    onStat({
      filled, total: st.n * st.n,
      best: (phase === 'fill' && filled < fillOrder.length) ? '—' : best,
      pathLen: path.length, phase, mode: st.mode,
    })
  }

  function tick() {
    if (!playing) return
    if (phase === 'idle') phase = 'fill'
    if (phase === 'fill') {
      head += st.speed
      if (head >= fillOrder.length) { head = fillOrder.length; phase = 'path' }
    } else if (phase === 'path') {
      pathHead += 1
      if (pathHead >= path.length) { pathHead = path.length; phase = 'done'; playing = false }
    }
    emit()
  }
  function loop() { if (!alive) return; tick(); draw(); raf = requestAnimationFrame(loop) }

  function cellAt(e) {
    const rct = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e
    const x = t.clientX - rct.left - ox, y = t.clientY - rct.top - oy
    const c = Math.floor(x / cell), r = Math.floor(y / cell)
    if (r < 0 || c < 0 || r >= st.n || c >= st.n) return null; return [r, c]
  }
  function click(e) {
    const p = cellAt(e); if (!p) return
    grid[p[0]][p[1]] = cycleValue(grid[p[0]][p[1]])
    clearTrace(); emitEdit()
  }
  function touchStart(e) { click(e); if (e.cancelable) e.preventDefault() }

  canvas.addEventListener('click', click)
  canvas.addEventListener('touchstart', touchStart, { passive: false })
  window.addEventListener('resize', resize)

  resize(); geom(); alive = true; emit(); loop()

  return {
    getState, setTrace,
    isPlaying() { return playing },
    play() { if (phase === 'done') { head = 0; pathHead = 0; phase = 'idle' } playing = true },
    pause() { playing = false },
    step() {
      playing = false
      if (phase === 'idle') phase = 'fill'
      if (phase === 'fill') { head = Math.min(fillOrder.length, head + 1); if (head >= fillOrder.length) phase = 'path' }
      else if (phase === 'path') { pathHead = Math.min(path.length, pathHead + 1); if (pathHead >= path.length) phase = 'done' }
      emit()
    },
    reset() { playing = false; head = 0; pathHead = 0; phase = 'idle'; emit() },
    setSpeed(v) { st.speed = v },
    setSize(n) { st.n = n; grid = randomGrid(n); clearTrace(); emitEdit() },
    setMode(m) { st.mode = m; clearTrace(); emitEdit() },
    randomize() { grid = randomGrid(st.n); clearTrace(); emitEdit() },
    dispose() {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      canvas.removeEventListener('click', click)
      canvas.removeEventListener('touchstart', touchStart)
      window.removeEventListener('resize', resize)
    },
  }
}
