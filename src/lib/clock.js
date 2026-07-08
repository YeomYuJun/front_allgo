// 시간 기반 진행량 계산기. RAF 프레임마다 advance(stepsPerSec)를 호출하면
// 경과 시간에 비례한 정수 스텝 수를 반환한다 (소수 잔여분은 다음 프레임으로 누적).
// 탭 전환 등으로 프레임이 오래 끊겨도 몰아서 진행하지 않도록 dt를 maxDt로 제한한다.
export function makeTicker(maxDt = 0.25) {
  let last = null
  let acc = 0
  return {
    reset() { last = null; acc = 0 },
    advance(stepsPerSec) {
      const now = performance.now()
      if (last == null) { last = now; return 0 }
      const dt = Math.min((now - last) / 1000, maxDt)
      last = now
      acc += dt * stepsPerSec
      const n = Math.floor(acc)
      acc -= n
      return n
    },
  }
}
