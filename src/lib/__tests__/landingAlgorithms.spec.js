import { describe, it, expect } from 'vitest'
import { ALGOS } from '../landingAlgorithms.js'

const ROUTES = [
  '/plotter', '/fourier', '/fractal', '/monte-carlo', '/bezier',
  '/flow', '/cellular-automata', '/lissajous', '/double-pendulum', '/voronoi',
]

describe('landingAlgorithms', () => {
  it('lists 10 algorithms', () => {
    expect(ALGOS).toHaveLength(10)
  })

  it('has sequential idx 01..10', () => {
    expect(ALGOS.map((a) => a.idx)).toEqual(
      ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
    )
  })

  it('every entry has required non-empty fields', () => {
    for (const a of ALGOS) {
      expect(a.key).toBeTruthy()
      expect(a.name).toBeTruthy()
      expect(a.eq).toBeTruthy()
      expect(a.desc).toBeTruthy()
      expect(a.route).toBeTruthy()
      expect(Array.isArray(a.tags)).toBe(true)
    }
  })

  it('routes are within the known whitelist', () => {
    for (const a of ALGOS) expect(ROUTES).toContain(a.route)
  })

  it('keys are unique', () => {
    const keys = ALGOS.map((a) => a.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
