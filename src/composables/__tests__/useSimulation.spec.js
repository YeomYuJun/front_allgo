import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSimulation } from '../useSimulation.js'

describe('useSimulation', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reset renders initial state and zeroes count', async () => {
    const seen = []
    const sim = useSimulation({ fetchBatch: vi.fn(), onStep: (s) => seen.push(s), batch: 3, initialSpeed: 10 })
    sim.reset('init')
    expect(seen).toEqual(['init'])
    expect(sim.count.value).toBe(0)
    sim.dispose()
  })

  it('play advances steps from fetched batch at speed', async () => {
    const fetchBatch = vi.fn(async () => ['a', 'b', 'c'])
    const seen = []
    const sim = useSimulation({ fetchBatch, onStep: (s) => seen.push(s), batch: 3, initialSpeed: 10 })
    sim.reset('init')
    sim.play()
    await vi.advanceTimersByTimeAsync(100)
    expect(fetchBatch).toHaveBeenCalledWith('init', 3)
    expect(seen).toEqual(['init', 'a'])
    expect(sim.count.value).toBe(1)
    await vi.advanceTimersByTimeAsync(200)
    expect(seen).toEqual(['init', 'a', 'b', 'c'])
    sim.pause()
    await vi.advanceTimersByTimeAsync(500)
    expect(seen.length).toBe(4)
    sim.dispose()
  })

  it('refetches a new batch when buffer drains', async () => {
    const fetchBatch = vi.fn().mockResolvedValueOnce(['a']).mockResolvedValueOnce(['b'])
    const seen = []
    const sim = useSimulation({ fetchBatch, onStep: (s) => seen.push(s), batch: 1, initialSpeed: 10 })
    sim.reset('init')
    sim.play()
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(100)
    expect(fetchBatch).toHaveBeenCalledTimes(2)
    expect(seen).toEqual(['init', 'a', 'b'])
    sim.dispose()
  })

  it('reset clears buffer and pauses', async () => {
    const fetchBatch = vi.fn(async () => ['a', 'b'])
    const seen = []
    const sim = useSimulation({ fetchBatch, onStep: (s) => seen.push(s), batch: 2, initialSpeed: 10 })
    sim.reset('x')
    sim.play()
    await vi.advanceTimersByTimeAsync(100)
    sim.reset('y')
    expect(sim.playing.value).toBe(false)
    expect(sim.count.value).toBe(0)
    sim.dispose()
  })
})
