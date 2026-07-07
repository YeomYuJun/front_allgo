<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import ToggleControl from './ui/ToggleControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { createFractalLab } from '../lib/fractalEscape.js'

const TYPES = [
  { value: 'mandelbrot', label: 'Mandelbrot' },
  { value: 'julia',      label: 'Julia' },
  { value: 'burningship', label: 'Burning Ship' },
]

const SCHEMES = [
  { value: 'classic', label: 'Classic' },
  { value: 'lime',    label: 'Neon Lime' },
  { value: 'fire',    label: 'Fire' },
  { value: 'ice',     label: 'Ice' },
  { value: 'mono',    label: 'Grayscale' },
  { value: 'ultra',   label: 'Ultraviolet' },
]

const canvasRef = ref(null)

const type    = ref('mandelbrot')
const maxIter = ref(120)
const baseRes = ref(520)
const scheme  = ref('classic')
const smooth  = ref(true)
const axes    = ref(false)
const autoQ   = ref(true)
const jRe     = ref(-0.745)
const jIm     = ref(0.113)

const stat = ref({ type: 'mandelbrot', zoom: 1, cx: 0, cy: 0, ms: 0, iter: 120, scheme: 'classic' })

let lab = null

onMounted(() => {
  lab = createFractalLab(canvasRef.value, {
    onStat: (s) => { stat.value = s },
  })
})

onBeforeUnmount(() => { if (lab) lab.dispose() })

function onType(v)   { type.value = v;    lab && lab.setType(v) }
function onIter(v)   { maxIter.value = v; lab && lab.setIter(v) }
function onRes(v)    { baseRes.value = v; lab && lab.setRes(v) }
function onScheme(v) { scheme.value = v;  lab && lab.setScheme(v) }
function onJRe(v)    { jRe.value = v;     lab && lab.setJulia(v, null) }
function onJIm(v)    { jIm.value = v;     lab && lab.setJulia(null, v) }
function onSmooth(v) { smooth.value = v;  lab && lab.toggle('smooth', v) }
function onAxes(v)   { axes.value = v;    lab && lab.toggle('axes', v) }
function onAutoQ(v)  { autoQ.value = v;   lab && lab.toggle('autoQ', v) }

const isJulia = computed(() => type.value === 'julia')

useLabHotkeys({
  onReset: () => lab && lab.reset(),
})

const readoutItems = computed(() => [
  { k: 'zoom',   v: stat.value.zoom != null ? `${stat.value.zoom.toFixed(2)}x` : '1.00x', acc: true },
  { k: 'type',   v: stat.value.type || type.value },
  { k: 'scheme', v: stat.value.scheme || scheme.value },
  { k: 'ms',     v: stat.value.ms != null ? `${stat.value.ms}ms` : '-' },
  { k: 'iter',   v: String(stat.value.iter || maxIter.value) },
])
</script>

<template>
  <AlgorithmLayout
    index="03" title="Fractal"
    subtitle="이스케이프 타임 탐험기 - Mandelbrot / Julia / Burning Ship. 스크롤로 확대, 드래그로 이동, 더블클릭으로 줌인, Shift+클릭으로 줌아웃."
    :tags="['fractal', 'escape-time', 'complex', 'interactive']" eq="z -> z^2 + c">
    <template #viewport>
      <AlgoViewport hint="드래그로 이동 · 스크롤로 딥 줌 · 더블클릭 줌인">
        <template #expr>{{ type }} · {{ maxIter }} iter</template>
        <template #status>
          <div class="ln">zoom <b>{{ stat.zoom != null ? stat.zoom.toFixed(2) : '1.00' }}x</b> · {{ stat.ms != null ? `${stat.ms}ms` : '-' }}</div>
        </template>
        <canvas ref="canvasRef" class="vp-host"></canvas>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Fractal">
        <SegControl :model-value="type" :options="TYPES" @update:model-value="onType" />
        <template v-if="isJulia">
          <RangeField :model-value="jRe" :min="-2" :max="2" :step="0.001" label="Julia real" :format="(v) => v.toFixed(3)" @update:model-value="onJRe" />
          <RangeField :model-value="jIm" :min="-2" :max="2" :step="0.001" label="Julia imag" :format="(v) => v.toFixed(3)" @update:model-value="onJIm" />
        </template>
        <AppButton variant="ghost" @click="lab && lab.reset()">Reset view</AppButton>
      </ControlPanel>

      <ControlPanel number="02" title="Render">
        <RangeField :model-value="maxIter" :min="50" :max="800" :step="10" label="Iterations" @update:model-value="onIter" />
        <RangeField :model-value="baseRes" :min="200" :max="1000" :step="20" label="Resolution" @update:model-value="onRes" />
        <SegControl :model-value="scheme" :options="SCHEMES" @update:model-value="onScheme" />
      </ControlPanel>

      <ControlPanel number="03" title="Display">
        <ToggleControl :model-value="smooth" label="Smooth shading" @update:model-value="onSmooth" />
        <ToggleControl :model-value="axes"   label="Show axes"      @update:model-value="onAxes" />
        <ToggleControl :model-value="autoQ"  label="Auto quality"   @update:model-value="onAutoQ" />
      </ControlPanel>

      <ControlPanel number="04" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>이스케이프 타임 프랙탈은 복소평면의 각 점 c에서 z -> z^2 + c 를 반복해 발산 여부와 속도를 측정하고, 그 속도로 색을 칠한다. 집합의 경계는 한없이 들쭉날쭉해 아무리 확대해도 새로운 세부가 나타난다. 만델브로는 c를 평면 위에서 훑으며 z0=0에서 시작하고, 줄리아는 c를 고정한 채 시작점 z0를 평면으로 삼는다. Burning Ship은 각 반복에서 실수부와 허수부의 절댓값을 취해 독특한 배 모양의 프랙탈을 만든다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host { position: absolute; inset: 0; width: 100%; height: 100%; }
.ln b { color: var(--acc); font-weight: 400; }
.ex-head { max-width: 60ch; }
.ex-head p { color: var(--fg-dim); font-size: 16px; line-height: 1.7; }
</style>
