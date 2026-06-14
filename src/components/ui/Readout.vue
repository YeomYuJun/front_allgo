<script setup>
defineProps({
  items: { type: Array, required: true }, // [{k,v,acc?}]
})
</script>

<template>
  <div class="readout">
    <div v-for="(it, i) in items" :key="i" class="it">
      <span class="k">{{ it.k }}</span>
      <span class="v" :class="{ acc: it.acc }">{{ it.v }}</span>
    </div>
  </div>
</template>

<style scoped>
.readout{border:1px solid var(--line);border-radius:10px;background:var(--bg-2);padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:12px 18px;}
.it{display:flex;flex-direction:column;gap:3px;}
.k{font-family:var(--mono);font-size:10px;color:var(--fg-mute);letter-spacing:.08em;text-transform:uppercase;}
.v{font-family:var(--mono);font-size:15px;color:var(--fg);}
.v.acc{color:var(--acc);}
</style>
