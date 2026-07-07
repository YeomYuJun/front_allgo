<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // 'primary' | 'ghost'
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <button type="button" class="btn" :class="variant === 'ghost' ? 'btn-ghost' : 'btn-primary'" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn{font-family:var(--mono);font-size:12.5px;letter-spacing:.02em;padding:13px 18px;border-radius:8px;cursor:pointer;border:1px solid transparent;display:inline-flex;align-items:center;gap:9px;transition:transform .15s,background .2s,border-color .2s,box-shadow .2s;flex:1;justify-content:center;}
.btn:disabled{opacity:.5;cursor:not-allowed;}
.btn-primary{background:var(--acc);color:var(--bg);font-weight:700;}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 26px rgba(200,255,0,.22);}
.btn-ghost{border-color:var(--line-2);color:var(--fg-dim);flex:0 0 auto;}
.btn-ghost:hover:not(:disabled){border-color:var(--acc);color:var(--acc);}
</style>
