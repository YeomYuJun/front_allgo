<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { createDfsLab } from '../lib/dfsLab.js'
import { search } from '../services/dfsApi.js'
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
const speed = ref(4)
const size = ref(24)
const ranOnce = ref(false)
const stat = ref({ depth: 0, visited: 0, back: 0, pathLen: '—', phase: 'idle', found: false })

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
      console.error('DFS live re-search failed:', e)
    }
  }, 130)
}

onMounted(() => {
  lab = createDfsLab(canvasRef.value, {
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

const readoutItems = computed(() => [
  { k: 'depth', v: String(stat.value.depth), acc: true },
  { k: 'visited', v: String(stat.value.visited) },
  { k: 'phase', v: stat.value.phase },
])
</script>

<template>
  <AlgorithmLayout
    index="13" title="Depth-First Search"
    subtitle="스택을 따라 한 방향으로 깊이 파고들다 막다른 길에서 되돌아온다 — 찾은 경로가 최단은 아니다. 벽·S·G 편집 후 Run."
    :tags="['DFS', 'backtracking', 'graph', 'interactive']" eq="explore deep · backtrack on dead end">
    <template #viewport>
      <AlgoViewport hint="드래그로 벽을 그리고, Start/Goal 툴로 끝점을 옮겨 보세요">
        <template #expr>stack-based DFS</template>
        <template #status>
          <div class="ln"><b>{{ stat.visited }}</b> visited · depth <b>{{ stat.depth }}</b></div>
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
        <RangeField :model-value="speed" :min="1" :max="20" :step="1" label="Speed" @update:model-value="onSpeed" />
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
        <p class="hint">캔버스를 칠해 벽을 만들고, Start/Goal 툴로 끝점을 옮기세요.</p>
      </ControlPanel>

      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>깊이 우선 탐색은 스택에서 꺼낸 셀에서 갈 수 있는 방향을 하나씩 밀어 넣으며 끝까지 파고든다. 막다른 길에 닿으면 스택을 되감아 다른 분기를 탐색한다. 연산은 백엔드가 한 번에 수행하고, 화면은 그 결과(push/pop 이벤트·경로)를 재생할 뿐이다.</p>
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
