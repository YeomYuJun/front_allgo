import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../api'
import { integrate } from '../monteCarloApi'

describe('monteCarloApi.integrate', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('posts to /monte-carlo/integrate and returns response data', async () => {
    const data = { totalCount: 1000, insideCount: 785, estimate: 3.14, actualValue: 3.1416, convergenceHistory: [], points: [] }
    const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({ data })
    const payload = { iterations: 1000, bounds: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 }, functionType: 'square' }
    const result = await integrate(payload)
    expect(spy).toHaveBeenCalledWith('/monte-carlo/integrate', payload)
    expect(result).toEqual(data)
  })
})
