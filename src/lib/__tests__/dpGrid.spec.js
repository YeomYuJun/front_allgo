import { describe, it, expect } from 'vitest'
import { randomGrid, cycleValue } from '../dpGrid.js'

describe('dpGrid', () => {
  it('randomGrid(4) returns a 4×4 grid with every value in 1..9', () => {
    const g = randomGrid(4)
    expect(g).toHaveLength(4)
    for (const row of g) {
      expect(row).toHaveLength(4)
      for (const v of row) {
        expect(v).toBeGreaterThanOrEqual(1)
        expect(v).toBeLessThanOrEqual(9)
      }
    }
  })

  it('cycleValue(9) === 1', () => {
    expect(cycleValue(9)).toBe(1)
  })

  it('cycleValue(3) === 4', () => {
    expect(cycleValue(3)).toBe(4)
  })
})
