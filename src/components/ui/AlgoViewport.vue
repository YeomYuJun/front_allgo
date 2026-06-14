<script setup>
import { ref } from 'vue'
const canvasHost = ref(null)
defineExpose({ canvasHost })
</script>

<template>
  <div class="vp">
    <div class="vp-bar">
      <div class="expr"><slot name="expr" /></div>
      <div class="right"><slot name="bar-right" /></div>
    </div>
    <div ref="canvasHost" class="vp-canvas grab">
      <slot />
      <div class="vp-status"><slot name="status" /></div>
      <div class="vp-legend"><slot name="legend" /></div>
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
@media (max-width:760px){ .vp-canvas{height:420px;} }
</style>
