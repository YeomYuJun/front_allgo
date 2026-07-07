<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import ToggleControl from './ui/ToggleControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { createFourierLab } from '../lib/fourierLab.js'
import { transform } from '../services/fourierApi.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'

const canvasRef = ref(null)
const comps = ref([])
const stat = ref({ windF: 3, mag: 0, peaks: [], sweeping: false })

let lab = null
let timer = null

async function runTransform() {
  if (!lab) return
  try {
    const r = await transform(lab.getSignal())
    lab.setSpectrum(r.spectrum, r.peaks)
  } catch (e) {
    console.error('Fourier transform failed:', e)
  }
}

function onEdit() {
  clearTimeout(timer)
  timer = setTimeout(runTransform, 150)
}

onMounted(() => {
  lab = createFourierLab(canvasRef.value, {
    onStat: (s) => { stat.value = s },
    onComps: (list) => { comps.value = list },
    onEdit,
  })
  runTransform()
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  if (lab) lab.dispose()
})

useLabHotkeys({
  onPlayPause: () => lab && lab.sweep(),
  onReset: () => lab && lab.reset(),
})

const readoutItems = computed(() => [
  { k: 'wind freq', v: stat.value.windF.toFixed(2) + ' Hz', acc: true },
  { k: 'peaks', v: stat.value.peaks.length ? stat.value.peaks.map(p => p.toFixed(1)).join(', ') : '-' },
  { k: 'COM mag', v: stat.value.mag.toFixed(3) },
])
</script>

<template>
  <AlgorithmLayout
    index="15" title="Fourier Transform"
    subtitle="신호를 원점 주위로 감아 중심 질량이 스파이크하는 주파수를 찾는다. 성분을 편집하면 백엔드 DFT가 권위있는 스펙트럼을 반환한다."
    :tags="['signal', 'spectrum', 'DFT', 'interactive']" eq="X(f) = Σ g(t)·e^(-2πift)">
    <template #viewport>
      <AlgoViewport>
        <template #expr>winding machine + DFT</template>
        <template #status>
          <div class="ln">wind <b>{{ stat.windF.toFixed(2) }}</b> Hz · peaks <b>{{ stat.peaks.length ? stat.peaks.map(p => p.toFixed(1)).join(', ') : '-' }}</b></div>
        </template>
        <canvas ref="canvasRef" class="vp-host"></canvas>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Components">
        <div v-for="(c, i) in comps" :key="i" class="comp-row">
          <RangeField :model-value="c.f" :min="1" :max="14" :step="1" :label="'Freq ' + (i + 1)"
            @update:model-value="v => { lab && lab.setFreq(i, v) }" />
          <RangeField :model-value="c.a" :min="0.1" :max="1" :step="0.1" :label="'Amp ' + (i + 1)"
            @update:model-value="v => { lab && lab.setAmp(i, v) }" />
          <div class="btnrow">
            <AppButton variant="ghost" @click="lab && lab.removeComp(i)">Remove</AppButton>
          </div>
        </div>
        <div class="btnrow">
          <AppButton variant="ghost" @click="lab && lab.addComp()">Add</AppButton>
          <AppButton variant="ghost" @click="lab && lab.reset()">Reset</AppButton>
        </div>
      </ControlPanel>

      <ControlPanel number="02" title="Winding">
        <RangeField :model-value="stat.windF" :min="0.5" :max="14" :step="0.1" label="Wind Freq"
          @update:model-value="v => { lab && lab.setWindF(v) }" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="lab && lab.sweep()">Sweep</AppButton>
        </div>
        <div class="toggles">
          <ToggleControl :model-value="true" label="Path" @update:model-value="v => lab && lab.setToggle('path', v)" />
          <ToggleControl :model-value="true" label="COM" @update:model-value="v => lab && lab.setToggle('com', v)" />
        </div>
      </ControlPanel>

      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>신호를 원점 주위로 감으면 중심 질량이 진짜 성분 주파수에서 급등한다. 이 시각적 직관이 푸리에 변환의 본질이다. 성분 목록을 편집하면 백엔드 DFT가 권위있는 스펙트럼을 계산해 반환하고, 와인딩/COM 패널은 FE에서 기하학적으로 일러스트레이션한다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;width:100%;height:100%;}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;}
.toggles{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;}
.comp-row{border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:10px;}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
