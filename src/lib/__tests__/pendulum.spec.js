import { describe, it, expect } from 'vitest'
import { degToRad, tip, divergence } from '../pendulum.js'

describe('pendulum lib', () => {
  it('degToRad converts degrees to radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10)
    expect(degToRad(0)).toBe(0)
  })

  it('tip returns joint and bob positions (pivot at origin)', () => {
    const t = tip({ t1: 0, t2: 0, w1: 0, w2: 0 }, 1)
    expect(t.x1).toBeCloseTo(0, 10)
    expect(t.y1).toBeCloseTo(-1, 10)
    expect(t.x2).toBeCloseTo(0, 10)
    expect(t.y2).toBeCloseTo(-2, 10)
  })

  it('tip respects arm ratio', () => {
    const t = tip({ t1: 0, t2: 0, w1: 0, w2: 0 }, 0.5)
    expect(t.y2).toBeCloseTo(-1.5, 10)
  })

  it('divergence is zero for identical bobs and positive otherwise', () => {
    const a = { t1: 1, t2: 1, w1: 0, w2: 0 }
    expect(divergence(a, a, 1)).toBeCloseTo(0, 10)
    expect(divergence(a, { t1: 1.2, t2: 1, w1: 0, w2: 0 }, 1)).toBeGreaterThan(0)
  })
})
