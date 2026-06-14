import { ref, getCurrentInstance, onBeforeUnmount } from 'vue'

// stateless 배치 simulate 오케스트레이션: 버퍼를 채우고 speed에 맞춰 한 step씩 진행.
// CA(grid)와 Pendulum(angle pair)이 step 타입만 바꿔 공유.
export function useSimulation({ fetchBatch, onStep, batch = 60, initialSpeed = 10 }) {
  const playing = ref(false)
  const count = ref(0)
  const speed = ref(initialSpeed)

  let current = null
  let buffer = []
  let fetching = false
  let timer = null
  let disposed = false

  async function ensureBuffer() {
    if (buffer.length || fetching || current == null) return
    fetching = true
    try {
      buffer = (await fetchBatch(current, batch)) || []
    } catch (e) {
      console.error('simulate failed:', e)
      pause()
    } finally {
      fetching = false
    }
  }

  async function advanceOne() {
    if (disposed) return
    if (!buffer.length) await ensureBuffer()
    if (disposed || !buffer.length) return
    current = buffer.shift()
    count.value += 1
    onStep(current)
  }

  function scheduleNext() {
    if (!playing.value || disposed) return
    timer = setTimeout(async () => {
      await advanceOne()
      scheduleNext()
    }, 1000 / speed.value)
  }

  function play() {
    if (playing.value || disposed) return
    playing.value = true
    scheduleNext()
  }

  function pause() {
    playing.value = false
    if (timer) { clearTimeout(timer); timer = null }
  }

  async function step() {
    if (playing.value) return
    await advanceOne()
  }

  function reset(state) {
    pause()
    current = state
    buffer = []
    count.value = 0
    onStep(current)
  }

  function invalidate() { buffer = [] }

  function dispose() {
    disposed = true
    pause()
  }

  if (getCurrentInstance()) onBeforeUnmount(dispose)

  return {
    playing, count, speed,
    get current() { return current },
    play, pause, step, reset, invalidate, dispose,
  }
}
