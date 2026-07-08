<script setup>
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import ToggleControl from './ui/ToggleControl.vue'
import Readout from './ui/Readout.vue'
import { useThreeViewport } from '../composables/useThreeViewport.js'
import { useSimulation } from '../composables/useSimulation.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'
import { prefersReducedMotion } from '../lib/motion.js'
import { simulate } from '../services/flowApi.js'
import { spawn, outOfBounds } from '../lib/flowField.js'

const FIELD = 100
const S = 2.8
const BATCH = 30

const hostRef = ref(null)
const scale = ref(1.4)
const count = ref(500)
const trailsOn = ref(true)

let lineSeg = null
let trails = []

const sim = useSimulation({
  fetchBatch: (state, n) => {
    const particles = state.particles.map((p, i) => {
      if (outOfBounds(p[0], p[1], FIELD)) { trails[i] = []; return spawn(FIELD) }
      return p
    })
    return simulate({ particles, scale: scale.value, time: state.time, steps: n })
      .then((r) => r.steps.map((f, i) => ({ particles: f, time: r.series[i] })))
  },
  onStep: (step) => updateScene(step),
  batch: BATCH,
  initialSpeed: 60,
})
const speed = sim.speed

function toWorld(x, y) {
  return [(x / FIELD) * 2 * S - S, -((y / FIELD) * 2 * S - S)]
}

function rebuildLineSegments(n) {
  if (!lineSeg) return
  const pos = []
  const col = []
  for (let i = 0; i < n; i++) {
    const t = trails[i]
    if (!t) continue
    const m = t.length / 2
    for (let j = 1; j < m; j++) {
      const x0 = t[(j - 1) * 2], y0 = t[(j - 1) * 2 + 1], x1 = t[j * 2], y1 = t[j * 2 + 1]
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1
      const lit = (dy / len + 1) / 2
      const r = (70 + 130 * lit) / 255, g = (120 + 135 * lit) / 255, bl = 20 / 255
      pos.push(x0, y0, 0, x1, y1, 0)
      col.push(r, g, bl, r, g, bl)
    }
  }
  lineSeg.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
  lineSeg.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3))
}

function updateScene(step) {
  if (!lineSeg) return
  const ps = step.particles
  const K = trailsOn.value ? 12 : 2
  for (let i = 0; i < ps.length; i++) {
    const [wx, wy] = toWorld(ps[i][0], ps[i][1])
    let t = trails[i]
    if (!t) { t = trails[i] = [] }
    t.push(wx, wy)
    while (t.length > K * 2) t.splice(0, 2)
  }
  rebuildLineSegments(ps.length)
}

useLabHotkeys({
  onPlayPause: () => (sim.playing.value ? sim.pause() : sim.play()),
  onReset: () => resetField(),
})

function resetField() {
  const n = count.value
  const particles = Array.from({ length: n }, () => spawn(FIELD))
  trails = Array.from({ length: n }, () => [])
  sim.reset({ particles, time: 0 })
  if (!prefersReducedMotion()) sim.play()
}

useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, 8],
  onReady: (sm) => {
    sm.controls.enabled = false
    lineSeg = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.65 }),
    )
    sm.scene.add(lineSeg)
    resetField()
  },
})

watch(count, () => resetField())
watch(scale, () => sim.invalidate())

const readoutItems = computed(() => [{ k: 'particles', v: count.value, acc: true }])
</script>

<template>
  <AlgorithmLayout
    index="06" title="Perlin Flow Field"
    subtitle="부드러운 의사난수 노이즈가 방향의 장이 되고, 수많은 입자가 유기적인 흐름을 만든다."
    :tags="['noise', 'procedural', 'vector field', 'particles']" eq="θ(x,y) = noise(x,y)·2π">
    <template #viewport>
      <AlgoViewport>
        <template #expr>flow field · {{ count }} particles</template>
        <template #status>
          <div class="ln"><b>{{ count }}</b> particles in field</div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Field">
        <RangeField v-model="scale" :min="0.4" :max="4" :step="0.1" label="Noise scale" />
        <RangeField v-model="count" :min="100" :max="1200" :step="50" label="Particles" />
        <RangeField v-model="speed" :min="1" :max="120" :step="1" label="Speed (step/s)" />
      </ControlPanel>
      <ControlPanel number="02" title="Display">
        <div class="toggles">
          <ToggleControl v-model="trailsOn" label="Trails" />
        </div>
      </ControlPanel>
      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>펄린 노이즈는 무작위이면서도 부드럽다 — 가까운 점은 가까운 값을 가져 급격한 도약이 없다. 그 값을 각도로 읽으면 평면이 벡터장이 되고, 입자는 발밑의 방향으로 한 걸음씩 나아가며 유선을 그린다. 게임과 영화가 연기·물·바람을 값싸게 흉내 내는 방법이다.</p>
      </div>
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
