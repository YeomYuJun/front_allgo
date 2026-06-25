import { describe, it, expect } from 'vitest'
import { escapeIter, viewRanges } from '../fractalEscape.js'

describe('escapeIter', () => {
  it('origin is inside the Mandelbrot set (returns maxIter)', () => {
    expect(escapeIter('mandelbrot', 0, 0, 100)).toBe(100)
  })

  it('far point escapes almost immediately', () => {
    expect(escapeIter('mandelbrot', 2, 2, 100)).toBeLessThan(5)
  })

  it('Julia returns a count in [0, maxIter]', () => {
    const n = escapeIter('julia', 0, 0, 100, -0.745, 0.113)
    expect(n).toBeGreaterThanOrEqual(0)
    expect(n).toBeLessThanOrEqual(100)
  })

  it('Burning Ship treats a far point as escaped', () => {
    expect(escapeIter('burningship', 3, 3, 100)).toBeLessThan(5)
  })

  it('default Julia constants are used when omitted', () => {
    const withDefaults = escapeIter('julia', 0.5, 0.5, 200)
    const withExplicit = escapeIter('julia', 0.5, 0.5, 200, -0.745, 0.113)
    expect(withDefaults).toBe(withExplicit)
  })
})

describe('viewRanges', () => {
  it('produces symmetric ranges for centred square view', () => {
    const r = viewRanges(0, 0, 2, 100, 100)
    expect(r.x0).toBeCloseTo(-1)
    expect(r.x1).toBeCloseTo(1)
    expect(r.y0).toBeCloseTo(-1)
    expect(r.y1).toBeCloseTo(1)
  })

  it('respects non-square aspect ratio', () => {
    // W=200, H=100, span=2 => upp=0.02, hx=2, hy=1
    const r = viewRanges(0, 0, 2, 200, 100)
    expect(r.x0).toBeCloseTo(-2)
    expect(r.x1).toBeCloseTo(2)
    expect(r.y0).toBeCloseTo(-1)
    expect(r.y1).toBeCloseTo(1)
  })

  it('offsets correctly when centre is non-zero', () => {
    const r = viewRanges(1, 2, 2, 100, 100)
    expect(r.x0).toBeCloseTo(0)
    expect(r.x1).toBeCloseTo(2)
    expect(r.y0).toBeCloseTo(1)
    expect(r.y1).toBeCloseTo(3)
  })
})
