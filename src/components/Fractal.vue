<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import ToggleControl from './ui/ToggleControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { fetchImage } from '../services/fractalApi.js'
import { TYPES, COLOR_SCHEMES, span, defaultView, clampZoom } from '../lib/fractal.js'

const RES = 800
const DEBOUNCE = 150

const canvasRef = ref(null)
const type = ref('mandelbrot')
const iterations = ref(80)
const colorScheme = ref('classic')
const smooth = ref(true)
const juliaReal = ref(-0.4)
const juliaImag = ref(0.6)
const center = reactive({ x: -0.6, y: 0 })
const zoom = ref(1)
const loading = ref(false)
const zoomText = ref('1.0')
const msText = ref('—')

let ctx = null
let computing = false, dirty = false
let timer = null
let dragging = false
let lastX = 0, lastY = 0, accX = 0, accY = 0

function params() {
  const p = {
    type: type.value,
    iterations: iterations.value,
    resolution: RES,
    colorScheme: colorScheme.value,
    smooth: smooth.value,
    centerX: center.x,
    centerY: center.y,
    zoom: zoom.value,
  }
  if (type.value === 'julia') { p.juliaReal = juliaReal.value; p.juliaImag = juliaImag.value }
  return p
}

async function recompute() {
  if (!ctx) return
  if (computing) { dirty = true; return }
  computing = true
  loading.value = true
  const t0 = performance.now()
  try {
    const blob = await fetchImage(params())
    const bmp = await createImageBitmap(blob)
    ctx.clearRect(0, 0, RES, RES)
    ctx.drawImage(bmp, 0, 0, RES, RES)
    if (bmp.close) bmp.close()
    msText.value = `${Math.round(performance.now() - t0)}ms`
  } catch (e) {
    console.error('Fractal image failed:', e)
  } finally {
    computing = false
    loading.value = false
    if (dirty) { dirty = false; recompute() }
  }
}

function debouncedRecompute() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(recompute, DEBOUNCE)
}

function reset() {
  const v = defaultView(type.value)
  center.x = v.centerX
  center.y = v.centerY
  zoom.value = v.zoom
  zoomText.value = zoom.value.toFixed(1)
  recompute()
}

function onDown(ev) {
  dragging = true
  lastX = ev.clientX; lastY = ev.clientY
  accX = 0; accY = 0
}

function onMove(ev) {
  if (!dragging) return
  accX += ev.clientX - lastX
  accY += ev.clientY - lastY
  lastX = ev.clientX; lastY = ev.clientY
  canvasRef.value.style.transform = `translate(calc(-50% + ${accX}px), ${accY}px)`
}

function onUp() {
  if (!dragging) return
  dragging = false
  if (accX || accY) {
    const rect = canvasRef.value.getBoundingClientRect()
    const s = span(zoom.value)
    center.x -= (accX / rect.width) * s
    center.y += (accY / rect.height) * s
    canvasRef.value.style.transform = 'translateX(-50%)'
    recompute()
  }
}

function onWheel(ev) {
  ev.preventDefault()
  const factor = ev.deltaY > 0 ? 0.8 : 1.25
  const rect = canvasRef.value.getBoundingClientRect()
  const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1
  const ndcY = -(((ev.clientY - rect.top) / rect.height) * 2 - 1)
  const s = span(zoom.value)
  const wx = center.x + (ndcX * s) / 2
  const wy = center.y + (ndcY * s) / 2
  const k = 1 - 1 / factor
  center.x += k * (wx - center.x)
  center.y += k * (wy - center.y)
  zoom.value = clampZoom(zoom.value * factor)
  zoomText.value = zoom.value.toFixed(1)
  debouncedRecompute()
}

watch(type, () => reset())
watch([iterations, colorScheme, smooth, juliaReal, juliaImag], () => debouncedRecompute())

onMounted(() => {
  const cv = canvasRef.value
  cv.width = RES; cv.height = RES
  ctx = cv.getContext('2d')
  cv.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  cv.addEventListener('wheel', onWheel, { passive: false })
  recompute()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  const cv = canvasRef.value
  if (cv) {
    cv.removeEventListener('pointerdown', onDown)
    cv.removeEventListener('wheel', onWheel)
  }
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
})

const isJulia = computed(() => type.value === 'julia')
const readoutItems = computed(() => [
  { k: 'zoom', v: `${zoomText.value}×`, acc: true },
  { k: 'iterations', v: String(iterations.value) },
  { k: 'render', v: msText.value },
])
</script>

<template>
  <AlgorithmLayout
    index="03" title="Fractal"
    subtitle="간단한 식의 끝없는 반복이 무한한 자기유사 구조를 만든다. 끌어 옮기고 휠로 확대해 발산의 경계를 탐험하라."
    :tags="['recursion', 'self-similar', 'escape-time', 'complex']" eq="zₙ₊₁ = zₙ² + c">
    <template #viewport>
      <AlgoViewport>
        <template #expr>{{ type }} · {{ iterations }} it</template>
        <template #status>
          <div class="ln">zoom <b>{{ zoomText }}×</b> · {{ loading ? 'rendering…' : msText }}</div>
        </template>
        <canvas ref="canvasRef" class="frhost"></canvas>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Generator">
        <SegControl v-model="type" :options="TYPES" />
        <RangeField v-model="iterations" :min="10" :max="500" :step="10" label="Iterations" />
        <SegControl v-model="colorScheme" :options="COLOR_SCHEMES" />
        <template v-if="isJulia">
          <RangeField v-model="juliaReal" :min="-2" :max="2" :step="0.01" label="Julia · real" :format="(v) => v.toFixed(2)" />
          <RangeField v-model="juliaImag" :min="-2" :max="2" :step="0.01" label="Julia · imag" :format="(v) => v.toFixed(2)" />
        </template>
        <p class="hint">드래그로 이동, 휠로 확대/축소.</p>
      </ControlPanel>
      <ControlPanel number="02" title="Display">
        <ToggleControl v-model="smooth" label="Smooth shading" />
        <AppButton variant="ghost" @click="reset">Reset view</AppButton>
      </ControlPanel>
      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>이스케이프 타임 프랙탈은 복소평면의 각 점 c에서 zₙ₊₁ = zₙ² + c 를 반복해 발산 여부와 속도를 측정하고, 그 속도로 색을 칠한다. 집합의 경계는 한없이 들쭉날쭉해 아무리 확대해도 새로운 세부가 나타난다 — 정수가 아닌 분수 차원의 거칢이다. 만델브로는 c를 평면 위에서 훑으며 z₀=0에서 시작하고, 줄리아는 c를 고정한 채 시작점 z₀를 평면으로 삼는다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.frhost{
  position:absolute;
  inset:0 auto 0 50% !important;
  height:100% !important;
  width:auto !important;
  aspect-ratio:1;
  transform:translateX(-50%);
}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
