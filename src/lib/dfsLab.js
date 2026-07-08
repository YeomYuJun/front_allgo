/* DFS lab - 2D canvas renderer + animation. Compute lives on the BE;
   this module only edits the maze locally and replays an injected trace.
   Ported from Allgomath-publish/dfs-lab.js. */
import { idx, inBounds, emptyWalls, randomMaze } from './bfsGrid.js'
import { makeTicker } from './clock.js'

import { accent } from './theme.js'

const ACC = accent()

export function createDfsLab(canvas, opts = {}) {
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

  const st = { cols: 24, rows: 16, tool: 'wall', speed: 8 }
  const ticker = makeTicker()
  let wall = emptyWalls(st.rows, st.cols)
  let start = idx(Math.floor(st.rows / 2), 2, st.cols)
  let goal = idx(Math.floor(st.rows / 2), st.cols - 3, st.cols)

  // injected trace (from BE). empty until setTrace().
  let events = [], path = []
  let found = false, deadEnds = 0, foundAt = -1
  let head = 0, phase = 'idle', playing = false, raf = null, alive = false
  let cell = 20, ox = 0, oy = 0

  let everRan = false

  function clearTrace() {
    events = []; path = []
    found = false; deadEnds = 0; foundAt = -1
    head = 0; phase = 'idle'
    emit()
  }
  // live=true -> 이미 실행된 적이 있어 컴포넌트가 즉시 재탐색해야 하는 편집
  function emitEdit() { if (onEdit) onEdit(everRan) }

  // preserve=true -> 라이브 재탐색: 탐색 애니메이션 중이면 진행 위치 유지, 아니면 새 결과 즉시 전체 표시
  function setTrace(t, preserve = false) {
    const prev = { phase, head, playing }
    events = t.events || []; path = t.path || []
    found = !!t.found; deadEnds = t.deadEnds || 0
    foundAt = found ? events.length - 1 : -1
    everRan = true
    if (!preserve) {
      head = 0; phase = 'idle'
    } else if (prev.phase === 'search') {
      head = Math.min(prev.head, endHead()); phase = 'search'; playing = prev.playing
    } else {
      head = endHead(); phase = 'done'; playing = false
    }
    emit()
  }

  function getState() {
    return { rows: st.rows, cols: st.cols, walls: Array.from(wall, (w) => !!w), start, goal }
  }

  function geom() {
    cell = Math.floor(Math.min((W - 4) / st.cols, (H - 4) / st.rows))
    ox = Math.round((W - cell * st.cols) / 2); oy = Math.round((H - cell * st.rows) / 2)
  }

  // replay events[0..count) -> {stack, onStack, visited, back}
  function stateAt(count) {
    const n = st.rows * st.cols
    const visited = new Uint8Array(n), back = new Uint8Array(n)
    const onStack = new Uint8Array(n); const stack = []
    for (let k = 0; k < count && k < events.length; k++) {
      const e = events[k]
      if (e.type === 'push') { stack.push(e.cell); onStack[e.cell] = 1; visited[e.cell] = 1 }
      else { stack.pop(); onStack[e.cell] = 0; back[e.cell] = 1 }
    }
    return { stack, onStack, visited, back }
  }

  function draw() {
    geom()
    ctx.clearRect(0, 0, W, H)
    const count = phase === 'idle' ? 0 : head
    const s = stateAt(count)
    for (let r = 0; r < st.rows; r++) for (let c = 0; c < st.cols; c++) {
      const i = idx(r, c, st.cols), x = ox + c * cell, y = oy + r * cell
      let col = '#0e1013'
      if (wall[i]) col = '#23262b'
      else if (s.onStack[i]) col = null // drawn below as path
      else if (s.back[i]) col = 'rgba(150,70,60,0.42)'
      else if (s.visited[i]) col = 'rgba(60,80,70,0.5)'
      if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, cell - 1, cell - 1) }
    }
    // live stack path (bright, gradient by depth)
    for (let d = 0; d < s.stack.length; d++) {
      const i = s.stack[d]; if (i === start || i === goal) continue
      const r = (i / st.cols) | 0, c = i % st.cols, x = ox + c * cell, y = oy + r * cell
      const t = s.stack.length > 1 ? d / (s.stack.length - 1) : 1
      ctx.fillStyle = `rgba(${Math.round(120 + t * 80)},${Math.round(180 + t * 75)},${Math.round(20)},0.95)`
      ctx.fillRect(x, y, cell - 1, cell - 1)
    }
    // head marker (current cell)
    if (s.stack.length && phase !== 'idle') {
      const i = s.stack[s.stack.length - 1]
      if (i !== goal && i !== start) {
        const r = (i / st.cols) | 0, c = i % st.cols, x = ox + c * cell, y = oy + r * cell
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, cell - 3, cell - 3)
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1; ctx.beginPath()
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
    const count = phase === 'idle' ? 0 : head
    const s = stateAt(count)
    let visitedN = 0; for (let i = 0; i < s.visited.length; i++) if (s.visited[i]) visitedN++
    let backN = 0; for (let i = 0; i < s.back.length; i++) if (s.back[i]) backN++
    onStat({
      depth: Math.max(0, s.stack.length - 1), visited: visitedN, back: backN,
      pathLen: phase === 'done' && found ? Math.max(0, path.length - 1) : '—',
      phase, found,
    })
  }

  function endHead() { return foundAt >= 0 ? foundAt + 1 : events.length }

  function tick() {
    if (!playing) { ticker.reset(); return }
    const n = ticker.advance(st.speed)
    if (!n) return
    if (phase === 'idle') phase = 'search'
    if (phase === 'search') {
      head += n
      if (head >= endHead()) { head = endHead(); phase = 'done'; playing = false }
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
    play() { if (phase === 'done') { head = 0; phase = 'idle' } playing = true },
    pause() { playing = false },
    step() {
      playing = false
      if (phase === 'done') { head = 0; phase = 'idle' }
      if (phase === 'idle') phase = 'search'
      if (phase === 'search') { head = Math.min(endHead(), head + 1); if (head >= endHead()) phase = 'done' }
      emit()
    },
    reset() { playing = false; head = 0; phase = 'idle'; emit() },
    setSpeed(v) { st.speed = v },
    setTool(t) { st.tool = t },
    setSize(n) { st.cols = n; st.rows = Math.max(8, Math.round((n * 2) / 3)); reseed(); clearTrace(); emitEdit() },
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
