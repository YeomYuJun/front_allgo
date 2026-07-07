<script setup>
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import ToggleControl from './ui/ToggleControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { useThreeViewport } from '../composables/useThreeViewport.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { surface as fetchSurface, descend as fetchDescent } from '../services/plotterApi.js'
import { FUNCTIONS, normalize, heightColor } from '../lib/plotter.js'

const S = 3
const HY = 1.4
const ACC = 0xc8ff00

const hostRef = ref(null)
const fn = ref('saddle')
const range = ref(2.4)
const resolution = ref(30)
const wireframe = ref(true)
const axesOn = ref(true)
const criticalOn = ref(true)
const heightColorOn = ref(true)
const startX = ref(1.4)
const startY = ref(1.4)
const learningRate = ref(0.08)
const maxIterations = ref(60)

const iterText = ref('— / —')
const valText = ref('—')
const posText = ref('—')
const gradText = ref('—')
const previewStatus = ref(null) // { kind: 'converged'|'diverging'|'maxiter', steps }

let sm = null
let surfaceData = null
let mesh = null, axesGroup = null, critMarker = null
let pathLine = null, previewLine = null, startMarker = null, headMarker = null
let descentPath = null, shown = 0, animating = false
let computing = false, dirty = false
let previewTimer = null, previewToken = 0
let downX = 0, downY = 0
const raycaster = new THREE.Raycaster()

const fnMeta = (k) => FUNCTIONS.find((f) => f.value === k) || FUNCTIONS[0]

function wx(i, n) { return (-1 + (2 * i) / n) * S }
function wy(h) { return (normalize(h, surfaceData.zMin, surfaceData.zMax) * 2 - 1) * HY }
function worldX(mx) { return (mx / range.value) * S }
function clampToRange(v) { return Math.max(-range.value, Math.min(range.value, v)) }

function disc(r, color, opacity) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity }))
}

function buildAxes() {
  const g = new THREE.Group()
  const pts = [-S, 0, 0, S, 0, 0, 0, -HY, 0, 0, HY, 0, 0, 0, -S, 0, 0, S]
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })))
  return g
}

useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [4.6, 4.2, 4.6],
  onReady: (manager) => {
    sm = manager
    sm.controls.enablePan = false
    mesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: true, side: THREE.DoubleSide }),
    )
    axesGroup = buildAxes()
    critMarker = disc(0.06, 0xffffff, 1)
    pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: ACC }))
    previewLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({ color: ACC, transparent: true, opacity: 0.8, dashSize: 0.1, gapSize: 0.08 }),
    )
    startMarker = disc(0.05, 0xffffff, 0.85)
    headMarker = disc(0.07, ACC, 1)
    startMarker.visible = false
    headMarker.visible = false
    sm.scene.add(mesh, axesGroup, critMarker, pathLine, previewLine, startMarker, headMarker)
    sm.setCustomUpdateFunction(update)
    sm.renderer.domElement.addEventListener('pointerdown', onPointerDown)
    sm.renderer.domElement.addEventListener('pointerup', onPointerUp)
    recompute()
  },
})

async function recompute() {
  if (!mesh) return
  if (computing) { dirty = true; return }
  computing = true
  try {
    surfaceData = await fetchSurface({ fn: fn.value, range: range.value, resolution: resolution.value })
    rebuildSurface()
    rebuildCritical()
    schedulePreview()
  } catch (e) {
    console.error('Plotter surface failed:', e)
  } finally {
    computing = false
    if (dirty) { dirty = false; recompute() }
  }
}

function rebuildSurface() {
  const z = surfaceData.z
  const n = z.length - 1
  const count = (n + 1) * (n + 1)
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const idx = (i * (n + 1) + j) * 3
      pos[idx] = wx(i, n)
      pos[idx + 1] = wy(z[i][j])
      pos[idx + 2] = wx(j, n)
      const c = heightColorOn.value ? heightColor(normalize(z[i][j], surfaceData.zMin, surfaceData.zMax)) : [0.45, 0.48, 0.5]
      col[idx] = c[0]; col[idx + 1] = c[1]; col[idx + 2] = c[2]
    }
  }
  const indices = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const a = i * (n + 1) + j, b = a + 1, c = a + (n + 1), d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }
  const g = mesh.geometry
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setIndex(indices)
  g.computeBoundingSphere()
}

function rebuildCritical() {
  const c = surfaceData.critical
  critMarker.position.set(worldX(c.x), wy(c.z), worldX(c.y))
}

function pathPoint(p) {
  return new THREE.Vector3(worldX(p.x), wy(p.z) + 0.03, worldX(p.y))
}

// ── live descent preview: every parameter change re-solves and shows the full dashed path ──
function schedulePreview() {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(previewNow, 160)
}

async function previewNow() {
  if (!surfaceData) return
  const token = ++previewToken
  try {
    const res = await fetchDescent({
      fn: fn.value, startX: startX.value, startY: startY.value,
      learningRate: learningRate.value, maxIterations: maxIterations.value,
      classic: true, range: range.value,
    })
    if (token !== previewToken || !previewLine || !res.path.length) return
    descentPath = res.path
    animating = false
    shown = descentPath.length
    const pts = descentPath.map(pathPoint)
    previewLine.geometry.setFromPoints(pts)
    previewLine.computeLineDistances()
    previewLine.visible = true
    pathLine.geometry.setFromPoints([])
    headMarker.visible = false
    startMarker.position.copy(pts[0])
    startMarker.visible = true
    const first = descentPath[0]
    const last = descentPath[descentPath.length - 1]
    const steps = descentPath.length - 1
    if (res.converged) previewStatus.value = { kind: 'converged', steps }
    else if (last.z > first.z + 1e-9) previewStatus.value = { kind: 'diverging', steps }
    else previewStatus.value = { kind: 'maxiter', steps }
    iterText.value = `${steps} / ${maxIterations.value}`
    valText.value = last.z.toFixed(4)
    posText.value = `${last.x.toFixed(2)}, ${last.y.toFixed(2)}`
    gradText.value = Math.hypot(last.gradientX, last.gradientY).toFixed(4)
  } catch (e) {
    console.error('Plotter descent preview failed:', e)
  }
}

// ── click (no drag) on the surface moves the start point ──
function onPointerDown(e) { downX = e.clientX; downY = e.clientY }
function onPointerUp(e) {
  if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) return
  if (!mesh || !sm || !sm.camera) return
  const rect = sm.renderer.domElement.getBoundingClientRect()
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(ndc, sm.camera)
  const hits = raycaster.intersectObject(mesh)
  if (!hits.length) return
  const p = hits[0].point
  startX.value = Number(clampToRange((p.x / S) * range.value).toFixed(2))
  startY.value = Number(clampToRange((p.z / S) * range.value).toFixed(2))
}

// ── frame loop: only animates after "Animate descent" ──
function update() {
  if (!animating || !descentPath) return
  shown = Math.min(descentPath.length, shown + 0.5)
  const drawn = Math.floor(shown)
  const pts = []
  for (let i = 0; i < drawn; i++) pts.push(pathPoint(descentPath[i]))
  if (pts.length) {
    pathLine.geometry.setFromPoints(pts)
    headMarker.position.copy(pts[pts.length - 1]); headMarker.visible = true
    startMarker.position.copy(pathPoint(descentPath[0])); startMarker.visible = true
  }
  const k = Math.max(0, drawn - 1)
  const p = descentPath[k]
  iterText.value = `${k} / ${descentPath.length - 1}`
  valText.value = p.z.toFixed(4)
  posText.value = `${p.x.toFixed(2)}, ${p.y.toFixed(2)}`
  gradText.value = Math.hypot(p.gradientX, p.gradientY).toFixed(4)
  if (shown >= descentPath.length) animating = false
}

async function animateDescent() {
  if (!descentPath) await previewNow()
  if (!descentPath) return
  previewLine.visible = false
  pathLine.geometry.setFromPoints([])
  shown = 0
  animating = true
}

function resetDescent() {
  previewToken++
  clearTimeout(previewTimer)
  descentPath = null
  animating = false
  shown = 0
  previewStatus.value = null
  if (pathLine) pathLine.geometry.setFromPoints([])
  if (previewLine) previewLine.visible = false
  if (startMarker) startMarker.visible = false
  if (headMarker) headMarker.visible = false
  iterText.value = '— / —'; valText.value = '—'; posText.value = '—'; gradText.value = '—'
}

watch([fn, resolution], () => { resetDescent(); recompute() })
watch(range, () => {
  // keep the start point inside the (possibly smaller) domain
  startX.value = Number(clampToRange(startX.value).toFixed(2))
  startY.value = Number(clampToRange(startY.value).toFixed(2))
  resetDescent()
  recompute()
})
watch([startX, startY, learningRate, maxIterations], schedulePreview)
watch(wireframe, (v) => { if (mesh) mesh.material.wireframe = v })
watch(axesOn, (v) => { if (axesGroup) axesGroup.visible = v })
watch(criticalOn, (v) => { if (critMarker) critMarker.visible = v })
watch(heightColorOn, () => { if (surfaceData) rebuildSurface() })

useLabHotkeys({
  onPlayPause: animateDescent,
  onReset: resetDescent,
})

const resFmt = (v) => `${v} × ${v}`
const rangeFmt = (v) => `± ${v.toFixed(1)}`
const lrFmt = (v) => v.toFixed(3)
const readoutItems = computed(() => [
  { k: 'iteration', v: iterText.value },
  { k: 'ƒ(x,y)', v: valText.value, acc: true },
  { k: 'position', v: posText.value },
  { k: '‖∇ƒ‖', v: gradText.value },
])
</script>

<template>
  <AlgorithmLayout
    index="01" title="3D Function Plotter"
    subtitle="수학 곡면을 3차원으로 그리고, 카메라를 돌리며, 표면을 따라 경사하강을 실시간으로 달려 보라."
    :tags="['3D', 'real-time', 'gradient descent']" eq="xₖ₊₁ = xₖ − α∇ƒ(xₖ)">
    <template #viewport>
      <AlgoViewport hint="표면을 클릭하면 경사하강 시작점이 이동합니다 · 드래그로 회전">
        <template #expr>{{ fnMeta(fn).expr }}</template>
        <template #bar-right><span class="hint">click surface to set start · drag to orbit</span></template>
        <template #status>
          <div class="ln">surface · <b>{{ fnMeta(fn).label }}</b></div>
          <div v-if="previewStatus" class="ln" :class="{ warn: previewStatus.kind === 'diverging' }">
            <template v-if="previewStatus.kind === 'converged'">preview · converges in <b>k={{ previewStatus.steps }}</b></template>
            <template v-else-if="previewStatus.kind === 'diverging'">preview · <b>diverging</b> — lower α</template>
            <template v-else>preview · <b>k={{ previewStatus.steps }}</b> · max iterations</template>
          </div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Surface">
        <SegControl v-model="fn" :options="FUNCTIONS" />
        <RangeField v-model="range" :min="2" :max="6" :step="0.2" label="Domain range" :format="rangeFmt" />
        <RangeField v-model="resolution" :min="16" :max="54" :step="2" label="Resolution" :format="resFmt" />
        <div class="toggles">
          <ToggleControl v-model="wireframe" label="Wireframe" />
          <ToggleControl v-model="axesOn" label="Axes" />
          <ToggleControl v-model="criticalOn" label="Critical pt" />
          <ToggleControl v-model="heightColorOn" label="Height color" />
        </div>
      </ControlPanel>
      <ControlPanel number="02" title="Gradient descent">
        <RangeField v-model="startX" :min="-range" :max="range" :step="0.1" label="Start · x₀" :format="(v) => v.toFixed(2)" />
        <RangeField v-model="startY" :min="-range" :max="range" :step="0.1" label="Start · y₀" :format="(v) => v.toFixed(2)" />
        <RangeField v-model="learningRate" :min="0.005" :max="0.25" :step="0.005" label="Learning rate · α" :format="lrFmt" />
        <RangeField v-model="maxIterations" :min="10" :max="120" :step="5" label="Max iterations" />
        <div class="btnrow">
          <AppButton @click="animateDescent">Animate descent →</AppButton>
          <AppButton variant="ghost" @click="resetDescent">Reset</AppButton>
        </div>
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>경사하강법은 함수 표면을 내리막으로 걷는다. 매 스텝마다 가장 가파른 증가 방향인 그래디언트를 재고, 그 반대로 학습률만큼 이동한다. 반복하면 점은 골짜기에 정착한다 — 현대 머신러닝 대부분의 엔진이다. 학습률이 너무 크면 발산하고 너무 작으면 기어간다. 그래디언트가 0으로 줄면 임계점에 도달한 것이며, 시작 위치에 따라 전역이 아닌 지역 최소에 갇힐 수 있다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.toggles{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.btnrow{display:flex;gap:10px;}
.hint{font-family:var(--mono);font-size:10.5px;color:var(--fg-mute);letter-spacing:.04em;}
.ln b{color:var(--acc);font-weight:400;}
.ln.warn{color:var(--warn);}
.ln.warn b{color:var(--warn);}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
