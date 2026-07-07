/* prefers-reduced-motion 감지. 자동 재생 애니메이션은 이 값이 true면 시작하지 않는다. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
