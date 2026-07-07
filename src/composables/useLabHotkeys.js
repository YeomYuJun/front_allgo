import { onMounted, onBeforeUnmount } from 'vue'

/**
 * 전 랩 공통 키보드 단축키: Space(재생/정지), R(리셋), ArrowLeft/Right(스텝).
 * 입력 요소에 포커스가 있을 때는 무시한다. 핸들러는 페이지가 가진 것만 넘기면 된다.
 */
export function useLabHotkeys({ onPlayPause, onReset, onStepBack, onStepForward } = {}) {
  function isTyping(e) {
    const t = e.target
    if (!t) return false
    const tag = (t.tagName || '').toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable
  }

  function onKeyDown(e) {
    if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.code === 'Space' && onPlayPause) { e.preventDefault(); onPlayPause() }
    else if (e.code === 'KeyR' && onReset) { e.preventDefault(); onReset() }
    else if (e.code === 'ArrowLeft' && onStepBack) { e.preventDefault(); onStepBack() }
    else if (e.code === 'ArrowRight' && onStepForward) { e.preventDefault(); onStepForward() }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
}
