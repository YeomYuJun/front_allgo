<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import AlgorithmLayout from './ui/AlgorithmLayout.vue'
import AlgoViewport from './ui/AlgoViewport.vue'
import ControlPanel from './ui/ControlPanel.vue'
import RangeField from './ui/RangeField.vue'
import AppButton from './ui/AppButton.vue'
import Readout from './ui/Readout.vue'
import { PROBLEMS } from '../problems/index.js'
import { createFrameLab } from '../lib/frameLab.js'
import { solve } from '../services/problemsApi.js'
import { useTraceRunner } from '../composables/useTraceRunner.js'
import { useLabHotkeys } from '../composables/useLabHotkeys.js'

// 문제 플러그인 공용 페이지. 문제별 정의/렌더러/인터랙션은 src/problems/<id>/가 담당.
const props = defineProps({ problemId: { type: String, required: true } })

const problem = computed(() => PROBLEMS[props.problemId])
const router = useRouter()

const canvasRef = ref(null)
const paramVals = reactive({})
const speed = ref(4)
const stat = ref({})
let input = null
let lab = null
let disposeInteract = null

const runner = useTraceRunner({
  getLab: () => lab,
  solve: () => solve(problem.value.toRequest(paramVals, input)),
})
const { dirty, running, run, play, pause, step, reset } = runner

function markEdited() {
  if (lab) lab.clearTrace()
  runner.markDirty()
}

function initState() {
  const p = problem.value
  Object.keys(paramVals).forEach((k) => delete paramVals[k])
  p.params.forEach((d) => { paramVals[d.key] = d.default })
  speed.value = p.speed.default
  input = p.makeInput(paramVals)
  runner.markDirty()
}

function mountLab() {
  const p = problem.value
  lab = createFrameLab(canvasRef.value, {
    renderer: p.renderer,
    getInput: () => input,
    onStat: (s) => { stat.value = s },
    speed: speed.value,
  })
  if (p.interact) {
    disposeInteract = p.interact(canvasRef.value, {
      getInput: () => input,
      getParams: () => paramVals,
      markEdited,
    })
  }
}

function teardown() {
  if (disposeInteract) { disposeInteract(); disposeInteract = null }
  if (lab) { lab.dispose(); lab = null }
}

onMounted(() => {
  if (!problem.value) { router.replace('/'); return }
  initState(); mountLab()
})
onBeforeUnmount(teardown)

// 같은 컴포넌트로 다른 문제 라우트에 진입하는 경우 전체 재초기화
watch(() => props.problemId, () => {
  teardown()
  if (!problem.value) { router.replace('/'); return }
  initState(); mountLab()
})

function onParam(key, v) {
  paramVals[key] = v
  const next = problem.value.onParamChange(key, paramVals, input)
  if (next !== input) input = next
  markEdited()
}

function onSpeed(v) { speed.value = v; lab && lab.setSpeed(v) }

function randomize() {
  input = problem.value.makeInput(paramVals)
  markEdited()
}

useLabHotkeys({
  onPlayPause: () => { if (!lab) return; lab.isPlaying() ? pause() : play() },
  onReset: () => reset(),
  onStepForward: () => step(),
})

const statusLine = computed(() => problem.value.status(stat.value))
const readoutItems = computed(() => problem.value.readout(stat.value))
</script>

<template>
  <AlgorithmLayout
    v-if="problem"
    :index="problem.index" :title="problem.title"
    :subtitle="problem.subtitle"
    :tags="problem.tags" :eq="problem.eq">
    <template #viewport>
      <AlgoViewport :hint="problem.viewportHint">
        <template #expr>{{ problem.title }}</template>
        <template #status>
          <div class="ln">{{ statusLine }}</div>
        </template>
        <canvas ref="canvasRef" class="vp-host"></canvas>
      </AlgoViewport>
    </template>

    <template #controls>
      <ControlPanel number="01" title="Run">
        <div class="btnrow">
          <AppButton :variant="dirty ? 'solid' : 'ghost'" :disabled="running" @click="run">Run</AppButton>
          <AppButton variant="ghost" @click="play">Play</AppButton>
          <AppButton variant="ghost" @click="pause">Pause</AppButton>
          <AppButton variant="ghost" @click="step">Step</AppButton>
          <AppButton variant="ghost" @click="reset">Reset</AppButton>
        </div>
        <RangeField :model-value="speed" :min="problem.speed.min" :max="problem.speed.max" :step="problem.speed.step"
          label="Speed (step/s)" @update:model-value="onSpeed" />
        <p v-if="dirty" class="hint">문제를 편집했습니다 — Run 또는 Step을 누르면 다시 계산됩니다.</p>
      </ControlPanel>

      <ControlPanel number="02" title="Problem">
        <RangeField v-for="d in problem.params" :key="d.key"
          :model-value="paramVals[d.key]" :min="d.min" :max="d.max" :step="d.step"
          :label="d.label" @update:model-value="(v) => onParam(d.key, v)" />
        <div class="btnrow">
          <AppButton variant="ghost" @click="randomize">Random</AppButton>
        </div>
      </ControlPanel>

      <ControlPanel number="03" title="Readout">
        <Readout :items="readoutItems" />
      </ControlPanel>
    </template>

    <template #explain>
      <div class="ex-head">
        <p>{{ problem.explain }}</p>
        <p class="backlink">
          <RouterLink :to="problem.parent.route">← {{ problem.parent.label }} 개념 페이지로</RouterLink>
        </p>
      </div>
    </template>
  </AlgorithmLayout>
</template>

<style scoped>
.vp-host{position:absolute;inset:0;width:100%;height:100%;}
.btnrow{display:flex;gap:10px;flex-wrap:wrap;}
.hint{font-family:var(--mono);font-size:11px;color:var(--fg-mute);}
.ln{color:var(--fg-dim);}
.ex-head{max-width:60ch;}
.ex-head p{color:var(--fg-dim);font-size:16px;line-height:1.7;}
.backlink{font-family:var(--mono);font-size:12px;}
.backlink a{color:var(--acc);}
</style>
