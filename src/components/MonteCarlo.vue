<script setup>
import { accentHex } from '../lib/theme.js'
import { ref, reactive, computed, watch, nextTick } from 'vue'
import ApplicationCards from './ui/ApplicationCards.vue'
import APP_CARDS from '../content/applications/montecarlo.js'
import * as THREE from 'three'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import FnList from './ui/FnList.vue'
import RangeField from './ui/RangeField.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { useThreeViewport } from '../composables/useThreeViewport.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { integrate } from '../services/monteCarloApi.js'

const ACC = accentHex()
const SPHERE_RADIUS = 0.02
const CAMERA_Z = 9

const FUNCTIONS = [
  { key: 'square', label: 'Circle', eq: 'x²+y² ≤ 4' },
  { key: 'ellipse', label: 'Ellipse', eq: 'x²/4 + y² ≤ 1' },
  { key: 'diamond', label: 'Diamond', eq: '|x|+|y| ≤ 2' },
  { key: 'sin_product', label: 'sin(xy) ≥ 0', eq: 'sin(x·y) ≥ 0' },
]
const DEFAULT_BOUNDS = {
  square: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
  ellipse: { xMin: -2.5, xMax: 2.5, yMin: -1.5, yMax: 1.5 },
  diamond: { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 },
  sin_product: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
}

const hostRef = ref(null)
const selectedFunction = ref('square')
const iterations = ref(1000)
const running = ref(false)
const result = ref(null)
const bounds = reactive({ ...DEFAULT_BOUNDS.square })

let pointsGroup = null
let curveGroup = null
// 직전 배치의 공유 리소스(재실행/리셋 시 명시적 dispose 대상)
let pointsGeo = null
let pointsInMat = null
let pointsOutMat = null

const { getSceneManager } = useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, CAMERA_Z],
  onReady: (sm) => {
    addGrid(sm.scene)
    pointsGroup = new THREE.Group()
    sm.scene.add(pointsGroup)
    drawCurve(sm.scene)
  },
})

function addGrid(scene) {
  const size = 6, div = 20
  const mat = new THREE.LineBasicMaterial({ color: 0x2a2d31 }) // 그리드 전체 공유
  const g = new THREE.Group()
  for (let i = 0; i <= div; i++) {
    const t = -size / 2 + (size / div) * i
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-size / 2, t, 0), new THREE.Vector3(size / 2, t, 0)]), mat))
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(t, -size / 2, 0), new THREE.Vector3(t, size / 2, 0)]), mat))
  }
  scene.add(g)
}

// 그룹 내 모든 geometry/material을 dispose 후 씬에서 제거
function disposeGroup(scene, group) {
  if (!group) return
  group.traverse((obj) => {
    obj.geometry?.dispose()
    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
    else obj.material?.dispose()
  })
  scene.remove(group)
}

function drawCurve(scene) {
  disposeGroup(scene, curveGroup)
  curveGroup = new THREE.Group()
  if (selectedFunction.value === 'square') {
    const r = 2
    curveGroup.add(new THREE.Mesh(new THREE.RingGeometry(r - 0.03, r + 0.03, 64), new THREE.MeshBasicMaterial({ color: ACC, side: THREE.DoubleSide })))
  } else if (selectedFunction.value === 'ellipse') {
    const ring = new THREE.RingGeometry(0.98, 1.02, 64)
    ring.scale(2, 1, 1)
    curveGroup.add(new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: ACC, side: THREE.DoubleSide })))
  } else if (selectedFunction.value === 'diamond') {
    const pts = [new THREE.Vector3(2, 0, 0), new THREE.Vector3(0, 2, 0), new THREE.Vector3(-2, 0, 0), new THREE.Vector3(0, -2, 0), new THREE.Vector3(2, 0, 0)]
    curveGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: ACC })))
  }
  // sin_product: 단순 닫힌 경계 곡선이 없어 곡선은 그리지 않음(점군만 표시)
  scene.add(curveGroup)
}

// 직전 배치의 공유 geometry/material을 dispose하고 점군 비우기
function clearPoints() {
  pointsGeo?.dispose(); pointsGeo = null
  pointsInMat?.dispose(); pointsInMat = null
  pointsOutMat?.dispose(); pointsOutMat = null
  pointsGroup?.clear()
}

function renderPoints(points) {
  pointsInMat = new THREE.MeshBasicMaterial({ color: ACC })
  pointsOutMat = new THREE.MeshBasicMaterial({ color: 0x42606f })
  pointsGeo = new THREE.SphereGeometry(SPHERE_RADIUS, 6, 6)
  for (const p of points) {
    const s = new THREE.Mesh(pointsGeo, p.inside ? pointsInMat : pointsOutMat)
    s.position.set(p.x, p.y, 0)
    pointsGroup.add(s)
  }
}

async function run() {
  if (running.value) return
  const sm = getSceneManager()
  if (!sm) return
  running.value = true
  clearPoints()
  try {
    const data = await integrate({ iterations: iterations.value, bounds: { ...bounds }, functionType: selectedFunction.value })
    result.value = data
    renderPoints(data.points || [])
  } catch (e) {
    console.error('Monte Carlo failed:', e)
  } finally {
    running.value = false
  }
}

function reset() {
  clearPoints()
  result.value = null
}

watch(selectedFunction, (fn) => {
  Object.assign(bounds, DEFAULT_BOUNDS[fn] || DEFAULT_BOUNDS.square)
  const sm = getSceneManager()
  if (sm) drawCurve(sm.scene)
})

useLabHotkeys({
  onPlayPause: () => { if (!running.value) run() },
  onReset: reset,
})

async function applyPreset(p) {
  if (p.functionType) selectedFunction.value = p.functionType
  if (p.iterations != null) iterations.value = p.iterations
  // selectedFunction watcher가 bounds 기본값을 먼저 적용하도록 한 틱 대기
  await nextTick()
  run()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const readoutItems = computed(() => {
  const r = result.value
  if (!r) return [{ k: 'estimate', v: '—' }, { k: 'samples', v: iterations.value }]
  const err = (r.actualValue != null && !Number.isNaN(r.actualValue)) ? Math.abs(r.estimate - r.actualValue).toFixed(5) : '—'
  return [
    { k: 'estimate', v: Number(r.estimate).toFixed(5), acc: true },
    { k: 'actual', v: (r.actualValue != null && !Number.isNaN(r.actualValue)) ? Number(r.actualValue).toFixed(5) : '—' },
    { k: 'inside / total', v: `${r.insideCount} / ${r.totalCount}` },
    { k: 'error', v: err },
  ]
})
</script>

<template>
  <AlgorithmLayout
    index="04" title="Monte Carlo"
    subtitle="무작위 샘플링으로 영역 비율을 추정해 적분값을 근사한다."
    :tags="['probability', 'sampling']" eq="π ≈ 4·(inside/total)">
    <template #viewport>
      <AlgoViewport>
        <template #expr>∫∫_R f(x,y) dA</template>
        <template #status>
          <div class="ln">samples <b>{{ iterations }}</b></div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Region">
        <FnList v-model="selectedFunction" :items="FUNCTIONS" />
      </ControlPanel>
      <ControlPanel number="02" title="Sampling">
        <RangeField v-model="iterations" :min="100" :max="3000" :step="100" label="Samples" />
        <div class="btnrow">
          <AppButton :disabled="running" @click="run">{{ running ? 'Running…' : 'Run' }}</AppButton>
          <AppButton variant="ghost" :disabled="running" @click="reset">Reset</AppButton>
        </div>
      </ControlPanel>
      <ControlPanel number="03" title="Result">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>곡선/영역 아래에 균등분포 난수를 뿌려, 영역 내부에 떨어진 비율로 적분값을 추정한다. 표본 수 N이 커질수록 O(1/√N)로 참값에 수렴한다.</p>
      </div>
      <ApplicationCards :cards="APP_CARDS" @apply="applyPreset" />
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.btnrow{display:flex;gap:10px;}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
