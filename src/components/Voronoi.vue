<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
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
import { accentHex } from '../lib/theme.js'
import { compute } from '../services/voronoiApi.js'
import { randomSites, siteColor } from '../lib/voronoi.js'

const GRID = 100
const WORLD = 6
const SC = 3
const DRAG_R = 0.035

const METRICS = [
  { value: 'euclid', label: 'Euclidean' },
  { value: 'manhattan', label: 'Manhattan' },
]

const hostRef = ref(null)
const count = ref(10)
const metric = ref('euclid')
const delaunay = ref(false)
const siteCountText = ref('10')

let sites = randomSites(10)
let texture = null, planeMesh = null, sitePoints = null, edgeLines = null
let dragIdx = -1
let computing = false, dirty = false
const raycaster = new THREE.Raycaster()

const { getSceneManager } = useThreeViewport(hostRef, {
  background: '#0a0b0c',
  cameraPosition: [0, 0, 8],
  onReady: (sm) => {
    sm.controls.enabled = false
    texture = new THREE.DataTexture(new Uint8Array(GRID * GRID * 4), GRID, GRID, THREE.RGBAFormat)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(WORLD, WORLD), new THREE.MeshBasicMaterial({ map: texture }))
    sm.scene.add(planeMesh)
    sitePoints = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: accentHex(), size: 7, sizeAttenuation: false }))
    edgeLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }))
    edgeLines.visible = false
    sm.scene.add(sitePoints, edgeLines)
    recompute()
    const el = hostRef.value
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  },
})

function world(s) {
  return [(s[0] * 2 - 1) * SC, -((s[1] * 2 - 1) * SC)]
}

function writeTexture(owner) {
  const rows = owner.length, cols = owner[0].length
  const data = texture.image.data
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const [r, g, b] = siteColor(owner[gy][gx])
      const ty = rows - 1 - gy
      const p = (ty * cols + gx) * 4
      data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 235
    }
  }
  texture.needsUpdate = true
}

function clearTexture() {
  const data = texture.image.data
  for (let i = 0; i < GRID * GRID; i++) {
    data[i * 4] = 10; data[i * 4 + 1] = 11; data[i * 4 + 2] = 12; data[i * 4 + 3] = 255
  }
  texture.needsUpdate = true
}

function renderSites() {
  const pos = new Float32Array(sites.length * 3)
  for (let i = 0; i < sites.length; i++) {
    const [wx, wy] = world(sites[i])
    pos[i * 3] = wx; pos[i * 3 + 1] = wy; pos[i * 3 + 2] = 0.02
  }
  sitePoints.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  siteCountText.value = String(sites.length)
}

function rebuildEdges(edges) {
  const pos = new Float32Array(edges.length * 6)
  for (let k = 0; k < edges.length; k++) {
    const w0 = world(sites[edges[k][0]]), w1 = world(sites[edges[k][1]])
    pos[k * 6] = w0[0]; pos[k * 6 + 1] = w0[1]; pos[k * 6 + 2] = 0.01
    pos[k * 6 + 3] = w1[0]; pos[k * 6 + 4] = w1[1]; pos[k * 6 + 5] = 0.01
  }
  edgeLines.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
}

async function recompute() {
  if (!texture) return
  renderSites()
  if (!sites.length) { clearTexture(); rebuildEdges([]); return }
  if (computing) { dirty = true; return }
  computing = true
  try {
    const res = await compute({ sites, metric: metric.value, grid: GRID })
    writeTexture(res.owner)
    rebuildEdges(res.edges)
  } catch (e) {
    console.error('Voronoi compute failed:', e)
  } finally {
    computing = false
    if (dirty) { dirty = false; recompute() }
  }
}

function pointerToField(ev) {
  const sm = getSceneManager()
  if (!sm || !planeMesh || !hostRef.value) return null
  const rect = hostRef.value.getBoundingClientRect()
  const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera({ x, y }, sm.camera)
  const hit = raycaster.intersectObject(planeMesh)[0]
  if (!hit || !hit.uv) return null
  return [hit.uv.x, 1 - hit.uv.y]
}

function nearestSite(fx, fy) {
  let bi = -1, bd = DRAG_R * DRAG_R
  for (let i = 0; i < sites.length; i++) {
    const dx = sites[i][0] - fx, dy = sites[i][1] - fy, d = dx * dx + dy * dy
    if (d < bd) { bd = d; bi = i }
  }
  return bi
}

function onDown(ev) {
  const f = pointerToField(ev)
  if (!f) return
  const i = nearestSite(f[0], f[1])
  if (i >= 0) { dragIdx = i }
  else { sites.push([f[0], f[1]]); count.value = sites.length; recompute() }
}

function onMove(ev) {
  if (dragIdx < 0) return
  const f = pointerToField(ev)
  if (!f) return
  sites[dragIdx] = [Math.min(1, Math.max(0, f[0])), Math.min(1, Math.max(0, f[1]))]
  recompute()
}

function onUp() { dragIdx = -1 }

function randomize() { sites = randomSites(count.value); recompute() }
function clearSites() { sites = []; recompute() }

watch(count, (n) => {
  if (n === sites.length) return
  if (n > sites.length) { while (sites.length < n) sites.push([Math.random(), Math.random()]) }
  else sites.length = n
  recompute()
})
watch(metric, () => recompute())
watch(delaunay, () => { if (edgeLines) edgeLines.visible = delaunay.value })

onBeforeUnmount(() => {
  const el = hostRef.value
  if (el) {
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
  }
  window.removeEventListener('pointerup', onUp)
})

const readoutItems = computed(() => [
  { k: 'sites', v: siteCountText.value, acc: true },
  { k: 'metric', v: metric.value },
])

useLabHotkeys({
  onReset: randomize,
})
</script>

<template>
  <AlgorithmLayout
    index="10" title="Voronoi Diagram"
    subtitle="평면을 영역으로 가른다 — 모든 점은 가장 가까운 사이트에 속한다. 사이트를 더하고 끌어 보라."
    :tags="['geometry', 'spatial', 'Delaunay', 'interactive']" eq="V(pᵢ) = { x : |x−pᵢ| ≤ |x−pⱼ| }">
    <template #viewport>
      <AlgoViewport hint="빈 곳을 클릭해 사이트를 추가하고, 드래그로 옮겨 보세요">
        <template #expr>{{ metric === 'euclid' ? 'Euclidean' : 'Manhattan' }} · {{ siteCountText }} sites</template>
        <template #status>
          <div class="ln"><b>{{ siteCountText }}</b> sites · <b>{{ metric }}</b></div>
        </template>
        <div ref="hostRef" class="vp-host"></div>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Sites">
        <RangeField v-model="count" :min="2" :max="40" :step="1" label="Count" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="randomize">Randomize</AppButton>
          <AppButton variant="ghost" @click="clearSites">Clear</AppButton>
        </div>
        <SegControl v-model="metric" :options="METRICS" />
        <p class="hint">뷰포트를 클릭해 사이트를 추가하고, 드래그해 옮길 수 있습니다.</p>
      </ControlPanel>
      <ControlPanel number="02" title="Display">
        <div class="toggles">
          <ToggleControl v-model="delaunay" label="Delaunay" />
        </div>
      </ControlPanel>
      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>사이트를 흩뿌리면 평면의 모든 위치가 가장 가까운 사이트로 칠해져 볼록한 셀로 분할된다. 경계는 두 사이트로부터 등거리인 점들이다. 인접한 셀의 사이트를 이으면 Delaunay 삼각분할 — 메시 생성·최근접 탐색·자연스러운 지도를 떠받치는 기하학적 듀얼 — 이 드러난다.</p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;}
.toggles{display:flex;gap:10px;flex-wrap:wrap;}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);}
.ln b{color:var(--acc);font-weight:400;}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
</style>
