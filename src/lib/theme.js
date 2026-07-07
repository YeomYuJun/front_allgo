/* 디자인 토큰 단일 소스(tokens.css)를 JS에서 읽는 리더.
   getComputedStyle은 토큰당 1회만 실행되고 캐시된다. CSS가 아직 없으면 fallback 사용. */

const cache = new Map()

export function tokenColor(name, fallback) {
  if (cache.has(name)) return cache.get(name)
  let value = fallback
  if (typeof window !== 'undefined' && typeof getComputedStyle === 'function') {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    if (raw) value = raw
  }
  cache.set(name, value)
  return value
}

export function accent() { return tokenColor('--acc', '#c8ff00') }
export function warn() { return tokenColor('--warn', '#ffb224') }

/* Three.js용 숫자 컬러 (0xRRGGBB) */
export function accentHex() {
  const hex = accent()
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? parseInt(hex.slice(1), 16) : 0xc8ff00
}
