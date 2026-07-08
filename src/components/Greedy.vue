<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { createGreedyLab } from '../lib/greedyLab.js'
import { schedule } from '../services/greedyApi.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { useTraceRunner } from '../composables/useTraceRunner.js'

const STRATEGIES = [
  { value: 'finish', label: 'Finish' },
  { value: 'start', label: 'Start' },
  { value: 'shortest', label: 'Shortest' },
]

const canvasRef = ref(null)
const count = ref(9)
const strategy = ref('finish')
const speed = ref(1)
const stat = ref({ considered: 0, total: 0, selected: 0, optimal: 0, strategy: 'finish', phase: 'idle' })

let lab = null

const runner = useTraceRunner({
  getLab: () => lab,
  solve: (l) => schedule(l.getState()),
})
const { dirty, running, run, play, pause, step, reset } = runner

onMounted(() => {
  lab = createGreedyLab(canvasRef.value, {
    onStat: (s) => { stat.value = s },
    onEdit: () => runner.markDirty(),
  })
})

onBeforeUnmount(() => { if (lab) lab.dispose() })

function onCount(v) { count.value = v; lab && lab.setCount(v) }
function onStrategy(v) { strategy.value = v; lab && lab.setStrategy(v) }
function onSpeed(v) { speed.value = v; lab && lab.setSpeed(v) }

useLabHotkeys({
  onPlayPause: () => { if (!lab) return; lab.isPlaying() ? pause() : play() },
  onReset: () => reset(),
  onStepForward: () => step(),
})

const readoutItems = computed(() => [
  { k: 'selected', v: String(stat.value.selected), acc: true },
  { k: 'optimal', v: String(stat.value.optimal) },
  { k: 'strategy', v: stat.value.strategy },
  { k: 'phase', v: stat.value.phase },
])
</script>

<template>
  <AlgorithmLayout
    index="14" title="Greedy Scheduling"
    subtitle="타임라인 위 task를 전략 순서로 스캔하며 직전 선택과 안 겹치면 채택한다 — earliest-finish만이 최적. 전략을 바꿔 탐욕이 실패하는 걸 보라."
    :tags="['greedy', 'scheduling', 'optimization', 'interactive']" eq="keep if start ≥ last end">
    <template #viewport>
      <AlgoViewport hint="일시정지 상태에서 캔버스를 클릭하면 한 스텝씩 진행합니다">
        <template #expr>{{ stat.strategy }}</template>
        <template #status>
          <div class="ln"><b>{{ stat.selected }}</b> selected · optimal <b>{{ stat.optimal }}</b></div>
        </template>
        <canvas ref="canvasRef" class="vp-host"></canvas>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Run">
        <div class="btnrow">
          <AppButton :variant="dirty ? 'solid' : 'ghost'" :disabled="running" @click="run">Run</AppButton>
          <AppButton variant="ghost" @click="play">Play</AppButton>
          <AppButton variant="ghost" @click="pause">Pause</AppButton>
          <AppButton variant="ghost" @click="step">Step</AppButton>
          <AppButton variant="ghost" @click="reset">Reset</AppButton>
        </div>
        <RangeField :model-value="speed" :min="1" :max="4" :step="1" label="Speed" @update:model-value="onSpeed" />
        <p v-if="dirty" class="hint">task를 편집했습니다 — Run을 눌러 다시 스케줄링하세요.</p>
      </ControlPanel>

      <ControlPanel number="02" title="Tasks">
        <RangeField :model-value="count" :min="4" :max="20" :step="1" label="Count" @update:model-value="onCount" />
        <SegControl :model-value="strategy" :options="STRATEGIES" @update:model-value="onStrategy" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="lab && lab.randomize()">Random</AppButton>
        </div>
      </ControlPanel>

      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>탐욕 구간 스케줄링은 task를 어떤 순서로 정렬하느냐에 따라 결과가 달라진다. Earliest-Finish 전략만이 항상 최대 개수를 선택한다는 것이 수학적으로 증명되어 있다. Start나 Shortest 전략으로 바꾸면 탐욕이 실패하는 반례를 직접 볼 수 있다. 연산은 백엔드가 한 번에 수행하고, 화면은 그 결정 순서를 재생할 뿐이다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;width:100%;height:100%;}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
