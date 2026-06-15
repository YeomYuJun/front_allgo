import { describe, it, expect } from 'vitest'
import { PRESETS, deCasteljau } from '../bezier.js'

describe('bezier lib', () => {
  it('PRESETS have degree+1 points', () => {
    expect(PRESETS[2].length).toBe(3)
    expect(PRESETS[3].length).toBe(4)
    expect(PRESETS[4].length).toBe(5)
  })

  it('deCasteljau on a line: midpoint at t=0.5', () => {
    const layers = deCasteljau([[0, 0], [1, 1]], 0.5)
    expect(layers.length).toBe(2)
    expect(layers[0]).toEqual([[0, 0], [1, 1]])
    expect(layers[1][0][0]).toBeCloseTo(0.5, 10)
    expect(layers[1][0][1]).toBeCloseTo(0.5, 10)
  })

  it('deCasteljau quadratic tip at t=0.5', () => {
    const layers = deCasteljau([[0, 0], [0.5, 1], [1, 0]], 0.5)
    const tip = layers[layers.length - 1][0]
    expect(tip[0]).toBeCloseTo(0.5, 10)
    expect(tip[1]).toBeCloseTo(0.5, 10)
  })

  it('layer count equals number of points', () => {
    expect(deCasteljau([[0, 0], [1, 1], [2, 0], [3, 1]], 0.3).length).toBe(4)
  })

  it('tip interpolates endpoints at t=0 and t=1', () => {
    const cp = [[0.1, 0.8], [0.3, 0.2], [0.9, 0.3]]
    const at0 = deCasteljau(cp, 0).pop()[0]
    const at1 = deCasteljau(cp, 1).pop()[0]
    expect(at0[0]).toBeCloseTo(0.1, 10)
    expect(at0[1]).toBeCloseTo(0.8, 10)
    expect(at1[0]).toBeCloseTo(0.9, 10)
    expect(at1[1]).toBeCloseTo(0.3, 10)
  })
})
