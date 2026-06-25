import { describe, it, expect } from 'vitest'
import { idx, inBounds, emptyWalls, randomMaze } from '../bfsGrid.js'

describe('bfsGrid', () => {
  it('idx maps row/col to flat index', () => {
    expect(idx(0, 0, 4)).toBe(0)
    expect(idx(3, 3, 4)).toBe(15)
    expect(idx(2, 1, 5)).toBe(11)
  })

  it('inBounds respects grid edges', () => {
    expect(inBounds(0, 0, 4, 4)).toBe(true)
    expect(inBounds(-1, 0, 4, 4)).toBe(false)
    expect(inBounds(4, 0, 4, 4)).toBe(false)
    expect(inBounds(0, 4, 4, 4)).toBe(false)
  })

  it('emptyWalls is all-false of the right length', () => {
    const w = emptyWalls(4, 5)
    expect(w.length).toBe(20)
    expect(w.every((x) => x === false)).toBe(true)
  })

  it('randomMaze keeps start and goal open and matches grid length', () => {
    const w = randomMaze(8, 8, 1, 3, 60) // density 1 => everything wall except start/goal
    expect(w.length).toBe(64)
    expect(w[3]).toBe(false)
    expect(w[60]).toBe(false)
  })
})
