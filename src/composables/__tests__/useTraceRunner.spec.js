import { describe, it, expect, vi } from 'vitest'
import { useTraceRunner } from '../useTraceRunner.js'

function makeLab() {
  return { setTrace: vi.fn(), play: vi.fn(), pause: vi.fn(), step: vi.fn(), reset: vi.fn() }
}

describe('useTraceRunner', () => {
  it('dirty 상태의 step()은 solve 후 setTrace를 거쳐 1스텝 진행한다', async () => {
    const lab = makeLab()
    const solve = vi.fn().mockResolvedValue({ ok: 1 })
    const r = useTraceRunner({ getLab: () => lab, solve })
    await r.step()
    expect(solve).toHaveBeenCalledOnce()
    expect(lab.setTrace).toHaveBeenCalledWith({ ok: 1 })
    expect(lab.step).toHaveBeenCalledOnce()
    expect(r.dirty.value).toBe(false)
  })

  it('clean 상태의 step()/play()는 재solve 없이 lab에 위임한다', async () => {
    const lab = makeLab()
    const solve = vi.fn().mockResolvedValue({})
    const r = useTraceRunner({ getLab: () => lab, solve })
    r.markClean()
    await r.step()
    await r.play()
    expect(solve).not.toHaveBeenCalled()
    expect(lab.step).toHaveBeenCalledOnce()
    expect(lab.play).toHaveBeenCalledOnce()
  })

  it('run()은 clean 상태여도 다시 solve하고 재생한다', async () => {
    const lab = makeLab()
    const solve = vi.fn().mockResolvedValue({})
    const r = useTraceRunner({ getLab: () => lab, solve })
    r.markClean()
    await r.run()
    expect(solve).toHaveBeenCalledOnce()
    expect(lab.play).toHaveBeenCalledOnce()
  })

  it('solve 실패 시 dirty를 유지하고 진행하지 않는다', async () => {
    const lab = makeLab()
    const solve = vi.fn().mockRejectedValue(new Error('boom'))
    const r = useTraceRunner({ getLab: () => lab, solve })
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    await r.step()
    expect(lab.step).not.toHaveBeenCalled()
    expect(r.dirty.value).toBe(true)
    err.mockRestore()
  })
})
