/* BFS lab - 2D canvas renderer + animation. Compute lives on the BE;
   this module only edits the maze locally and replays an injected trace.
   Ported from Allgomath-publish/bfs-lab.js. */
import { idx, inBounds, emptyWalls, randomMaze } from './bfsGrid.js'
import { makeTicker } from './clock.js'

import { accent } from './theme.js'

const ACC = accent()

export function createBfsLab(canvas, opts = {}) {
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

  const st = { cols: 24, rows: 16, tool: 'wall', speed: 8, numbers: false, diag: false }
  const ticker = makeTicker()
  let wall = emptyWalls(st.rows, st.cols)
  let start = idx(Math.floor(st.rows / 2), 2, st.cols)
  let goal = idx(Math.floor(st.rows / 2), st.cols - 3, st.cols)

  // injected trace (from BE). empty until setTrace().
  let order = [], dist = [], parent = [], path = []
  let found = false, reachedAt = -1
  let head = 0, pathHead = 0, phase = 'idle', playing = false, raf = null, alive = false
  let cell = 20, ox = 0, oy = 0

  let everRan = false

  function clearTrace() {
    order = []; dist = []; parent = []; path = []
    found = false; reachedAt = -1
    head = 0; pathHead = 0; phase = 'idle'
    emit()
  }
  // live=true -> 이미 실행된 적이 있어 컴포넌트가 즉시 재탐색해야 하는 편집
  function emitEdit() { if (onEdit) onEdit(everRan) }

  // preserve=true -> 라이브 재탐색: 애니메이션 진행 중이면 위치 유지, 아니면 새 결과를 즉시 전체 표시
  function setTrace(t, preserve = false) {
    const prev = { phase, head, pathHead, playing }
    order = t.order || []; dist = t.dist || []; parent = t.parent || []; path = t.path || []
    found = !!t.found
    reachedAt = found ? order.indexOf(goal) : -1
    everRan = true
    const stopAt = reachedAt >= 0 ? reachedAt + 1 : order.length
    if (!preserve) {
      head = 0; pathHead = 0; phase = 'idle'
    } else if (prev.phase === 'search') {
      head = Math.min(prev.head, stopAt); pathHead = 0; phase = 'search'; playing = prev.playing
    } else if (prev.phase === 'path') {
      head = stopAt; pathHead = Math.min(prev.pathHead, path.length); phase = 'path'; playing = prev.playing
    } else {
      head = stopAt; pathHead = path.length; phase = 'done'; playing = false
    }
    emit()
  }

  function getState() {
    return { rows: st.rows, cols: st.cols, walls: Array.from(wall, (w) => !!w), start, goal, diag: st.diag }
  }

  function geom() {
    cell = Math.floor(Math.min((W - 4) / st.cols, (H - 4) / st.rows))
    ox = Math.round((W - cell * st.cols) / 2); oy = Math.round((H - cell * st.rows) / 2)
  }

  function maxDist() { let m = 1; for (let i = 0; i < dist.length; i++) if (dist[i] > m) m = dist[i]; return m }

  function distColor(d, md) {
    const t = Math.min(1, d / md)
    const r = Math.round(40 + t * 160), g = Math.round(90 + t * 165), b = Math.round(90 - t * 70)
    return `rgba(${r},${g},${b},0.85)`
  }

  function draw() {
    geom()
    ctx.clearRect(0, 0, W, H)
    const md = maxDist()
    const revealCount = phase === 'idle' ? 0 : head
    const lastCell = revealCount > 0 ? order[Math.min(revealCount, order.length) - 1] : -1
    const frontDist = lastCell >= 0 ? dist[lastCell] : -1
    // cells
    for (let r = 0; r < st.rows; r++) for (let c = 0; c < st.cols; c++) {
      const i = idx(r, c, st.cols), x = ox + c * cell, y = oy + r * cell
      ctx.fillStyle = '#0e1013'
      ctx.fillRect(x, y, cell - 1, cell - 1)
      if (wall[i]) { ctx.fillStyle = '#23262b'; ctx.fillRect(x, y, cell - 1, cell - 1); continue }
    }
    // visited reveal
    for (let k = 0; k < revealCount && k < order.length; k++) {
      const i = order[k]; if (i === start || i === goal) continue
      const r = (i / st.cols) | 0, c = i % st.cols, x = ox + c * cell, y = oy + r * cell
      const onFront = dist[i] === frontDist
      ctx.fillStyle = onFront ? 'rgba(200,255,0,0.9)' : distColor(dist[i], md)
      ctx.fillRect(x, y, cell - 1, cell - 1)
      if (st.numbers && cell >= 16) { ctx.fillStyle = 'rgba(8,10,12,0.7)'; ctx.font = `${Math.round(cell * 0.42)}px 'Space Mono', monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(dist[i], x + cell / 2, y + cell / 2) }
    }
    // path
    if (phase === 'path' || phase === 'done') {
      for (let k = 0; k < pathHead && k < path.length; k++) {
        const i = path[k]; if (i === start || i === goal) continue
        const r = (i / st.cols) | 0, c = i % st.cols, x = ox + c * cell, y = oy + r * cell
        ctx.fillStyle = ACC; ctx.fillRect(x, y, cell - 1, cell - 1)
      }
    }
    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1
    ctx.beginPath()
    for (let c = 0; c <= st.cols; c++) { ctx.moveTo(ox + c * cell, oy); ctx.lineTo(ox + c * cell, oy + st.rows * cell) }
    for (let r = 0; r <= st.rows; r++) { ctx.moveTo(ox, oy + r * cell); ctx.lineTo(ox + st.cols * cell, oy + r * cell) }
    ctx.stroke()
    drawMarker(start, '#0a0b0c', ACC, 'S')
    drawMarker(goal, ACC, '#0a0b0c', 'G')
  }
  function drawMarker(i, fill, ring, label) {
    const r = (i / st.cols) | 0, c = i % st.cols, x = ox + c * cell, y = oy + r * cell
    ctx.fillStyle = ring === ACC ? 'rgba(200,255,0,0.18)' : ACC; ctx.fillRect(x, y, cell - 1, cell - 1)
    ctx.fillStyle = ring === ACC ? ACC : '#0a0b0c'
    ctx.font = `700 ${Math.round(cell * 0.5)}px 'Archivo', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(label, x + cell / 2, y + cell / 2 + 1)
  }

  function emit() {
    if (!onStat) return
    const visited = phase === 'idle' ? 0 : Math.min(head, order.length)
    onStat({
      visited, total: order.length,
      pathLen: (phase === 'done' || phase === 'path') ? Math.max(0, path.length - 1) : '—',
      found, phase,
    })
  }
  function countFrontier() {
    const lc = order[Math.min(head, order.length) - 1]; if (lc == null) return 0
    const fd = dist[lc]; let n = 0
    for (let k = 0; k < head && k < order.length; k++) if (dist[order[k]] === fd) n++
    return n
  }

  function tick() {
    if (!playing) { ticker.reset(); return }
    const n = ticker.advance(st.speed)
    if (!n) return
    if (phase === 'idle') phase = 'search'
    if (phase === 'search') {
      head += n
      const stopAt = reachedAt >= 0 ? reachedAt + 1 : order.length
      if (head >= stopAt) { head = stopAt; phase = found ? 'path' : 'done'; if (phase === 'done') playing = false }
    } else if (phase === 'path') {
      pathHead += n
      if (pathHead >= path.length) { pathHead = path.length; phase = 'done'; playing = false }
    }
    emit()
  }
  function loop() { if (!alive) return; tick(); draw(); raf = requestAnimationFrame(loop) }

  function cellAt(e) {
    const rct = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e
    const x = t.clientX - rct.left - ox, y = t.clientY - rct.top - oy
    const c = Math.floor(x / cell), r = Math.floor(y / cell)
    return inBounds(r, c, st.rows, st.cols) ? idx(r, c, st.cols) : -1
  }
  let painting = false, paintVal = true
  function applyTool(i) {
    if (i < 0) return
    if (st.tool === 'start') { if (!wall[i] && i !== goal) start = i }
    else if (st.tool === 'goal') { if (!wall[i] && i !== start) goal = i }
    else if (st.tool === 'wall') { if (i !== start && i !== goal) wall[i] = paintVal }
    else if (st.tool === 'erase') { wall[i] = false }
    if (!everRan) clearTrace()
    emitEdit()
  }
  function down(e) {
    const i = cellAt(e); if (i < 0) return
    painting = true
    if (st.tool === 'wall') paintVal = !wall[i]
    applyTool(i); if (e.cancelable) e.preventDefault()
  }
  function move(e) { if (!painting) return; applyTool(cellAt(e)); if (e.cancelable) e.preventDefault() }
  function up() { painting = false }

  canvas.addEventListener('mousedown', down)
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
  canvas.addEventListener('touchstart', down, { passive: false })
  canvas.addEventListener('touchmove', move, { passive: false })
  window.addEventListener('touchend', up)
  window.addEventListener('resize', resize)

  resize(); geom(); alive = true; emit(); loop()

  function reseed() {
    wall = emptyWalls(st.rows, st.cols)
    start = idx(Math.floor(st.rows / 2), 2, st.cols)
    goal = idx(Math.floor(st.rows / 2), st.cols - 3, st.cols)
  }

  return {
    getState, setTrace,
    isPlaying() { return playing },
    play() { if (phase === 'done') { head = 0; pathHead = 0; phase = 'idle' } playing = true },
    pause() { playing = false },
    step() {
      playing = false
      if (phase === 'done') { head = 0; pathHead = 0; phase = 'idle' }
      if (phase === 'idle') phase = 'search'
      const stopAt = reachedAt >= 0 ? reachedAt + 1 : order.length
      if (phase === 'search') { head = Math.min(stopAt, head + 1); if (head >= stopAt) phase = found ? 'path' : 'done' }
      else if (phase === 'path') { pathHead = Math.min(path.length, pathHead + 1); if (pathHead >= path.length) phase = 'done' }
      emit()
    },
    reset() { playing = false; head = 0; pathHead = 0; phase = 'idle'; emit() },
    setSpeed(v) { st.speed = v },
    setTool(t) { st.tool = t },
    setSize(n) { st.cols = n; st.rows = Math.max(8, Math.round((n * 2) / 3)); reseed(); clearTrace(); emitEdit() },
    setDiag(b) { st.diag = !!b; if (!everRan) clearTrace(); emitEdit() },
    toggleNumbers(b) { st.numbers = !!b },
    clearWalls() { wall = emptyWalls(st.rows, st.cols); if (!everRan) clearTrace(); emitEdit() },
    randomMaze() { wall = randomMaze(st.rows, st.cols, 0.28, start, goal); if (!everRan) clearTrace(); emitEdit() },
    dispose() {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      canvas.removeEventListener('mousedown', down)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      canvas.removeEventListener('touchstart', down)
      canvas.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
      window.removeEventListener('resize', resize)
    },
  }
}
