export const PRESETS = {
  2: [[0.12, 0.78], [0.5, 0.18], [0.88, 0.72]],
  3: [[0.10, 0.78], [0.32, 0.18], [0.68, 0.86], [0.90, 0.28]],
  4: [[0.08, 0.7], [0.28, 0.2], [0.5, 0.85], [0.72, 0.2], [0.92, 0.7]],
}

/** de Casteljau 레이어들. layers[0]=입력 점, 마지막 레이어의 단일 점=곡선 위의 점. */
export function deCasteljau(points, t) {
  let layer = points.map((p) => p.slice())
  const layers = [layer]
  while (layer.length > 1) {
    const next = []
    for (let i = 0; i < layer.length - 1; i++) {
      next.push([
        layer[i][0] + (layer[i + 1][0] - layer[i][0]) * t,
        layer[i][1] + (layer[i + 1][1] - layer[i][1]) * t,
      ])
    }
    layers.push(next)
    layer = next
  }
  return layers
}
