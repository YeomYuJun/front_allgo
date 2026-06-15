<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import ToggleControl from './ui/ToggleControl.vue'
import Readout from './ui/Readout.vue'
import { useThreeViewport } from '../composables/useThreeViewport.js'
import { compute } from '../services/bezierApi.js'
import { PRESETS, deCasteljau } from '../lib/bezier.js'

const SC = 3
const SAMPLES = 80
const PICK_R = 0.28
const ACC = 0xc8ff00
const MAX_LAYERS = 6

const DEGREES = [
  { value: 2, label: 'Quadratic' },
  { value: 3, label: 'Cubic' },
  { value: 4, label: 'Quartic' },
]

const hostRef = ref(null)
const degree = ref(3)
const t = ref(0.5)
const animate = ref(true)
const showPoly = ref(true)
const showCast = ref(true)
const tText = ref('0.50')
const degreeText = ref('3')
const lengthText = ref('0.00')

let sm = null
let cp = PRESETS[3].map((p) => p.slice())
let time = 0
let dragIdx = -1
let computing = false, dirty = false
let curveLine = null, polyLine = null, ctrlPoints = null
let castLayers = [], penGlow = null, pen = null
const raycaster = new THREE.Raycaster()
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

function world(n) { return [(n[0] * 2 - 1) * SC, -((n[1] * 2 - 1) * SC)] }
function toNorm(wx, wy) {
  return [
    Math.min(1, Math.max(0, (wx / SC + 1) / 2)),
    Math.min(1, Math.max(0, (-wy / SC + 1) / 2)),
  ]
}
function vec(n) { const [x, y] = world(n); return new THREE.Vector3(x, y, 0) }
function line(color, opacity) {
  return new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, transparent: true, opacity }))
}
function disc(radius, color, opacity) {
  return new THREE.Mesh(new THREE.CircleGeometry(radius, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity }))
}

const { getSceneManager } = useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, 8],
  onReady: (manager) => {
    sm = manager
    sm.controls.enabled = false
    polyLine = line(0xffffff, 0.18)
    curveLine = line(ACC, 1)
    for (let i = 0; i < MAX_LAYERS; i++) { const l = line(ACC, 0.4); l.visible = false; castLayers.push(l) }
    ctrlPoints = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({ size: 9, sizeAttenuation: false, vertexColors: true }),
    )
    penGlow = disc(0.13, ACC, 0.18)
    pen = disc(0.05, ACC, 1)
    sm.scene.add(polyLine, curveLine, ...castLayers, ctrlPoints, penGlow, pen)
    sm.setCustomUpdateFunction(update)
    recompute()
    const el = hostRef.value
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  },
})

async function recompute() {
  if (!curveLine) return
  if (computing) { dirty = true; return }
  computing = true
  try {
    const res = await compute({ controlPoints: cp, samples: SAMPLES })
    curveLine.geometry.setFromPoints(res.curve.map((p) => vec(p)))
    degreeText.value = String(res.degree)
    lengthText.value = curveLength(res.curve).toFixed(2)
  } catch (e) {
    console.error('Bezier compute failed:', e)
  } finally {
    computing = false
    if (dirty) { dirty = false; recompute() }
  }
}

function curveLength(curve) {
  let len = 0
  for (let i = 1; i < curve.length; i++) {
    const [ax, ay] = world(curve[i - 1])
    const [bx, by] = world(curve[i])
    len += Math.hypot(bx - ax, by - ay)
  }
  return len
}

function update() {
  if (!sm) return
  if (animate.value) { time += 0.02; t.value = (Math.sin(time * 0.6) + 1) / 2 }
  const layers = deCasteljau(cp, t.value)
  for (let i = 0; i < castLayers.length; i++) {
    const idx = i + 1
    if (showCast.value && idx <= layers.length - 2) {
      castLayers[i].visible = true
      castLayers[i].geometry.setFromPoints(layers[idx].map((p) => vec(p)))
      castLayers[i].material.opacity = 0.2 + (idx / layers.length) * 0.5
    } else {
      castLayers[i].visible = false
    }
  }
  const tip = layers[layers.length - 1][0]
  const [tx, ty] = world(tip)
  pen.position.set(tx, ty, 0.02)
  penGlow.position.set(tx, ty, 0.02)
  polyLine.geometry.setFromPoints(cp.map((p) => vec(p)))
  renderCtrlPoints()
  tText.value = t.value.toFixed(2)
}

function renderCtrlPoints() {
  const pos = new Float32Array(cp.length * 3)
  const col = new Float32Array(cp.length * 3)
  for (let i = 0; i < cp.length; i++) {
    const [x, y] = world(cp[i])
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = 0.03
    const hi = i === dragIdx
    col[i * 3] = hi ? 0.78 : 0.5
    col[i * 3 + 1] = hi ? 1.0 : 0.65
    col[i * 3 + 2] = hi ? 0.0 : 0.1
  }
  ctrlPoints.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  ctrlPoints.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3))
}

function pointerToNorm(ev) {
  if (!sm || !hostRef.value) return null
  const rect = hostRef.value.getBoundingClientRect()
  const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera({ x, y }, sm.camera)
  const hit = new THREE.Vector3()
  if (!raycaster.ray.intersectPlane(dragPlane, hit)) return null
  return toNorm(hit.x, hit.y)
}

function nearestCtrl(n) {
  const [wx, wy] = world(n)
  let bi = -1, bd = PICK_R * PICK_R
  for (let i = 0; i < cp.length; i++) {
    const [x, y] = world(cp[i])
    const d = (x - wx) ** 2 + (y - wy) ** 2
    if (d < bd) { bd = d; bi = i }
  }
  return bi
}

function onDown(ev) {
  const n = pointerToNorm(ev)
  if (!n) return
  dragIdx = nearestCtrl(n)
}
function onMove(ev) {
  if (dragIdx < 0) return
  const n = pointerToNorm(ev)
  if (!n) return
  cp[dragIdx] = n
  recompute()
}
function onUp() { dragIdx = -1 }

function onTInput(v) { t.value = v; animate.value = false }

watch(degree, (d) => { cp = PRESETS[d].map((p) => p.slice()); recompute() })

onBeforeUnmount(() => {
  const el = hostRef.value
  if (el) {
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
  }
  window.removeEventListener('pointerup', onUp)
})

const readoutItems = computed(() => [
  { k: 't', v: tText.value, acc: true },
  { k: 'degree', v: degreeText.value },
  { k: 'length', v: lengthText.value },
])
</script>

<template>
  <AlgorithmLayout
    index="05" title="Bézier Curves"
    subtitle="폰트와 벡터 드로잉 뒤의 매끄러운 곡선. 제어점을 끌어 de Casteljau 작도가 매개변수 t의 점을 그리는 것을 보라."
    :tags="['parametric', 'spline', 'de Casteljau', 'interactive']" eq="B(t) = Σ bᵢ,ₙ(t) Pᵢ">
    <template #viewport>
      <AlgoViewport>
        <template #expr>degree {{ degreeText }}</template>
        <template #status>
          <div class="ln">t = <b>{{ tText }}</b> · degree <b>{{ degreeText }}</b></div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Curve">
        <SegControl v-model="degree" :options="DEGREES" />
        <RangeField :modelValue="t" @update:modelValue="onTInput" :min="0" :max="1" :step="0.01"
                    label="Parameter · t" :format="(v) => v.toFixed(2)" />
        <p class="hint">뷰포트의 제어점을 끌어 곡선을 바꿀 수 있습니다.</p>
      </ControlPanel>
      <ControlPanel number="02" title="Display">
        <div class="toggles">
          <ToggleControl v-model="showPoly" label="Control polygon" />
          <ToggleControl v-model="showCast" label="Construction" />
          <ToggleControl v-model="animate" label="Animate t" />
        </div>
      </ControlPanel>
      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>베지어 곡선은 제어점들의 가중 블렌드다. 가중치는 t가 0에서 1로 흐르며 매끄럽게 옮겨가는 베른슈타인 다항식이며, 그 합은 항상 1이다. de Casteljau 알고리즘은 이웃끼리 선형보간하고 다시 그 결과끼리 보간하기를 한 점이 남을 때까지 반복해 곡선 위의 점을 찾는다 — 수치적으로 안정적이며 모든 벡터 그래픽 도구의 기반이다. 곡선은 제어점이 이루는 볼록 껍질을 결코 벗어나지 않는다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.toggles{display:flex;gap:10px;flex-wrap:wrap;}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
