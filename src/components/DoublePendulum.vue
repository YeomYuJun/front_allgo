<script setup>
import { accentHex } from '../lib/theme.js'
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import ToggleControl from './ui/ToggleControl.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { useThreeViewport } from '../composables/useThreeViewport.js'
import { useSimulation } from '../composables/useSimulation.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { prefersReducedMotion } from '../lib/motion.js'
import { simulate } from '../services/pendulumApi.js'
import { degToRad, tip, divergence } from '../lib/pendulum.js'

const SCALE = 1.5
const PIVOT_Y = 2.2
const EPS = 0.012
const BATCH = 120
const DT = 0.1
const TRAIL_MAX = 200
const ACC = accentHex()
const TWIN = 0x96afdc

const hostRef = ref(null)
const gravity = ref(1.2)
const armRatio = ref(1.0)
const damping = ref(0.0)
const theta1Deg = ref(112)
const theta2Deg = ref(153)
const twin = ref(true)
const trail = ref(true)
const timeVal = ref('0.0')
const divVal = ref('0.00')

const degFmt = (d) => `${d}°`

let armA = null, armB = null, bobA = null, bobB = null, jointA = null, pivotDot = null, trailLineA = null, trailLineB = null
let trailA = [], trailB = []

const sim = useSimulation({
  fetchBatch: (pair, n) =>
    simulate({ state: pair, gravity: gravity.value, armRatio: armRatio.value, damping: damping.value, steps: n }).then((r) => r.steps),
  onStep: (pair) => updateScene(pair),
  batch: BATCH,
  initialSpeed: 30,
})
const playing = sim.playing
const count = sim.count
const speed = sim.speed

function initialPair() {
  const t1 = degToRad(theta1Deg.value)
  const t2 = degToRad(theta2Deg.value)
  return { a: { t1, t2, w1: 0, w2: 0 }, b: { t1: t1 + EPS, t2, w1: 0, w2: 0 } }
}

function world(p) { return [p[0] * SCALE, PIVOT_Y + p[1] * SCALE] }

function setArm(line, pts) {
  line.geometry.setFromPoints(pts.map((p) => new THREE.Vector3(p[0], p[1], 0)))
}

function pushTrail(arr, x, y) {
  arr.push(x, y)
  while (arr.length > TRAIL_MAX * 2) arr.splice(0, 2)
}

function updateTrail(line, arr, hex) {
  const n = arr.length / 2
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const c = new THREE.Color(hex)
  for (let i = 0; i < n; i++) {
    pos[i * 3] = arr[i * 2]
    pos[i * 3 + 1] = arr[i * 2 + 1]
    const f = n > 1 ? i / (n - 1) : 1
    col[i * 3] = c.r * f
    col[i * 3 + 1] = c.g * f
    col[i * 3 + 2] = c.b * f
  }
  line.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  line.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3))
}

function applyVisibility() {
  if (!armB) return
  armB.visible = bobB.visible = twin.value
  trailLineA.visible = trail.value
  trailLineB.visible = trail.value && twin.value
}

function updateScene(pair) {
  if (!armA) return
  const r = armRatio.value
  const ta = tip(pair.a, r)
  const aJoint = world([ta.x1, ta.y1])
  const aTip = world([ta.x2, ta.y2])
  setArm(armA, [[0, PIVOT_Y], aJoint, aTip])
  jointA.position.set(aJoint[0], aJoint[1], 0)
  bobA.position.set(aTip[0], aTip[1], 0)

  const tb = tip(pair.b, r)
  const bJoint = world([tb.x1, tb.y1])
  const bTip = world([tb.x2, tb.y2])
  setArm(armB, [[0, PIVOT_Y], bJoint, bTip])
  bobB.position.set(bTip[0], bTip[1], 0)

  pushTrail(trailA, aTip[0], aTip[1])
  pushTrail(trailB, bTip[0], bTip[1])
  updateTrail(trailLineA, trailA, ACC)
  updateTrail(trailLineB, trailB, TWIN)

  applyVisibility()
  timeVal.value = (count.value * DT).toFixed(1)
  divVal.value = divergence(pair.a, pair.b, r).toFixed(2)
}

function resetSim() {
  trailA = []
  trailB = []
  sim.reset(initialPair())
}

useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, 8],
  onReady: (sm) => {
    sm.controls.enabled = false
    const white = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
    const blue = new THREE.LineBasicMaterial({ color: TWIN, transparent: true, opacity: 0.4 })
    armA = new THREE.Line(new THREE.BufferGeometry(), white)
    armB = new THREE.Line(new THREE.BufferGeometry(), blue)
    trailLineA = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }))
    trailLineB = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 }))
    bobA = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshBasicMaterial({ color: ACC }))
    bobB = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: TWIN }))
    jointA = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    pivotDot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    pivotDot.position.set(0, PIVOT_Y, 0)
    sm.scene.add(armA, armB, trailLineA, trailLineB, bobA, bobB, jointA, pivotDot)
    resetSim()
    if (!prefersReducedMotion()) sim.play()
  },
})

watch([gravity, armRatio, damping], () => sim.invalidate())
watch([theta1Deg, theta2Deg], () => resetSim())
watch([twin, trail], () => applyVisibility())

const readoutItems = computed(() => [
  { k: 't (s)', v: timeVal.value, acc: true },
  { k: 'divergence', v: divVal.value },
])

useLabHotkeys({
  onPlayPause: () => (playing.value ? sim.pause() : sim.play()),
  onReset: resetSim,
  onStepForward: () => { if (!playing.value) sim.step() },
})
</script>

<template>
  <AlgorithmLayout
    index="09" title="Double Pendulum"
    subtitle="결정론적이지만 예측 불가능한 카오스 — 미세한 초기차가 기하급수로 갈라진다."
    :tags="['chaos', 'dynamics', 'sensitivity']" eq="θ̈ = ƒ(θ₁, θ₂, ω)">
    <template #viewport>
      <AlgoViewport>
        <template #expr>double pendulum</template>
        <template #status>
          <div class="ln">t <b>{{ timeVal }}</b>s · divergence <b>{{ divVal }}</b></div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Dynamics">
        <div class="btnrow">
          <AppButton v-if="!playing" @click="sim.play">Play</AppButton>
          <AppButton v-else @click="sim.pause">Pause</AppButton>
          <AppButton variant="ghost" @click="resetSim">Reset</AppButton>
          <AppButton variant="ghost" :disabled="playing" @click="sim.step">Step</AppButton>
        </div>
        <RangeField v-model="gravity" :min="0.3" :max="2.6" :step="0.1" label="Gravity · g" />
        <RangeField v-model="armRatio" :min="0.5" :max="1.5" :step="0.05" label="Arm ratio · L₂/L₁" />
        <RangeField v-model="damping" :min="0" :max="0.012" :step="0.001" label="Damping" />
      </ControlPanel>
      <ControlPanel number="02" title="Release & display">
        <RangeField v-model="theta1Deg" :min="-180" :max="180" :step="1" label="Start θ₁" :format="degFmt" />
        <RangeField v-model="theta2Deg" :min="-180" :max="180" :step="1" label="Start θ₂" :format="degFmt" />
        <RangeField v-model="speed" :min="5" :max="60" :step="1" label="Speed (step/s)" />
        <div class="toggles">
          <ToggleControl v-model="twin" label="Chaos twin" />
          <ToggleControl v-model="trail" label="Trail" />
        </div>
      </ControlPanel>
      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>이중진자는 정확한 운동방정식을 따르지만, 1000분의 1도 차이의 두 출발이 몇 초 만에 완전히 다른 궤적으로 갈라진다. 무작위가 아니라 초기조건에 대한 극단적 민감성이 만드는 결정론적 카오스다. 댐핑이 없으면 총 에너지는 보존된다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;}
.toggles{display:flex;gap:10px;flex-wrap:wrap;}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
