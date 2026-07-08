<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { createDpLab } from '../lib/dpLab.js'
import { solve } from '../services/dpApi.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { useTraceRunner } from '../composables/useTraceRunner.js'

const MODE_OPTIONS = [
  { value: 'max', label: 'Max' },
  { value: 'min', label: 'Min' },
]

const canvasRef = ref(null)
const speed = ref(3)
const size = ref(6)
const mode = ref('max')
const stat = ref({ filled: 0, total: 0, best: '—', pathLen: 0, phase: 'idle', mode: 'max' })

let lab = null

const runner = useTraceRunner({
  getLab: () => lab,
  solve: (l) => solve(l.getState()),
})
const { dirty, running, run, play, pause, step, reset } = runner

onMounted(() => {
  lab = createDpLab(canvasRef.value, {
    onStat: (s) => { stat.value = s },
    onEdit: () => runner.markDirty(),
  })
})

onBeforeUnmount(() => { if (lab) lab.dispose() })

function onSpeed(v) { speed.value = v; lab && lab.setSpeed(v) }
function onSize(v) { size.value = v; lab && lab.setSize(v) }
function onMode(v) { mode.value = v; lab && lab.setMode(v) }

useLabHotkeys({
  onPlayPause: () => { if (!lab) return; lab.isPlaying() ? pause() : play() },
  onReset: () => reset(),
  onStepForward: () => step(),
})

const readoutItems = computed(() => [
  { k: 'filled', v: String(stat.value.filled), acc: true },
  { k: 'best', v: String(stat.value.best) },
  { k: 'phase', v: stat.value.phase },
])
</script>

<template>
  <AlgorithmLayout
    index="12" title="Dynamic Programming"
    subtitle="격자를 셀 단위로 채워 최적 경로를 구하고, 역추적으로 경로를 복원한다. 셀을 클릭해 값을 바꾸고 Run."
    :tags="['DP', 'optimization', 'grid', 'interactive']" eq="dp[r][c] = a[r][c] + best(↑,←)">
    <template #viewport>
      <AlgoViewport hint="셀을 클릭해 값을 바꿔 보세요">
        <template #expr>{{ stat.mode === 'max' ? 'maximize' : 'minimize' }}</template>
        <template #status>
          <div class="ln"><b>{{ stat.filled }}</b> filled · best <b>{{ stat.best }}</b></div>
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
        <RangeField :model-value="speed" :min="1" :max="10" :step="1" label="Speed" @update:model-value="onSpeed" />
        <p v-if="dirty" class="hint">그리드를 편집했습니다 — Run을 눌러 다시 계산하세요.</p>
      </ControlPanel>

      <ControlPanel number="02" title="Grid">
        <RangeField :model-value="size" :min="4" :max="10" :step="1" label="Size" @update:model-value="onSize" />
        <SegControl :model-value="mode" :options="MODE_OPTIONS" @update:model-value="onMode" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="lab && lab.randomize()">Random</AppButton>
        </div>
        <p class="hint">셀을 클릭해 값을 1..9로 순환시키세요.</p>
      </ControlPanel>

      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>동적 프로그래밍은 왼쪽 위에서 출발해 오른쪽·아래로만 이동할 수 있는 로봇 경로를 최적화한다. 각 셀의 값은 grid[r][c]에 위 또는 왼쪽 중 더 좋은 값을 더해 확정되고, 역추적으로 최적 경로를 복원한다. 연산은 백엔드가 수행하고, 화면은 dp 테이블 채우기와 경로 복원을 재생할 뿐이다.</p>
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
