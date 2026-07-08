import { makeTicker } from './clock.js'

// 표준 trace envelope({ meta, frames })의 공통 재생 엔진.
// 그리기/통계는 문제 모듈의 renderer가 담당: { draw(ctx, view), stat(view) }
// view = { meta, frames, head, phase, W, H, input }
export function createFrameLab(canvas, opts = {}) {
  const ctx = canvas.getContext('2d')
  const renderer = opts.renderer
  const onStat = opts.onStat || null
  const getInput = opts.getInput || (() => null)

  let dpr = 1, W = 0, H = 0
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = canvas.clientWidth; H = canvas.clientHeight
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const st = { speed: opts.speed || 4 }
  const ticker = makeTicker()
  let meta = {}, frames = []
  let head = 0, phase = 'idle', playing = false, raf = null, alive = false

  function view() {
    return {
      meta, frames,
      head: phase === 'idle' ? 0 : Math.min(head, frames.length),
      phase, W, H, input: getInput(),
    }
  }

  function emit() { if (onStat && renderer.stat) onStat(renderer.stat(view())) }

  function setTrace(t) {
    meta = (t && t.meta) || {}
    frames = (t && t.frames) || []
    head = 0; phase = 'idle'
    emit()
  }

  function clearTrace() { meta = {}; frames = []; head = 0; phase = 'idle'; emit() }

  function tick() {
    if (!playing) { ticker.reset(); return }
    const n = ticker.advance(st.speed)
    if (!n) return
    if (phase === 'idle') phase = 'run'
    if (phase === 'run') {
      head += n
      if (head >= frames.length) { head = frames.length; phase = 'done'; playing = false }
    }
    emit()
  }

  function draw() { ctx.clearRect(0, 0, W, H); renderer.draw(ctx, view()) }
  function loop() { if (!alive) return; tick(); draw(); raf = requestAnimationFrame(loop) }

  window.addEventListener('resize', resize)
  resize(); alive = true; emit(); loop()

  return {
    setTrace, clearTrace,
    isPlaying() { return playing },
    play() { if (!frames.length) return; if (phase === 'done') { head = 0; phase = 'idle' } playing = true },
    pause() { playing = false },
    step() {
      if (!frames.length) return
      playing = false
      if (phase === 'done') { head = 0; phase = 'idle' }
      if (phase === 'idle') phase = 'run'
      head = Math.min(frames.length, head + 1)
      if (head >= frames.length) phase = 'done'
      emit()
    },
    reset() { playing = false; head = 0; phase = 'idle'; emit() },
    setSpeed(v) { st.speed = v },
    dispose() {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    },
  }
}
