// 순수 진자 헬퍼. 피벗 원점, x=L·sinθ, y=-L·cosθ (아래로 매닮). L1=1, L2=ratio.
export function degToRad(d) {
  return (d * Math.PI) / 180
}

export function tip(bob, ratio) {
  const x1 = Math.sin(bob.t1)
  const y1 = -Math.cos(bob.t1)
  return { x1, y1, x2: x1 + ratio * Math.sin(bob.t2), y2: y1 - ratio * Math.cos(bob.t2) }
}

export function divergence(a, b, ratio) {
  const ta = tip(a, ratio)
  const tb = tip(b, ratio)
  return Math.hypot(ta.x2 - tb.x2, ta.y2 - tb.y2)
}
