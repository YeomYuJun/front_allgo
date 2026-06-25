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
import { createBfsLab } from '../lib/bfsLab.js'
import { search } from '../services/bfsApi.js'

const TOOLS = [
  { value: 'wall', label: 'Wall' },
  { value: 'erase', label: 'Erase' },
  { value: 'start', label: 'Start' },
  { value: 'goal', label: 'Goal' },
]

const canvasRef = ref(null)
const tool = ref('wall')
const speed = ref(6)
const size = ref(24)
const diag = ref(false)
const numbers = ref(false)
const dirty = ref(true)
const running = ref(false)
const stat = ref({ visited: 0, total: 0, pathLen: '—', found: false, phase: 'idle' })

let lab = null

async function run() {
  if (!lab || running.value) return
  running.value = true
  try {
    const trace = await search(lab.getState())
    lab.setTrace(trace)
    dirty.value = false
    lab.play()
  } catch (e) {
    console.error('BFS search failed:', e)
  } finally {
    running.value = false
  }
}

onMounted(() => {
  lab = createBfsLab(canvasRef.value, {
    onStat: (s) => { stat.value = s },
    onEdit: () => { dirty.value = true },
  })
})

onBeforeUnmount(() => { if (lab) lab.dispose() })

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
</script>

<template>
  <AlgorithmLayout
    index="11" title="Breadth-First Search"
    subtitle="격자 미로 최단경로 — frontier가 파동처럼 번지고, goal에 닿으면 최단경로를 역추적한다. 벽을 칠하고 S·G를 옮긴 뒤 Run."
    :tags="['graph', 'pathfinding', 'BFS', 'interactive']" eq="dist(v) = dist(u) + 1">
    <template #viewport>
      <AlgoViewport>
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
          <AppButton variant="ghost" @click="lab && lab.play()">Play</AppButton>
          <AppButton variant="ghost" @click="lab && lab.pause()">Pause</AppButton>
          <AppButton variant="ghost" @click="lab && lab.step()">Step</AppButton>
          <AppButton variant="ghost" @click="lab && lab.reset()">Reset</AppButton>
        </div>
        <RangeField :model-value="speed" :min="1" :max="20" :step="1" label="Speed" @update:model-value="onSpeed" />
        <p v-if="dirty" class="hint">미로를 편집했습니다 — Run을 눌러 다시 탐색하세요.</p>
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
