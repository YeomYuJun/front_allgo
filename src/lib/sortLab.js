/* Sort lab - 2D canvas bar renderer + animation. Compute lives on the BE;
   this module only holds the local array and replays an injected event trace
   (compare/swap/write/pivot/lock). */

const ACC = '#c8ff00'
const WARN = '#ffb224'

export function createSortLab(canvas, opts = {}) {
  const ctx = canvas.getContext('2d')
  const onStat = opts.onStat || null

  let dpr = 1, W = 0, H = 0
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = canvas.clientWidth; H = canvas.clientHeight
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const st = { speed: 6 }
  let base = [], cur = []
  let events = [], head = 0, phase = 'idle', playing = false, raf = null, alive = false
  let locked = null, pivot = -1, hotA = -1, hotB = -1, hotType = ''
  let cmp = 0, swp = 0, wrt = 0

  function resetState() {
    cur = base.slice()
    locked = new Uint8Array(base.length)
    pivot = -1; hotA = -1; hotB = -1; hotType = ''
    cmp = 0; swp = 0; wrt = 0
  }

  function applyEvent(e) {
    if (e.type === 'compare') { cmp++; hotA = e.a; hotB = e.b; hotType = 'compare' }
    else if (e.type === 'swap') {
      swp++
      const t = cur[e.a]; cur[e.a] = cur[e.b]; cur[e.b] = t
      hotA = e.a; hotB = e.b; hotType = 'swap'
    } else if (e.type === 'write') { wrt++; cur[e.a] = e.b; hotA = e.a; hotB = -1; hotType = 'write' }
    else if (e.type === 'pivot') { pivot = e.a }
    else if (e.type === 'lock') { locked[e.a] = 1; if (pivot === e.a) pivot = -1 }
  }

  function seekTo(target) {
    if (target < head) { resetState() } else { target = Math.max(target, head) }
    const from = target < head ? 0 : head
    for (let k = from; k < target && k < events.length; k++) applyEvent(events[k])
    head = Math.min(target, events.length)
  }

  function setData(values) {
    base = values.slice()
    events = []; head = 0; phase = 'idle'; playing = false
    resetState()
    emit()
  }

  function setTrace(t) {
    events = t.events || []
    head = 0; phase = 'idle'; playing = false
    resetState()
    emit()
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)
    const n = cur.length
    if (!n) return
    let vmax = 1
    for (let i = 0; i < n; i++) if (Math.abs(cur[i]) > vmax) vmax = Math.abs(cur[i])
    const padX = 18, padTop = 26, padBot = 22
    const bw = (W - padX * 2) / n
    const h0 = H - padBot
    const scaleH = (H - padTop - padBot)
    for (let i = 0; i < n; i++) {
      const v = cur[i]
      const bh = Math.max(2, (Math.abs(v) / vmax) * scaleH)
      const x = padX + i * bw, y = h0 - bh
      let fill = 'rgba(120,140,150,0.42)'
      if (locked[i]) fill = 'rgba(200,255,0,0.34)'
      if (i === pivot) fill = 'rgba(255,178,36,0.75)'
      if ((i === hotA || i === hotB) && phase !== 'idle' && head < events.length) {
        fill = hotType === 'compare' ? '#e8ecef' : ACC
      }
      if (phase === 'done') fill = 'rgba(200,255,0,0.55)'
      ctx.fillStyle = fill
      ctx.fillRect(x + 1, y, Math.max(1, bw - 2), bh)
    }
    if (pivot >= 0 && phase !== 'done') {
      const x = padX + pivot * bw + bw / 2
      ctx.fillStyle = WARN
      ctx.font = "10px 'Space Mono', monospace"
      ctx.textAlign = 'center'
      ctx.fillText('pivot', x, padTop - 12)
    }
  }

  function emit() {
    if (!onStat) return
    onStat({
      comparisons: cmp, swaps: swp, writes: wrt,
      progress: events.length ? Math.min(head, events.length) : 0,
      total: events.length, phase, n: cur.length,
    })
  }

  function tick() {
    if (!playing) return
    if (phase === 'idle') phase = 'run'
    if (phase === 'run') {
      seekTo(head + st.speed)
      if (head >= events.length) { phase = 'done'; playing = false }
    }
    emit()
  }
  function loop() { if (!alive) return; tick(); draw(); raf = requestAnimationFrame(loop) }

  window.addEventListener('resize', resize)
  resize(); alive = true; emit(); loop()

  return {
    setData, setTrace,
    isPlaying() { return playing },
    getValues() { return base.slice() },
    play() { if (!events.length) return; if (phase === 'done') { head = 0; phase = 'idle'; resetState() } playing = true },
    pause() { playing = false },
    step() {
      if (!events.length) return
      playing = false
      if (phase === 'idle') phase = 'run'
      seekTo(head + 1)
      if (head >= events.length) phase = 'done'
      emit()
    },
    reset() { playing = false; head = 0; phase = 'idle'; resetState(); emit() },
    setSpeed(v) { st.speed = v },
    dispose() {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    },
  }
}
