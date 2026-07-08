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
import ApplicationCards from './ui/ApplicationCards.vue'
import { createBfsLab } from '../lib/bfsLab.js'
import { search } from '../services/bfsApi.js'
import APP_CARDS from '../content/applications/bfs.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { useTraceRunner } from '../composables/useTraceRunner.js'

const TOOLS = [
  { value: 'wall', label: 'Wall' },
  { value: 'erase', label: 'Erase' },
  { value: 'start', label: 'Start' },
  { value: 'goal', label: 'Goal' },
]

const canvasRef = ref(null)
const tool = ref('wall')
const speed = ref(8)
const size = ref(24)
const diag = ref(false)
const numbers = ref(false)
const ranOnce = ref(false)
const stat = ref({ visited: 0, total: 0, pathLen: '—', found: false, phase: 'idle' })

let lab = null
let liveTimer = null, liveToken = 0

const runner = useTraceRunner({
  getLab: () => lab,
  solve: async (l) => {
    const trace = await search(l.getState())
    ranOnce.value = true
    return trace
  },
})
const { dirty, running, run, play, pause, step, reset } = runner

// 실행 이후의 편집은 디바운스 재탐색으로 경로를 실시간 우회시킨다 (결과 리셋 없음)
function scheduleLiveSearch() {
  clearTimeout(liveTimer)
  liveTimer = setTimeout(async () => {
    const token = ++liveToken
    try {
      const trace = await search(lab.getState())
      if (token !== liveToken || !lab) return
      lab.setTrace(trace, true)
      runner.markClean()
    } catch (e) {
      console.error('BFS live re-search failed:', e)
    }
  }, 130)
}

onMounted(() => {
  lab = createBfsLab(canvasRef.value, {
    onStat: (s) => { stat.value = s },
    onEdit: (live) => { if (live) scheduleLiveSearch(); else runner.markDirty() },
  })
})

onBeforeUnmount(() => { liveToken++; clearTimeout(liveTimer); if (lab) lab.dispose(); lab = null })

useLabHotkeys({
  onPlayPause: () => { if (!lab) return; lab.isPlaying() ? pause() : play() },
  onReset: () => reset(),
  onStepForward: () => step(),
})

function onTool(v) { tool.value = v; lab && lab.setTool(v) }
function onSpeed(v) { speed.value = v; lab && lab.setSpeed(v) }
function onSize(v) { size.value = v; lab && lab.setSize(v) }
function onDiag(v) { diag.value = v; lab && lab.setDiag(v) }
function onNumbers(v) { numbers.value = v; lab && lab.toggleNumbers(v) }

const readoutItems = computed(() => [
  { k: 'visited', v: String(stat.value.visited), acc: true },
  { k: 'path', v: stat.value.found ? String(stat.value.pathLen) : 'unreachable' },
  { k: 'phase', v: stat.value.phase },
])

function applyPreset(p) {
  if (!lab) return
  if (p.size != null) onSize(p.size)
  if (p.diag != null) onDiag(p.diag)
  if (p.numbers != null) onNumbers(p.numbers)
  if (p.maze === 'random') lab.randomMaze()
  run()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <AlgorithmLayout
    index="11" title="Breadth-First Search"
    subtitle="격자 미로 최단경로 — frontier가 파동처럼 번지고, goal에 닿으면 최단경로를 역추적한다. 벽을 칠하고 S·G를 옮긴 뒤 Run."
    :tags="['graph', 'pathfinding', 'BFS', 'interactive']" eq="dist(v) = dist(u) + 1">
    <template #viewport>
      <AlgoViewport hint="드래그로 벽을 그리고, Start/Goal 툴로 끝점을 옮겨 보세요">
        <template #expr>{{ diag ? '8-neighbour' : '4-neighbour' }}</template>
        <template #status>
          <div class="ln"><b>{{ stat.visited }}</b> visited · path <b>{{ stat.found ? stat.pathLen : '∅' }}</b></div>
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
        <RangeField :model-value="speed" :min="1" :max="30" :step="1" label="Speed (step/s)" @update:model-value="onSpeed" />
        <p v-if="dirty" class="hint">미로를 편집했습니다 — Run을 눌러 다시 탐색하세요.</p>
        <p v-else-if="ranOnce" class="hint">이제 벽을 그리거나 지우면 즉시 재탐색되어 경로가 우회합니다.</p>
      </ControlPanel>

      <ControlPanel number="02" title="Maze">
        <SegControl :model-value="tool" :options="TOOLS" @update:model-value="onTool" />
        <RangeField :model-value="size" :min="12" :max="48" :step="2" label="Width" @update:model-value="onSize" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="lab && lab.randomMaze()">Random</AppButton>
          <AppButton variant="ghost" @click="lab && lab.clearWalls()">Clear</AppButton>
        </div>
        <div class="toggles">
          <ToggleControl :model-value="diag" label="Diagonal" @update:model-value="onDiag" />
          <ToggleControl :model-value="numbers" label="Distances" @update:model-value="onNumbers" />
        </div>
        <p class="hint">캔버스를 칠해 벽을 만들고, Start/Goal 툴로 끝점을 옮기세요.</p>
      </ControlPanel>

      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>너비 우선 탐색은 시작점에서 같은 거리의 셀을 한 겹씩 동심원처럼 확장한다. 가중치 없는 격자에서 goal에 처음 닿는 순간이 곧 최단경로이며, 부모 링크를 거꾸로 따라가면 그 경로가 복원된다. 연산은 백엔드가 한 번에 수행하고, 화면은 그 결과(방문 순서·거리·경로)를 재생할 뿐이다.</p>
      </div>
      <ApplicationCards :cards="APP_CARDS" @apply="applyPreset" />
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;width:100%;height:100%;}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;}
.toggles{display:flex;gap:10px;flex-wrap:wrap;}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
