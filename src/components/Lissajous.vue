<script setup>
import { accentHex } from '../lib/theme.js'
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import ToggleControl from './ui/ToggleControl.vue'
import Readout from './ui/Readout.vue'
import ApplicationCards from './ui/ApplicationCards.vue'
import { useThreeViewport } from '../composables/useThreeViewport.js'
import { useSimulation } from '../composables/useSimulation.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import APP_CARDS from '../content/applications/lissajous.js'
import { prefersReducedMotion } from '../lib/motion.js'
import { simulate } from '../services/lissajousApi.js'
import { reduceRatio } from '../lib/lissajous.js'

const SCALE = 2.5
const BATCH = 150
const TRAIL_MAX = 300
const ACC = accentHex()

const hostRef = ref(null)
const a = ref(3)
const b = ref(2)
const delta = ref(Math.PI / 2)
const tracerOn = ref(true)
const projectionsOn = ref(true)
const ratioVal = ref('3:2')
const deltaVal = ref('90°')

const degFmt = (v) => `${Math.round((v * 180) / Math.PI)}°`

let figureLine = null, tracer = null, box = null, projGroup = null, projV = null, projH = null, markV = null, markH = null
let trailData = []

const sim = useSimulation({
  fetchBatch: (state, n) =>
    simulate({ a: a.value, b: b.value, delta: delta.value, phase: state.u, steps: n })
      .then((r) => r.steps.map((p, i) => ({ x: p.x, y: p.y, u: r.series[i] }))),
  onStep: (pt) => updateScene(pt),
  batch: BATCH,
  initialSpeed: 60,
})
const speed = sim.speed

function pushTrail(x, y) {
  trailData.push(x, y)
  while (trailData.length > TRAIL_MAX * 2) trailData.splice(0, 2)
}

function setTrailLine() {
  const n = trailData.length / 2
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    pos[i * 3] = trailData[i * 2]
    pos[i * 3 + 1] = trailData[i * 2 + 1]
  }
  figureLine.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
}

function applyVisibility() {
  if (!tracer) return
  tracer.visible = tracerOn.value
  projGroup.visible = projectionsOn.value
}

function updateProjections(wx, wy) {
  const bottom = -SCALE - 0.18
  const left = -SCALE - 0.18
  projV.geometry.setFromPoints([new THREE.Vector3(wx, wy, 0), new THREE.Vector3(wx, bottom, 0)])
  projH.geometry.setFromPoints([new THREE.Vector3(wx, wy, 0), new THREE.Vector3(left, wy, 0)])
  markV.position.set(wx, bottom, 0)
  markH.position.set(left, wy, 0)
}

function updateScene(pt) {
  if (!figureLine || pt == null || pt.x == null) return
  const wx = pt.x * SCALE
  const wy = pt.y * SCALE
  pushTrail(wx, wy)
  setTrailLine()
  tracer.position.set(wx, wy, 0)
  updateProjections(wx, wy)
  applyVisibility()
  ratioVal.value = reduceRatio(a.value, b.value).join(':')
  deltaVal.value = degFmt(delta.value)
}

useLabHotkeys({
  onPlayPause: () => (sim.playing.value ? sim.pause() : sim.play()),
  onReset: () => resetSim(),
})

function resetSim() {
  trailData = []
  if (figureLine) setTrailLine()
  ratioVal.value = reduceRatio(a.value, b.value).join(':')
  deltaVal.value = degFmt(delta.value)
  sim.reset({ u: 0 })
  if (!prefersReducedMotion()) sim.play()
}

useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, 8],
  onReady: (sm) => {
    sm.controls.enabled = false
    figureLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: ACC }))
    tracer = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: ACC }))
    const boxGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-SCALE, -SCALE, 0), new THREE.Vector3(SCALE, -SCALE, 0),
      new THREE.Vector3(SCALE, SCALE, 0), new THREE.Vector3(-SCALE, SCALE, 0),
      new THREE.Vector3(-SCALE, -SCALE, 0),
    ])
    box = new THREE.Line(boxGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 }))
    projGroup = new THREE.Group()
    const projMat = new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: 0.35 })
    projV = new THREE.Line(new THREE.BufferGeometry(), projMat)
    projH = new THREE.Line(new THREE.BufferGeometry(), projMat)
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    markV = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), markMat)
    markH = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), markMat)
    projGroup.add(projV, projH, markV, markH)
    sm.scene.add(box, figureLine, projGroup, tracer)
    resetSim()
  },
})

// 파라미터 변경은 리셋 대신 버퍼만 폐기 -> 위상이 이어지며 곡선이 모핑
watch([a, b, delta], () => sim.invalidate())
watch([tracerOn, projectionsOn], () => applyVisibility())

// Animate delta: 250ms마다 조금씩 위상차를 돌린다 (배치 API라 4Hz가 요청 폭주 없는 갱신 주기)
const phaseAnim = ref(false)
let phaseTimer = null
watch(phaseAnim, (on) => {
  clearInterval(phaseTimer)
  if (on) phaseTimer = setInterval(() => { delta.value = (delta.value + 0.0625) % Math.PI }, 250)
})

// Sound: 사인 오실레이터 2개(C3 x a, C3 x b) -> 주파수비가 음정으로 들린다 (3:2 = 완전5도)
const soundOn = ref(false)
let audio = null
function ensureAudio() {
  if (audio) return
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx()
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(ctx.destination)
  const oa = ctx.createOscillator(), ob = ctx.createOscillator()
  oa.connect(gain); ob.connect(gain)
  oa.start(); ob.start()
  audio = { ctx, oa, ob, gain }
}
function updateAudio() {
  if (!audio) return
  const f0 = 130.81
  audio.oa.frequency.setTargetAtTime(f0 * a.value, audio.ctx.currentTime, 0.05)
  audio.ob.frequency.setTargetAtTime(f0 * b.value, audio.ctx.currentTime, 0.05)
}
watch(soundOn, (on) => {
  if (on) {
    ensureAudio()
    audio.ctx.resume()
    updateAudio()
    audio.gain.gain.setTargetAtTime(0.06, audio.ctx.currentTime, 0.05)
  } else if (audio) {
    audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05)
  }
})
watch([a, b], updateAudio)

onBeforeUnmount(() => {
  clearInterval(phaseTimer)
  if (audio) { audio.oa.stop(); audio.ob.stop(); audio.ctx.close() }
})

function applyPreset(p) {
  if (p.a != null) a.value = p.a
  if (p.b != null) b.value = p.b
  if (p.deltaDeg != null) delta.value = (p.deltaDeg * Math.PI) / 180
  if (p.sound != null) soundOn.value = p.sound
  if (p.phaseAnim != null) phaseAnim.value = p.phaseAnim
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const readoutItems = computed(() => [
  { k: 'ratio', v: ratioVal.value, acc: true },
  { k: 'phase δ', v: deltaVal.value },
])
</script>

<template>
  <AlgorithmLayout
    index="08" title="Lissajous Figures"
    subtitle="수직으로 결합된 두 진동이 하나의 곡선을 그린다 — 주파수비와 위상이 모양을 결정한다."
    :tags="['parametric', 'harmonic', 'oscilloscope']" eq="x = sin(at+δ), y = sin(bt)">
    <template #viewport>
      <AlgoViewport size="tall">
        <template #expr>x-osc × y-osc</template>
        <template #status>
          <div class="ln">a:b = <b>{{ ratioVal }}</b> · δ = <b>{{ deltaVal }}</b></div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Frequencies">
        <RangeField v-model="a" :min="1" :max="9" :step="1" label="a · horizontal" />
        <RangeField v-model="b" :min="1" :max="9" :step="1" label="b · vertical" />
        <RangeField v-model="delta" :min="0" :max="3.14159" :step="0.0175" label="Phase · δ" :format="degFmt" />
        <RangeField v-model="speed" :min="1" :max="120" :step="1" label="Speed (step/s)" />
      </ControlPanel>
      <ControlPanel number="02" title="Display">
        <div class="toggles">
          <ToggleControl v-model="tracerOn" label="Tracer" />
          <ToggleControl v-model="projectionsOn" label="Projections" />
          <ToggleControl v-model="phaseAnim" label="Animate δ" />
          <ToggleControl v-model="soundOn" label="Sound a:b" />
        </div>
        <p class="hint">Sound를 켜면 주파수비가 음정으로 들립니다 — 3:2는 완전5도.</p>
      </ControlPanel>
      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>수평 위치를 하나의 사인파로, 수직 위치를 또 다른 사인파로 구동한다. 두 주파수가 간단한 정수비일 때 움직이는 점은 닫힌 곡선을 그리며, 비율이 잎(lobe) 개수를, 위상 δ가 기울기와 회전을 정한다. 무리수 비율은 닫히지 않고 사각형을 빽빽이 채운다.</p>
      </div>
      <ApplicationCards :cards="APP_CARDS" @apply="applyPreset" />
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.toggles{display:flex;gap:10px;flex-wrap:wrap;}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);margin-top:10px;}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
