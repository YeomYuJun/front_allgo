import { describe, it, expect } from 'vitest'
import { createEmpty, randomGrid, countPopulation, cloneGrid, placeGlider } from '../lifeGrid.js'

describe('lifeGrid', () => {
  it('createEmpty makes h rows x w cols of false', () => {
    const g = createEmpty(4, 3)
    expect(g.length).toBe(3)
    expect(g[0].length).toBe(4)
    expect(g.flat().every((c) => c === false)).toBe(true)
  })

  it('countPopulation counts alive cells', () => {
    const g = [[true, false], [true, true]]
    expect(countPopulation(g)).toBe(3)
  })

  it('placeGlider sets exactly 5 alive cells', () => {
    const g = createEmpty(10, 10)
    placeGlider(g, 1, 1)
    expect(countPopulation(g)).toBe(5)
  })

  it('randomGrid has correct dimensions', () => {
    const g = randomGrid(5, 6, 0.5)
    expect(g.length).toBe(6)
    expect(g[0].length).toBe(5)
  })

  it('cloneGrid is a deep copy', () => {
    const g = [[true, false]]
    const c = cloneGrid(g)
    c[0][0] = false
    expect(g[0][0]).toBe(true)
  })
})
