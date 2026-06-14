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

const hostRef = ref(null)
const pattern = ref('random')
const speed = ref(10)
const playing = ref(false)
const generation = ref(0)
const population = ref(0)

let currentGrid = randomGrid(GRID, GRID, 0.28)
let buffer = []
let fetching = false
let timer = null
let disposed = false

let texture = null
let planeMesh = null
let drawing = false
const raycaster = new THREE.Raycaster()

const { getSceneManager } = useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, 8],
  onReady: (sm) => {
    sm.controls.enabled = false // 평면 그리드: orbit 끄고 포인터는 셀 그리기에 사용
    const data = new Uint8Array(GRID * GRID * 4)
    texture = new THREE.DataTexture(data, GRID, GRID, THREE.RGBAFormat)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    const mat = new THREE.MeshBasicMaterial({ map: texture })
    planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(WORLD, WORLD), mat)
    sm.scene.add(planeMesh)
    writeTexture()
    syncReadout()
    const el = hostRef.value
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  },
})

function writeTexture() {
  if (!texture) return
  const data = texture.image.data
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const alive = currentGrid[r][c]
      const ty = GRID - 1 - r // 위쪽이 row 0이 되도록 Y 뒤집기
      const idx = (ty * GRID + c) * 4
      data[idx] = alive ? ALIVE[0] : DEAD[0]
      data[idx + 1] = alive ? ALIVE[1] : DEAD[1]
      data[idx + 2] = alive ? ALIVE[2] : DEAD[2]
      data[idx + 3] = 255
    }
  }
  texture.needsUpdate = true
}

function syncReadout() {
  population.value = countPopulation(currentGrid)
}

async function ensureBuffer() {
  if (buffer.length || fetching) return
  fetching = true
  try {
    const { generations } = await simulate({ grid: currentGrid, steps: BATCH })
    buffer = generations || []
  } catch (e) {
    console.error('Life simulate failed:', e)
    pause()
  } finally {
    fetching = false
  }
}

async function advanceOne() {
  if (disposed) return
  if (!buffer.length) await ensureBuffer()
  if (disposed || !buffer.length) return
  currentGrid = buffer.shift()
  generation.value += 1
  writeTexture()
  syncReadout()
}

function scheduleNext() {
  if (!playing.value || disposed) return
  timer = setTimeout(async () => {
    await advanceOne()
    scheduleNext()
  }, 1000 / speed.value)
}

function play() {
  if (playing.value) return
  playing.value = true
  scheduleNext()
}

function pause() {
  playing.value = false
  if (timer) { clearTimeout(timer); timer = null }
}

async function step() {
  if (playing.value) return
  await advanceOne()
}

function invalidateBuffer() {
  buffer = []
}

function applyPattern() {
  pause()
  if (pattern.value === 'random') {
    currentGrid = randomGrid(GRID, GRID, 0.28)
  } else if (pattern.value === 'glider') {
    currentGrid = createEmpty(GRID, GRID)
    placeGlider(currentGrid, 1, 1)
  } else {
    currentGrid = createEmpty(GRID, GRID)
  }
  generation.value = 0
  invalidateBuffer()
  writeTexture()
  syncReadout()
}

function randomize() { pattern.value = 'random'; applyPattern() }
function clearGrid() { pattern.value = 'empty'; applyPattern() }

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
  currentGrid[cell.row][cell.col] = toggle ? !currentGrid[cell.row][cell.col] : true
  generation.value = 0
  invalidateBuffer()
  writeTexture()
  syncReadout()
}

function onPointerDown(ev) { drawing = true; paintCell(ev, true) }
function onPointerMove(ev) { if (drawing) paintCell(ev, false) }
function onPointerUp() { drawing = false }

onBeforeUnmount(() => {
  disposed = true
  pause()
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
</script>

<template>
  <AlgorithmLayout
    index="07" title="Cellular Automata"
    subtitle="단순한 국소 규칙(B3/S23)에서 복잡한 패턴이 창발한다."
    :tags="['automata', 'emergence']" eq="B3 / S23">
    <template #viewport>
      <AlgoViewport>
        <template #expr>Conway's Game of Life</template>
        <template #status>
          <div class="ln">gen <b>{{ generation }}</b></div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Pattern">
        <SegControl v-model="pattern" :options="PATTERNS" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="applyPattern">Apply</AppButton>
          <AppButton variant="ghost" @click="randomize">Randomize</AppButton>
          <AppButton variant="ghost" @click="clearGrid">Clear</AppButton>
        </div>
        <p class="hint">뷰포트를 클릭/드래그해 셀을 그릴 수 있습니다.</p>
      </ControlPanel>
      <ControlPanel number="02" title="Playback">
        <RangeField v-model="speed" :min="1" :max="30" :step="1" label="Speed (gen/s)" />
        <div class="btnrow">
          <AppButton v-if="!playing" @click="play">Play</AppButton>
          <AppButton v-else @click="pause">Pause</AppButton>
          <AppButton variant="ghost" :disabled="playing" @click="step">Step</AppButton>
        </div>
      </ControlPanel>
      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>각 셀은 무어 이웃(8개) 중 살아있는 수에 따라 갱신된다: 살아있으면 2~3개일 때 생존, 죽어있으면 정확히 3개일 때 탄생(B3/S23). 글라이더처럼 이동·진동·정지하는 구조가 단순 규칙에서 창발한다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
