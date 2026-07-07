<script setup>
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  label: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <button type="button" role="switch" :aria-checked="modelValue" class="toggle" :class="{ on: modelValue }"
          @click="emit('update:modelValue', !modelValue)">
    <span class="box" aria-hidden="true"></span>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.toggle{display:flex;align-items:center;gap:9px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;cursor:pointer;font-size:12.5px;color:var(--fg-dim);transition:border-color .2s,color .2s;user-select:none;background:transparent;text-align:left;}
.box{width:14px;height:14px;border:1px solid var(--line-2);border-radius:4px;display:grid;place-items:center;flex:none;transition:background .2s,border-color .2s;}
.box::after{content:"";width:7px;height:7px;border-radius:1px;background:var(--acc);transform:scale(0);transition:transform .15s;}
.toggle.on{color:var(--fg);border-color:rgba(200,255,0,.3);}
.toggle.on .box{border-color:var(--acc);}
.toggle.on .box::after{transform:scale(1);}
</style>
