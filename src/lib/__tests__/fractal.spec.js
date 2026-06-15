import { describe, it, expect } from 'vitest'
import { TYPES, COLOR_SCHEMES, span, defaultView, clampZoom } from '../fractal.js'

describe('fractal lib', () => {
  it('exposes types and color schemes', () => {
    expect(TYPES.map((t) => t.value)).toEqual(['mandelbrot', 'julia'])
    expect(COLOR_SCHEMES.length).toBe(5)
  })

  it('span is 4/zoom (BE square range)', () => {
    expect(span(1)).toBeCloseTo(4, 10)
    expect(span(2)).toBeCloseTo(2, 10)
  })

  it('defaultView centers each type at zoom 1', () => {
    expect(defaultView('mandelbrot')).toEqual({ centerX: -0.6, centerY: 0, zoom: 1 })
    expect(defaultView('julia').centerX).toBe(0)
  })

  it('clampZoom keeps zoom within [1, 4096]', () => {
    expect(clampZoom(0.2)).toBe(1)
    expect(clampZoom(9999)).toBe(4096)
    expect(clampZoom(10)).toBe(10)
  })
})
