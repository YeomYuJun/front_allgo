import { describe, it, expect } from 'vitest'
import { reduceRatio } from '../lissajous.js'

describe('lissajous lib', () => {
  it('reduceRatio reduces by gcd', () => {
    expect(reduceRatio(3, 2)).toEqual([3, 2])
    expect(reduceRatio(2, 4)).toEqual([1, 2])
    expect(reduceRatio(6, 9)).toEqual([2, 3])
    expect(reduceRatio(5, 5)).toEqual([1, 1])
  })
})
