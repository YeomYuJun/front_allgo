import { describe, it, expect } from 'vitest'
import { makeSaddle, previews } from '../landingViz.js'
import { ALGOS } from '../landingAlgorithms.js'

describe('landingViz', () => {
  it('exposes makeSaddle and 12 preview factories', () => {
    expect(typeof makeSaddle).toBe('function')
    expect(Object.keys(previews)).toHaveLength(12)
  })

  it('has a preview factory for every ALGOS key', () => {
    expect(ALGOS.every((a) => typeof previews[a.key] === 'function')).toBe(true)
  })
})
