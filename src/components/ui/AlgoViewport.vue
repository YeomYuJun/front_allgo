<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  // 첫 방문 시 캔버스 위에 1회 보여줄 조작 힌트 (없으면 오버레이 없음)
  hint: { type: String, default: '' },
  ariaLabel: { type: String, default: '인터랙티브 수학 시각화 캔버스' },
})

const canvasHost = ref(null)
const showHint = ref(false)
const route = useRoute()

const hintKey = () => `agm-hint:${route.path}`

onMounted(() => {
  if (!props.hint) return
  try {
    if (!localStorage.getItem(hintKey())) showHint.value = true
  } catch { /* storage unavailable: skip hint */ }
})

function dismissHint() {
  if (!showHint.value) return
  showHint.value = false
  try { localStorage.setItem(hintKey(), '1') } catch { /* ignore */ }
}

defineExpose({ canvasHost })
</script>

<template>
  <div class="vp">
    <div class="vp-bar">
      <div class="expr"><slot name="expr" /></div>
      <div class="right"><slot name="bar-right" /></div>
    </div>
    <div ref="canvasHost" class="vp-canvas grab" role="img" :aria-label="ariaLabel" @pointerdown.capture="dismissHint">
      <slot />
      <div class="vp-status"><slot name="status" /></div>
      <div class="vp-legend"><slot name="legend" /></div>
      <transition name="hintfade">
        <div v-if="showHint" class="vp-hint-overlay" aria-hidden="true">
          <span class="pill">{{ hint }}</span>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.vp-bar{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--line);position:relative;z-index:2;gap:14px;}
.expr{font-family:var(--serif);font-style:italic;font-size:18px;color:var(--fg);}
.right{display:flex;align-items:center;gap:14px;}
.vp-canvas{position:relative;height:540px;background:radial-gradient(circle at 50% 42%,rgba(200,255,0,.045),transparent 62%),var(--bg);}
.vp-canvas.grab{cursor:grab;}
.vp-canvas.grab:active{cursor:grabbing;}
.vp-canvas :deep(canvas){position:absolute;inset:0;width:100%;height:100%;}
.vp-status{position:absolute;left:16px;bottom:14px;z-index:2;font-family:var(--mono);font-size:11.5px;color:var(--fg-dim);letter-spacing:.03em;display:grid;gap:4px;pointer-events:none;}
.vp-legend{position:absolute;right:16px;bottom:14px;z-index:2;display:flex;flex-direction:column;gap:7px;align-items:flex-end;pointer-events:none;}
.vp-hint-overlay{position:absolute;inset:0;z-index:3;display:grid;place-items:center;pointer-events:none;}
.vp-hint-overlay .pill{font-family:var(--mono);font-size:12px;letter-spacing:.04em;color:var(--fg);background:rgba(10,11,12,.82);border:1px solid rgba(200,255,0,.35);border-radius:30px;padding:11px 20px;backdrop-filter:blur(6px);box-shadow:0 8px 30px rgba(0,0,0,.4);}
.hintfade-enter-active,.hintfade-leave-active{transition:opacity .35s;}
.hintfade-enter-from,.hintfade-leave-to{opacity:0;}
@media (max-width:760px){ .vp-canvas{height:420px;} }
</style>
