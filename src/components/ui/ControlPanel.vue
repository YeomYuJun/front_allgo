<script setup>
defineProps({
  number: { type: String, default: '' },
  title: { type: String, default: '' },
})
</script>

<template>
  <div class="panel">
    <div class="ph">
      <span v-if="number" class="n">{{ number }}</span>
      <h3>{{ title }}</h3>
    </div>
    <div class="pb"><slot /></div>
  </div>
</template>

<style scoped>
.panel{border:1px solid var(--line);border-radius:14px;background:var(--panel);overflow:hidden;}
.ph{display:flex;align-items:center;gap:12px;padding:16px 20px 14px;border-bottom:1px solid var(--line);}
.n{font-family:var(--mono);font-size:11px;color:var(--acc);}
.ph h3{font-size:15px;font-weight:600;letter-spacing:.01em;}
.pb{padding:18px 20px 22px;display:flex;flex-direction:column;gap:18px;}
</style>
