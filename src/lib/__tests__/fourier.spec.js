import { describe, it, expect } from 'vitest'
import { idealWave } from '../fourier.js'

describe('fourier lib', () => {
  it('square is +/-1 by sign of sin', () => {
    expect(idealWave('square', 1)).toBe(1)
    expect(idealWave('square', 4)).toBe(-1)
  })

  it('saw ramps linearly within [-1,1]', () => {
    expect(idealWave('saw', 0)).toBeCloseTo(0, 10)
    expect(idealWave('saw', Math.PI / 2)).toBeCloseTo(0.5, 10)
  })

  it('triangle peaks at 1 at pi/2', () => {
    expect(idealWave('triangle', Math.PI / 2)).toBeCloseTo(1, 10)
    expect(idealWave('triangle', 0)).toBeCloseTo(0, 10)
  })
})
