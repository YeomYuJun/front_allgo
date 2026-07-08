import { describe, it, expect, vi, afterEach } from 'vitest'
import { makeTicker } from '../clock.js'

afterEach(() => vi.restoreAllMocks())

function mockNow() {
  let t = 0
  vi.spyOn(performance, 'now').mockImplementation(() => t)
  return (v) => { t = v }
}

describe('makeTicker', () => {
  it('경과 시간 x 속도만큼 정수 스텝을 반환하고 잔여분을 누적한다', () => {
    const setT = mockNow()
    const tk = makeTicker()
    expect(tk.advance(10)).toBe(0)
    setT(50)
    expect(tk.advance(10)).toBe(0)
    setT(100)
    expect(tk.advance(10)).toBe(1)
    setT(1100)
    expect(tk.advance(10)).toBe(2)
  })

  it('긴 공백 후에는 maxDt만큼만 진행한다', () => {
    const setT = mockNow()
    const tk = makeTicker(0.25)
    tk.advance(60)
    setT(10000)
    expect(tk.advance(60)).toBe(15)
  })

  it('reset 후 첫 advance는 0을 반환한다', () => {
    const setT = mockNow()
    const tk = makeTicker()
    tk.advance(10)
    setT(500)
    tk.reset()
    expect(tk.advance(10)).toBe(0)
  })
})
