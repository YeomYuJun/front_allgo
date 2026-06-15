import { describe, it, expect } from 'vitest'
import { randomSites, siteColor } from '../voronoi.js'

describe('voronoi lib', () => {
  it('randomSites makes n points within [0,1]', () => {
    const s = randomSites(12)
    expect(s.length).toBe(12)
    for (const [x, y] of s) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(1)
    }
  })

  it('siteColor returns 3 bytes that vary by index', () => {
    const c0 = siteColor(0)
    expect(c0.length).toBe(3)
    expect(c0).not.toEqual(siteColor(1))
    for (const v of c0) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(255)
    }
  })
})
