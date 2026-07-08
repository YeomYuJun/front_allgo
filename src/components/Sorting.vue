<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { createSortLab } from '../lib/sortLab.js'
import { run as runSort } from '../services/sortApi.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { useTraceRunner } from '../composables/useTraceRunner.js'

const ALGOS = [
  { value: 'bubble', label: 'Bubble', eq: 'O(n²)' },
  { value: 'merge', label: 'Merge', eq: 'O(n log n)' },
  { value: 'quick', label: 'Quick', eq: 'O(n log n) avg' },
]
const PRESETS = [
  { value: 'random', label: 'Random' },
  { value: 'nearly', label: 'Nearly sorted' },
  { value: 'reversed', label: 'Reversed' },
  { value: 'few', label: 'Few unique' },
]

const canvasRef = ref(null)
const algorithm = ref('bubble')
const preset = ref('random')
const size = ref(28)
const speed = ref(6)
const ranOnce = ref(false)
const stat = ref({ comparisons: 0, swaps: 0, writes: 0, progress: 0, total: 0, phase: 'idle', n: 0 })
const totals = ref(null)

let lab = null
let rerunTimer = null, rerunToken = 0

function generate() {
  const n = size.value
  let v = Array.from({ length: n }, (_, i) => i + 1)
  if (preset.value === 'random') {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = v[i]; v[i] = v[j]; v[j] = t }
  } else if (preset.value === 'nearly') {
    for (let k = 0; k < Math.max(1, Math.floor(n / 8)); k++) {
      const i = Math.floor(Math.random() * (n - 1)); const t = v[i]; v[i] = v[i + 1]; v[i + 1] = t
    }
  } else if (preset.value === 'reversed') {
    v.reverse()
  } else {
    const pool = [2, 5, 8, 11, 14]
    v = Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)])
  }
  return v
}

const runner = useTraceRunner({
  getLab: () => lab,
  solve: async (l) => {
    const res = await runSort({ algorithm: algorithm.value, values: l.getValues() })
    totals.value = { comparisons: res.comparisons, swaps: res.swaps, writes: res.writes }
    ranOnce.value = true
    return res
  },
})
const { dirty, running, run, play, pause, step, reset } = runner

function reseed() {
  if (!lab) return
  lab.setData(generate())
  totals.value = null
  runner.markDirty()
  if (ranOnce.value) scheduleRerun()
}

// 실행 이후 데이터/알고리즘 변경은 자동으로 재실행해 즉시 반응하게 한다
function scheduleRerun() {
  clearTimeout(rerunTimer)
  const token = ++rerunToken
  rerunTimer = setTimeout(async () => {
    if (token !== rerunToken || !lab) return
    await run()
  }, 160)
}

onMounted(() => {
  lab = createSortLab(canvasRef.value, { onStat: (s) => { stat.value = s } })
  lab.setData(generate())
  lab.setSpeed(speed.value)
})

onBeforeUnmount(() => { rerunToken++; clearTimeout(rerunTimer); if (lab) lab.dispose(); lab = null })

useLabHotkeys({
  onPlayPause: () => { if (!lab) return; lab.isPlaying() ? pause() : play() },
  onReset: () => reset(),
  onStepForward: () => step(),
})

watch([size, preset], reseed)
watch(algorithm, () => { if (ranOnce.value) scheduleRerun(); })
watch(speed, (v) => { lab && lab.setSpeed(v) })

const algoMeta = computed(() => ALGOS.find((a) => a.value === algorithm.value) || ALGOS[0])
const readoutItems = computed(() => [
  { k: 'comparisons', v: String(stat.value.comparisons), acc: true },
  { k: 'swaps · writes', v: `${stat.value.swaps} · ${stat.value.writes}` },
  { k: 'events', v: stat.value.total ? `${stat.value.progress} / ${stat.value.total}` : '—' },
  { k: 'phase', v: stat.value.phase },
])
</script>

<template>
  <AlgorithmLayout
    index="16" title="Sorting"
    subtitle="같은 배열, 세 가지 전략 — 비교와 교환이 실제로 몇 번 일어나는지 세면서 O(n²)과 O(n log n)의 차이를 눈으로 확인한다."
    :tags="['sorting', 'comparisons', 'divide & conquer', 'interactive']" :eq="algoMeta.eq">
    <template #viewport>
      <AlgoViewport>
        <template #expr>{{ algoMeta.label }} sort · {{ algoMeta.eq }}</template>
        <template #status>
          <div class="ln"><b>{{ stat.comparisons }}</b> comparisons · <b>{{ stat.swaps + stat.writes }}</b> moves</div>
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
        <RangeField v-model="speed" :min="1" :max="40" :step="1" label="Speed" />
        <p v-if="dirty" class="hint">Run을 눌러 정렬 트레이스를 받아 재생하세요.</p>
        <p v-else class="hint">알고리즘·데이터를 바꾸면 자동으로 다시 실행됩니다.</p>
      </ControlPanel>

      <ControlPanel number="02" title="Algorithm & data">
        <SegControl v-model="algorithm" :options="ALGOS" />
        <SegControl v-model="preset" :options="PRESETS" />
        <RangeField v-model="size" :min="8" :max="96" :step="4" label="Elements" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="reseed">Shuffle</AppButton>
        </div>
      </ControlPanel>

      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
        <p v-if="totals" class="hint">
          total — {{ totals.comparisons }} comparisons · {{ totals.swaps }} swaps · {{ totals.writes }} writes
        </p>
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>버블 정렬은 이웃한 두 값을 끝없이 비교하며 큰 값을 뒤로 밀어낸다 — 단순하지만 비교 횟수가 n²으로 폭발한다. 병합 정렬은 배열을 반으로 쪼개 정렬된 두 조각을 합치는 일을 재귀적으로 반복해 어떤 입력에서도 n log n을 보장한다. 퀵 정렬은 피벗을 기준으로 작은 값과 큰 값을 가르는 분할을 반복하며, 평균적으로 가장 빠르지만 피벗 운이 나쁘면 n²로 무너진다. 연산은 백엔드가 한 번에 수행하고, 화면은 비교·교환 이벤트 스트림을 재생하며 카운트를 센다.</p>
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
