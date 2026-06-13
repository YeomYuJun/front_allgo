<script setup>
defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true }, // [{value,label}]
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="seg">
    <button v-for="o in options" :key="o.value"
            :class="{ on: o.value === modelValue }"
            @click="$emit('update:modelValue', o.value)">{{ o.label }}</button>
  </div>
</template>

<style scoped>
.seg{display:flex;gap:6px;flex-wrap:wrap;}
.seg button{flex:1;min-width:0;font-family:var(--mono);font-size:11.5px;color:var(--fg-dim);background:transparent;border:1px solid var(--line);border-radius:7px;padding:9px 6px;cursor:pointer;transition:color .2s,border-color .2s,background .2s;white-space:nowrap;}
.seg button:hover{color:var(--fg);}
.seg button.on{color:var(--acc);border-color:rgba(200,255,0,.4);background:var(--acc-ghost);}
</style>
