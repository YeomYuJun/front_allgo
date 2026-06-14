<script setup>
defineProps({
  modelValue: { type: [String, Number], required: true },
  items: { type: Array, required: true }, // [{key,label,eq?}]
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="fnlist">
    <div v-for="it in items" :key="it.key" class="fnrow" :class="{ on: it.key === modelValue }"
         @click="$emit('update:modelValue', it.key)">
      <span class="nm">{{ it.label }}</span>
      <span v-if="it.eq" class="ex">{{ it.eq }}</span>
    </div>
  </div>
</template>

<style scoped>
.fnlist{display:flex;flex-direction:column;gap:2px;}
.fnrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border-radius:8px;cursor:pointer;border:1px solid transparent;transition:background .2s,border-color .2s;}
.fnrow:hover{background:var(--panel-2);}
.fnrow.on{background:var(--acc-ghost);border-color:rgba(200,255,0,.3);}
.nm{font-size:14px;font-weight:500;}
.fnrow.on .nm{color:var(--acc);}
.ex{font-family:var(--mono);font-size:10.5px;color:var(--fg-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46%;text-align:right;}
</style>
