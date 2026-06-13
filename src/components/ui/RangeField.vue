<script setup>
const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  label: { type: String, default: '' },
  format: { type: Function, default: null },
})
const emit = defineEmits(['update:modelValue'])
function onInput(e) { emit('update:modelValue', Number(e.target.value)) }
</script>

<template>
  <div class="field">
    <div class="top">
      <label>{{ label }}</label>
      <span class="val">{{ format ? format(modelValue) : modelValue }}</span>
    </div>
    <input type="range" :min="min" :max="max" :step="step" :value="modelValue" @input="onInput" />
  </div>
</template>

<style scoped>
.field{display:flex;flex-direction:column;gap:9px;}
.top{display:flex;justify-content:space-between;align-items:baseline;}
.top label{font-size:13px;color:var(--fg-dim);white-space:nowrap;}
.top .val{font-family:var(--mono);font-size:13px;color:var(--acc);white-space:nowrap;}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:3px;border-radius:3px;background:var(--line-2);outline:none;cursor:pointer;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:15px;height:15px;border-radius:50%;background:var(--acc);border:2px solid var(--bg);box-shadow:0 0 0 1px var(--acc);}
input[type=range]::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:var(--acc);border:2px solid var(--bg);}
</style>
