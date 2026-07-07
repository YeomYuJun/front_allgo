<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import SegControl from './ui/SegControl.vue'
import RangeField from './ui/RangeField.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { useThreeViewport } from '../composables/useThreeViewport.js'
import { useSimulation } from '../composables/useSimulation.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { simulate } from '../services/automataApi.js'
import { createEmpty, randomGrid, countPopulation, placeGlider } from '../lib/lifeGrid.js'

const GRID = 50
const WORLD = 6
const BATCH = 30
const ALIVE = [200, 255, 0]
const DEAD = [22, 24, 27]

const PATTERNS = [
  { value: 'random', label: 'Random' },
  { value: 'glider', label: 'Glider' },
  { value: 'empty', label: 'Empty' },
]

const RULE_PRESETS = [
  { value: 'life', label: 'Life', birth: [3], survive: [2, 3] },
  { value: 'highlife', label: 'HighLife', birth: [3, 6], survive: [2, 3] },
  { value: 'seeds', label: 'Seeds', birth: [2], survive: [] },
  { value: 'daynight', label: 'Day&Night', birth: [3, 6, 7, 8], survive: [3, 4, 6, 7, 8] },
]

const hostRef = ref(null)
const pattern = ref('random')
const population = ref(0)
const birth = ref([3])
const survive = ref([2, 3])

let texture = null
let planeMesh = null
let drawing = false
const raycaster = new THREE.Raycaster()

const sim = useSimulation({
  fetchBatch: (grid, n) => simulate({ grid, steps: n, birth: birth.value, survive: survive.value }).then((r) => r.steps),
  onStep: (grid) => { writeTexture(grid); syncReadout(grid) },
  batch: BATCH,
  initialSpeed: 10,
})
const playing = sim.playing
const generation = sim.count
const speed = sim.speed

const { getSceneManager } = useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, 8],
  onReady: (sm) => {
    sm.controls.enabled = false
    const data = new Uint8Array(GRID * GRID * 4)
    texture = new THREE.DataTexture(data, GRID, GRID, THREE.RGBAFormat)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    const mat = new THREE.MeshBasicMaterial({ map: texture })
    planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(WORLD, WORLD), mat)
    sm.scene.add(planeMesh)
    sim.reset(randomGrid(GRID, GRID, 0.28))
    const el = hostRef.value
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  },
})

function writeTexture(grid) {
  if (!texture) return
  const data = texture.image.data
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const alive = grid[r][c]
      const ty = GRID - 1 - r
      const idx = (ty * GRID + c) * 4
      data[idx] = alive ? ALIVE[0] : DEAD[0]
      data[idx + 1] = alive ? ALIVE[1] : DEAD[1]
      data[idx + 2] = alive ? ALIVE[2] : DEAD[2]
      data[idx + 3] = 255
    }
  }
  texture.needsUpdate = true
}

function syncReadout(grid) {
  population.value = countPopulation(grid)
}

function applyPattern() {
  let g
  if (pattern.value === 'random') g = randomGrid(GRID, GRID, 0.28)
  else if (pattern.value === 'glider') { g = createEmpty(GRID, GRID); placeGlider(g, 1, 1) }
  else g = createEmpty(GRID, GRID)
  sim.reset(g)
}

function randomize() { pattern.value = 'random'; applyPattern() }
function clearGrid() { pattern.value = 'empty'; applyPattern() }

// ── rule editor: 규칙이 바뀌면 버퍼만 비워 다음 세대부터 즉시 새 규칙으로 진행 ──
const ruleString = computed(() => `B${birth.value.join('')} / S${survive.value.join('')}`)
const currentPreset = computed(() => {
  const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
  const hit = RULE_PRESETS.find((p) => eq(p.birth, birth.value) && eq(p.survive, survive.value))
  return hit ? hit.value : 'custom'
})

function applyRulePreset(v) {
  const p = RULE_PRESETS.find((x) => x.value === v)
  if (!p) return
  birth.value = p.birth.slice()
  survive.value = p.survive.slice()
  sim.invalidate()
}

function toggleRule(kind, n) {
  const target = kind === 'birth' ? birth : survive
  const set = new Set(target.value)
  if (set.has(n)) set.delete(n); else set.add(n)
  target.value = [...set].sort((a, b) => a - b)
  sim.invalidate()
}

function pointerToCell(ev) {
  const sm = getSceneManager()
  if (!sm || !planeMesh || !hostRef.value) return null
  const rect = hostRef.value.getBoundingClientRect()
  const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera({ x, y }, sm.camera)
  const hit = raycaster.intersectObject(planeMesh)[0]
  if (!hit || !hit.uv) return null
  const col = Math.min(GRID - 1, Math.max(0, Math.floor(hit.uv.x * GRID)))
  const row = Math.min(GRID - 1, Math.max(0, Math.floor((1 - hit.uv.y) * GRID)))
  return { row, col }
}

function paintCell(ev, toggle) {
  const cell = pointerToCell(ev)
  if (!cell) return
  const g = sim.current
  if (!g) return
  g[cell.row][cell.col] = toggle ? !g[cell.row][cell.col] : true
  sim.count.value = 0
  sim.invalidate()
  writeTexture(g)
  syncReadout(g)
}

function onPointerDown(ev) { drawing = true; paintCell(ev, true) }
function onPointerMove(ev) { if (drawing) paintCell(ev, false) }
function onPointerUp() { drawing = false }

onBeforeUnmount(() => {
  const el = hostRef.value
  if (el) {
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
  }
  window.removeEventListener('pointerup', onPointerUp)
})

const readoutItems = computed(() => [
  { k: 'generation', v: generation.value, acc: true },
  { k: 'population', v: population.value },
])

useLabHotkeys({
  onPlayPause: () => (playing.value ? sim.pause() : sim.play()),
  onReset: applyPattern,
  onStepForward: () => { if (!playing.value) sim.step() },
})
</script>

<template>
  <AlgorithmLayout
    index="07" title="Cellular Automata"
    subtitle="단순한 국소 규칙에서 복잡한 패턴이 창발한다 — B/S 규칙을 직접 편집하며 다른 우주를 실험하라."
    :tags="['automata', 'emergence', 'rule editor']" :eq="ruleString">
    <template #viewport>
      <AlgoViewport hint="클릭/드래그로 셀을 그려 보세요">
        <template #expr>{{ currentPreset === 'life' ? "Conway's Game of Life" : ruleString }}</template>
        <template #status>
          <div class="ln">gen <b>{{ generation }}</b> · rule <b>{{ ruleString }}</b></div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Rule">
        <SegControl :model-value="currentPreset" :options="RULE_PRESETS" @update:model-value="applyRulePreset" />
        <div class="rulerow">
          <span class="rk">B</span>
          <button v-for="n in 9" :key="'b' + n" class="rbtn" :class="{ on: birth.includes(n - 1) }"
                  @click="toggleRule('birth', n - 1)">{{ n - 1 }}</button>
        </div>
        <div class="rulerow">
          <span class="rk">S</span>
          <button v-for="n in 9" :key="'s' + n" class="rbtn" :class="{ on: survive.includes(n - 1) }"
                  @click="toggleRule('survive', n - 1)">{{ n - 1 }}</button>
        </div>
        <p class="hint">B=탄생(죽은 셀), S=생존(산 셀)에 필요한 이웃 수. 재생 중 바꿔도 즉시 적용됩니다.</p>
      </ControlPanel>
      <ControlPanel number="02" title="Pattern">
        <SegControl v-model="pattern" :options="PATTERNS" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="applyPattern">Apply</AppButton>
          <AppButton variant="ghost" @click="randomize">Randomize</AppButton>
          <AppButton variant="ghost" @click="clearGrid">Clear</AppButton>
        </div>
        <p class="hint">뷰포트를 클릭/드래그해 셀을 그릴 수 있습니다.</p>
      </ControlPanel>
      <ControlPanel number="03" title="Playback">
        <RangeField v-model="speed" :min="1" :max="30" :step="1" label="Speed (gen/s)" />
        <div class="btnrow">
          <AppButton v-if="!playing" @click="sim.play">Play</AppButton>
          <AppButton v-else @click="sim.pause">Pause</AppButton>
          <AppButton variant="ghost" :disabled="playing" @click="sim.step">Step</AppButton>
        </div>
      </ControlPanel>
      <ControlPanel number="04" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>각 셀은 무어 이웃(8개) 중 살아있는 수에 따라 갱신된다. Conway의 B3/S23에서는 글라이더가 기어다니고, HighLife(B36/S23)는 자기복제자를 낳고, Seeds(B2/S–)는 모든 세포가 매 세대 죽으면서도 폭발적으로 번지고, Day&Night(B3678/S34678)는 흑백이 대칭인 기묘한 우주다. 규칙 두 줄이 우주의 물리 법칙이다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;}
.rulerow{display:flex;align-items:center;gap:4px;}
.rk{font-family:var(--mono);font-size:12px;color:var(--fg-dim);width:14px;flex:none;}
.rbtn{flex:1;min-width:0;font-family:var(--mono);font-size:11px;color:var(--fg-dim);background:transparent;border:1px solid var(--line);border-radius:6px;padding:7px 0;cursor:pointer;transition:color .2s,border-color .2s,background .2s;}
.rbtn:hover{color:var(--fg);}
.rbtn.on{color:var(--acc);border-color:rgba(200,255,0,.4);background:var(--acc-ghost);}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
