<script setup>
import { accentHex } from '../lib/theme.js'
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import SegControl from './ui/SegControl.vue'
import ToggleControl from './ui/ToggleControl.vue'
import Readout from './ui/Readout.vue'
import ApplicationCards from './ui/ApplicationCards.vue'
import { useThreeViewport } from '../composables/useThreeViewport.js'
import { series } from '../services/fourierApi.js'
import { idealWave } from '../lib/fourier.js'
import APP_CARDS from '../content/applications/fourier.js'

const EPI_X = -1.9
const SCALE = 0.95
const WAVE_X0 = 0.4
const DX = 0.012
const WAVE_LEN = 250
const ACC = accentHex()

const WAVES = [
  { value: 'square', label: 'Square' },
  { value: 'saw', label: 'Sawtooth' },
  { value: 'triangle', label: 'Triangle' },
]

const hostRef = ref(null)
const wave = ref('square')
const N = ref(8)
const speed = ref(1)
const epicyclesOn = ref(true)
const targetOn = ref(true)
const termsText = ref('8')
const topText = ref('15')

const speedFmt = (v) => `${v.toFixed(1)}×`

let sm = null
let harmonics = []
let t = 0
let waveBuf = []
let epiGroup = null
let rings = []
let chainLine = null
let pen = null, penGlow = null
let reconLine = null, connectorLine = null, targetLine = null

function line(color, opacity) {
  return new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, transparent: true, opacity }))
}

function disc(radius, color, opacity) {
  return new THREE.Mesh(new THREE.CircleGeometry(radius, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity }))
}

useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, 8],
  onReady: (manager) => {
    sm = manager
    sm.controls.enabled = false
    epiGroup = new THREE.Group()
    chainLine = line(ACC, 0.5)
    epiGroup.add(chainLine)
    penGlow = disc(0.09, ACC, 0.18)
    pen = disc(0.035, ACC, 1)
    reconLine = line(ACC, 1)
    connectorLine = line(ACC, 0.3)
    targetLine = line(0xffffff, 0.18)
    sm.scene.add(epiGroup, targetLine, connectorLine, reconLine, penGlow, pen)
    sm.setCustomUpdateFunction(update)
    rebuild()
  },
})

async function rebuild() {
  try {
    harmonics = (await series({ wave: wave.value, N: N.value })).harmonics || []
  } catch (e) {
    console.error('Fourier series failed:', e)
    return
  }
  t = 0
  waveBuf = []
  buildRings()
  termsText.value = String(harmonics.length)
  topText.value = harmonics.length ? `n = ${harmonics[harmonics.length - 1].n}` : 'n = 0'
}

function buildRings() {
  for (const r of rings) if (r) { epiGroup.remove(r); r.geometry.dispose() }
  rings = []
  for (const h of harmonics) {
    const radius = SCALE * Math.abs(h.a)
    if (radius < 0.025) { rings.push(null); continue }
    const pts = []
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0))
    }
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 + Math.min(0.16, radius * 0.22) }),
    )
    rings.push(ring)
    epiGroup.add(ring)
  }
}

function update() {
  if (!sm) return
  const dt = 0.014 * speed.value
  t += dt

  let x = EPI_X, y = 0
  const chain = [new THREE.Vector3(x, y, 0)]
  for (let k = 0; k < harmonics.length; k++) {
    if (rings[k]) rings[k].position.set(x, y, 0)
    x += SCALE * harmonics[k].a * Math.cos(harmonics[k].n * t)
    y -= SCALE * harmonics[k].a * Math.sin(harmonics[k].n * t)
    chain.push(new THREE.Vector3(x, y, 0))
  }
  chainLine.geometry.setFromPoints(chain)
  pen.position.set(x, y, 0)
  penGlow.position.set(x, y, 0)

  waveBuf.unshift(y)
  if (waveBuf.length > WAVE_LEN) waveBuf.pop()

  const recon = [], target = []
  for (let i = 0; i < waveBuf.length; i++) {
    const wx = WAVE_X0 + i * DX
    recon.push(new THREE.Vector3(wx, waveBuf[i], 0))
    target.push(new THREE.Vector3(wx, -idealWave(wave.value, t - i * dt) * SCALE, 0))
  }
  reconLine.geometry.setFromPoints(recon)
  targetLine.geometry.setFromPoints(target)
  connectorLine.geometry.setFromPoints([new THREE.Vector3(x, y, 0), new THREE.Vector3(WAVE_X0, waveBuf[0], 0)])
}

watch([wave, N], () => rebuild())
watch(epicyclesOn, (v) => { if (epiGroup) epiGroup.visible = v })
watch(targetOn, (v) => { if (targetLine) targetLine.visible = v })

const readoutItems = computed(() => [
  { k: 'terms', v: termsText.value, acc: true },
  { k: 'top harmonic', v: topText.value },
])

function applyPreset(p) {
  if (p.wave != null) wave.value = p.wave
  if (p.N != null) N.value = p.N
  if (p.speed != null) speed.value = p.speed
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <AlgorithmLayout
    index="02" title="Fourier Transform"
    subtitle="모든 주기 신호는 회전하는 원들의 합이다. 하모닉을 쌓아 사각·톱니·삼각파가 그려지는 것을 보라."
    :tags="['signal', 'harmonics', 'epicycles']" eq="ƒ(t) = Σ aₙ sin(nωt)">
    <template #viewport>
      <AlgoViewport>
        <template #expr>{{ termsText }} harmonics</template>
        <template #status>
          <div class="ln">Σ <b>{{ termsText }}</b> harmonics · top <b>{{ topText }}</b></div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Series">
        <SegControl v-model="wave" :options="WAVES" />
        <RangeField v-model="N" :min="1" :max="40" :step="1" label="Harmonics · N" />
        <RangeField v-model="speed" :min="0" :max="3" :step="0.1" label="Speed" :format="speedFmt" />
      </ControlPanel>
      <ControlPanel number="02" title="Display">
        <div class="toggles">
          <ToggleControl v-model="epicyclesOn" label="Epicycles" />
          <ToggleControl v-model="targetOn" label="Target wave" />
        </div>
      </ControlPanel>
      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>푸리에는 아무리 들쭉날쭉한 주기 신호도 기본 주파수의 정수배 사인파들의 합으로 쓸 수 있음을 보였다. 각 항은 자기 속도로 도는 원이며, 꼬리에 꼬리를 물고 이어진 끝점이 신호를 그린다. 항을 더할수록 근사가 날카로워지지만, 급격한 도약은 영원히 살짝 넘어선다 — 깁스 현상이다.</p>
      </div>
      <ApplicationCards :cards="APP_CARDS" @apply="applyPreset" />
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.toggles{display:flex;gap:10px;flex-wrap:wrap;}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
