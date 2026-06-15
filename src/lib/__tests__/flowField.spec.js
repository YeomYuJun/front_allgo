import { describe, it, expect } from 'vitest'
import { spawn, outOfBounds } from '../flowField.js'

describe('flowField lib', () => {
  it('spawn is within field bounds', () => {
    for (let i = 0; i < 20; i++) {
      const [x, y] = spawn(100)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(100)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(100)
    }
  })

  it('outOfBounds detects points outside the field', () => {
    expect(outOfBounds(-1, 50, 100)).toBe(true)
    expect(outOfBounds(50, 101, 100)).toBe(true)
    expect(outOfBounds(50, 50, 100)).toBe(false)
  })
})
