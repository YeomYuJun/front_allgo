export const FUNCTIONS = [
  { value: 'bowl', label: 'Paraboloid', expr: 'x²+y²' },
  { value: 'saddle', label: 'Saddle', expr: 'x²−y²' },
  { value: 'monkey', label: 'Monkey saddle', expr: 'x³−3xy²' },
  { value: 'gaussian', label: 'Gaussian well', expr: '−e^−(x²+y²)' },
  { value: 'ripple', label: 'Ripple', expr: '0.1(x²+y²)+0.2 sinx siny' },
  { value: 'rosenbrock', label: 'Rosenbrock', expr: '(1−x)²+100(y−x²)²' },
]

export function normalize(h, zMin, zMax) {
  if (zMax - zMin < 1e-9) return 0.5
  return (h - zMin) / (zMax - zMin)
}

function lerp(a, b, t) { return a + (b - a) * t }

// height ramp: low deep-teal to high lime. t in [0,1] -> [r,g,b] in [0,1]
export function heightColor(t) {
  const c = Math.max(0, Math.min(1, t))
  return [lerp(0.26, 0.78, c), lerp(0.38, 1.0, c), lerp(0.44, 0.0, c)]
}
