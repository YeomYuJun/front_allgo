<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ALGOS } from '../../lib/landingAlgorithms.js'

defineProps({
  index: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
  eq: { type: String, default: '' },
})

const route = useRoute()
const pos = computed(() => ALGOS.findIndex((a) => a.route === route.path))
const prevAlgo = computed(() => (pos.value < 0 ? null : ALGOS[(pos.value - 1 + ALGOS.length) % ALGOS.length]))
const nextAlgo = computed(() => (pos.value < 0 ? null : ALGOS[(pos.value + 1) % ALGOS.length]))
</script>

<template>
  <main class="wrap">
    <div class="crumb">
      <RouterLink to="/">Index</RouterLink>
      <span class="sep">/</span><span>{{ index }}</span>
      <span class="sep">/</span><span>{{ title }}</span>
    </div>
    <header class="head">
      <div class="l">
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="sub">{{ subtitle }}</p>
        <div v-if="tags.length" class="tags">
          <span v-for="t in tags" :key="t" class="chip">{{ t }}</span>
        </div>
      </div>
      <div v-if="eq" class="eqbig">{{ eq }}</div>
    </header>

    <div class="workspace">
      <div class="viewport"><slot name="viewport" /></div>
      <div class="controls"><slot name="controls" /></div>
    </div>

    <section v-if="$slots.explain" class="explain"><slot name="explain" /></section>

    <nav v-if="prevAlgo && nextAlgo" class="pager" aria-label="Lab navigation">
      <RouterLink :to="prevAlgo.route" class="pg prev">
        <span class="dir">← prev</span>
        <span class="nm">{{ prevAlgo.name }}</span>
      </RouterLink>
      <RouterLink to="/" class="pg home">Index</RouterLink>
      <RouterLink :to="nextAlgo.route" class="pg next">
        <span class="dir">next →</span>
        <span class="nm">{{ nextAlgo.name }}</span>
      </RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.wrap{max-width:1280px;margin:0 auto;padding:96px 40px 40px;position:relative;z-index:3;}
.crumb{display:flex;align-items:center;gap:12px;font-family:var(--mono);font-size:12px;color:var(--fg-mute);letter-spacing:.04em;margin-bottom:26px;}
.crumb a:hover{color:var(--acc);}
.crumb .sep{opacity:.5;}
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:34px;}
.head .l{display:flex;flex-direction:column;gap:16px;}
.head h1{font-size:clamp(34px,5vw,64px);font-weight:700;letter-spacing:-.035em;line-height:.98;color:var(--fg);}
.head .sub{color:var(--fg-dim);font-size:16px;max-width:48ch;}
.tags{display:flex;gap:8px;flex-wrap:wrap;}
.chip{font-family:var(--mono);font-size:10.5px;letter-spacing:.05em;color:var(--fg-mute);border:1px solid var(--line);padding:5px 11px;border-radius:20px;}
.eqbig{font-family:var(--serif);font-style:italic;font-size:clamp(22px,3vw,34px);color:var(--acc);white-space:nowrap;}
.workspace{display:grid;grid-template-columns:1.55fr 1fr;gap:24px;margin-top:34px;align-items:start;}
.viewport{border:1px solid var(--line);border-radius:14px;background:var(--panel);overflow:hidden;position:relative;}
.controls{display:flex;flex-direction:column;gap:16px;}
.explain{padding:80px 0 20px;}
.pager{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid var(--line);margin-top:40px;padding:26px 0 6px;}
.pg{display:flex;flex-direction:column;gap:5px;min-width:0;}
.pg .dir{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-mute);transition:color .2s;}
.pg .nm{font-size:15px;font-weight:600;color:var(--fg-dim);transition:color .2s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pg:hover .dir{color:var(--acc);}
.pg:hover .nm{color:var(--fg);}
.pg.next{text-align:right;align-items:flex-end;}
.pg.home{font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--fg-mute);border:1px solid var(--line);border-radius:20px;padding:7px 16px;flex:none;transition:color .2s,border-color .2s;}
.pg.home:hover{color:var(--acc);border-color:rgba(200,255,0,.4);}
@media (max-width:1080px){ .eqbig{display:none;} }
@media (max-width:1000px){ .workspace{grid-template-columns:1fr;} }
</style>
