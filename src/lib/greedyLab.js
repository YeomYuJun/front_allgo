/* Greedy lab - 2D canvas renderer + animation. Compute lives on the BE;
   this module only generates the task set locally and replays an injected trace.
   Ported from Allgomath-publish/greedy-lab.js. */

const ACC = '#c8ff00'
const T = 100

export function createGreedyLab(canvas, opts = {}) {
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

  const st = { count: 9, strategy: 'finish', speed: 1 }
  let tasks = []

  // injected trace (empty until setTrace)
  let order = [], decided = [], optimalCount = 0
  let head = 0, phase = 'idle', playing = false, raf = null, alive = false, frameC = 0

  const padX = 54, padTop = 26, padBot = 40

  function gen() {
    tasks = []
    for (let i = 0; i < st.count; i++) {
      const s = Math.floor(Math.random() * (T - 14))
      const dur = 6 + Math.floor(Math.random() * 26)
      tasks.push({ id: i, s, e: Math.min(T, s + dur) })
    }
    clearTrace(); emitEdit()
  }

  function clearTrace() {
    order = []; decided = []; optimalCount = 0; head = 0; phase = 'idle'
    emit()
  }

  function emitEdit() { if (onEdit) onEdit() }

  function resetAnim() { head = 0; phase = 'idle'; emit() }

  function getState() {
    return {
      tasks: tasks.map((t) => ({ s: t.s, e: t.e })),
      strategy: st.strategy,
    }
  }

  function setTrace(t) {
    order = t.order || []; decided = t.decisions || []; optimalCount = t.optimal || 0
    head = 0; phase = 'idle'
    emit()
  }

  function xOf(time) { return padX + (time / T) * (W - padX - 20) }
  function laneGeom() {
    const top = padTop, bot = H - padBot
    const lh = (bot - top) / st.count
    return { top, lh }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
  }

  function geom_axis() {
    ctx.clearRect(0, 0, W, H)
    const y = H - padBot
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(padX, y + 12); ctx.lineTo(W - 20, y + 12); ctx.stroke()
    ctx.fillStyle = 'rgba(98,102,108,0.9)'; ctx.font = "10px 'Space Mono', monospace"
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    for (let tk = 0; tk <= T; tk += 20) {
      const x = xOf(tk)
      ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.lineTo(x, y + 15); ctx.stroke()
      ctx.fillText(tk, x, y + 18)
    }
    ctx.textAlign = 'left'; ctx.fillText('time →', padX, y + 18)
  }

  function draw() {
    geom_axis()
    const { top, lh } = laneGeom()
    const decN = phase === 'idle' ? 0 : Math.min(head, decided.length)
    // map task idx -> decision (only for decided ones)
    const decision = {}; let lastEnd = -1
    for (let k = 0; k < decN; k++) { decision[decided[k].idx] = decided[k]; lastEnd = decided[k].lastEnd }
    const currentIdx = (phase === 'scan' && decN > 0) ? decided[decN - 1].idx : -1

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      const lane = t.id
      const y = top + lane * lh + lh * 0.18, bh = lh * 0.64
      const x0 = xOf(t.s), x1 = xOf(t.e)
      const d = decision[i]
      let fill, stroke
      if (!d) { fill = 'rgba(255,255,255,0.04)'; stroke = 'rgba(255,255,255,0.16)' }
      else if (d.accepted) { fill = 'rgba(200,255,0,0.9)'; stroke = ACC }
      else { fill = 'rgba(150,60,60,0.18)'; stroke = 'rgba(190,80,80,0.55)' }
      roundRect(x0, y, x1 - x0, bh, Math.min(6, bh / 2))
      ctx.fillStyle = fill; ctx.fill()
      ctx.lineWidth = i === currentIdx ? 2.4 : 1.2
      ctx.strokeStyle = i === currentIdx ? '#fff' : stroke; ctx.stroke()
      // rejected hatch
      if (d && !d.accepted) {
        ctx.save(); ctx.beginPath(); roundRect(x0, y, x1 - x0, bh, Math.min(6, bh / 2)); ctx.clip()
        ctx.strokeStyle = 'rgba(190,80,80,0.5)'; ctx.lineWidth = 1
        for (let xx = x0 - bh; xx < x1; xx += 7) {
          ctx.beginPath(); ctx.moveTo(xx, y + bh); ctx.lineTo(xx + bh, y); ctx.stroke()
        }
        ctx.restore()
      }
      // label
      if (lh > 18) {
        ctx.fillStyle = d && d.accepted ? '#0a0b0c' : 'rgba(154,158,164,0.85)'
        ctx.font = `${Math.min(12, Math.round(lh * 0.34))}px 'Space Mono', monospace`
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        if (x1 - x0 > 26) ctx.fillText('t' + t.id, x0 + 6, y + bh / 2)
      }
    }
    // lastEnd marker
    if (phase !== 'idle' && lastEnd >= 0) {
      const lx = xOf(lastEnd)
      ctx.strokeStyle = 'rgba(200,255,0,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4])
      ctx.beginPath(); ctx.moveTo(lx, padTop - 6); ctx.lineTo(lx, H - padBot + 6); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = 'rgba(200,255,0,0.75)'; ctx.font = "10px 'Space Mono', monospace"; ctx.textAlign = 'center'
      ctx.fillText('last end', lx, padTop - 10)
    }
  }

  function emit() {
    if (!onStat) return
    const decN = phase === 'idle' ? 0 : Math.min(head, decided.length)
    let sel = 0; for (let k = 0; k < decN; k++) if (decided[k].accepted) sel++
    onStat({
      considered: decN, total: tasks.length, selected: sel, optimal: optimalCount,
      strategy: st.strategy, phase,
    })
  }

  function tick() {
    if (!playing) return
    frameC++
    const every = Math.max(1, 9 - st.speed * 2)
    if (frameC % every !== 0) return
    if (phase === 'idle') phase = 'scan'
    if (phase === 'scan') {
      head++
      if (head >= decided.length) { head = decided.length; phase = 'done'; playing = false }
    }
    emit()
  }

  function loop() { if (!alive) return; tick(); draw(); raf = requestAnimationFrame(loop) }

  function onClick() { if (!playing) api.step() }

  canvas.addEventListener('click', onClick)
  window.addEventListener('resize', resize)

  resize(); gen(); alive = true; loop()

  const api = {
    getState,
    setTrace,
    isPlaying() { return playing },
    play() { if (phase === 'done') resetAnim(); playing = true },
    pause() { playing = false },
    step() {
      playing = false
      if (phase === 'idle') phase = 'scan'
      if (phase === 'scan') {
        head = Math.min(decided.length, head + 1)
        if (head >= decided.length) phase = 'done'
      }
      emit()
    },
    reset() { playing = false; resetAnim() },
    setCount(n) { st.count = n; gen() },
    setStrategy(s) { st.strategy = s; clearTrace(); emitEdit() },
    setSpeed(v) { st.speed = v },
    randomize() { gen() },
    dispose() {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('resize', resize)
    },
  }
  return api
}
