import { ref } from 'vue'

// trace-replay 랩 공통 실행기. Step/Play가 trace 미주입(dirty) 상태에서도
// 자동으로 solve -> setTrace 후 이어지도록 Run/Play/Pause/Step/Reset을 한 곳에서 배선한다.
// solve(lab)는 백엔드를 호출해 lab.setTrace()에 넣을 trace를 반환해야 한다.
export function useTraceRunner({ getLab, solve }) {
  const dirty = ref(true)
  const running = ref(false)

  async function ensureTrace() {
    const lab = getLab()
    if (!lab) return false
    if (!dirty.value) return true
    if (running.value) return false
    running.value = true
    try {
      const trace = await solve(lab)
      const l = getLab()
      if (!l) return false
      l.setTrace(trace)
      dirty.value = false
      return true
    } catch (e) {
      console.error('trace solve failed:', e)
      return false
    } finally {
      running.value = false
    }
  }

  async function run() {
    dirty.value = true
    if (await ensureTrace()) getLab()?.play()
  }

  async function play() {
    if (await ensureTrace()) getLab()?.play()
  }

  async function step() {
    if (await ensureTrace()) getLab()?.step()
  }

  function pause() { getLab()?.pause() }
  function reset() { getLab()?.reset() }
  function markDirty() { dirty.value = true }
  function markClean() { dirty.value = false }

  return { dirty, running, ensureTrace, run, play, step, pause, reset, markDirty, markClean }
}
