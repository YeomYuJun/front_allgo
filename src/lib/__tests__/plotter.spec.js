import { describe, it, expect } from 'vitest'
import { FUNCTIONS, normalize, heightColor } from '../plotter.js'

describe('plotter lib', () => {
  it('FUNCTIONS keys match the BE catalog', () => {
    expect(FUNCTIONS.map((f) => f.value)).toEqual(['bowl', 'saddle', 'monkey', 'gaussian', 'ripple', 'rosenbrock'])
    expect(FUNCTIONS.every((f) => f.label && f.expr)).toBe(true)
  })

  it('normalize maps [zMin,zMax] to [0,1]', () => {
    expect(normalize(5, 0, 10)).toBeCloseTo(0.5, 10)
    expect(normalize(0, 0, 10)).toBe(0)
    expect(normalize(10, 0, 10)).toBe(1)
  })

  it('normalize handles a flat range', () => {
    expect(normalize(3, 3, 3)).toBe(0.5)
  })

  it('heightColor varies low to high within [0,1] channels', () => {
    const lo = heightColor(0)
    const hi = heightColor(1)
    expect(lo).not.toEqual(hi)
    for (const v of [...lo, ...hi]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})
