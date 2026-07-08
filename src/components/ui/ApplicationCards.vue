<script setup>
defineProps({
  // { angle: 'life'|'dev'|'math', title, body, preset?, presetLabel? }[]
  cards: { type: Array, required: true },
})
defineEmits(['apply'])

const ANGLE = { life: '실생활', dev: '개발자', math: '수학자' }
</script>

<template>
  <div class="appcards">
    <article v-for="(c, i) in cards" :key="i" class="card">
      <span class="chip">{{ ANGLE[c.angle] || c.angle }}</span>
      <h4>{{ c.title }}</h4>
      <p>{{ c.body }}</p>
      <button v-if="c.preset" type="button" class="preset" @click="$emit('apply', c.preset)">
        {{ c.presetLabel }} →
      </button>
    </article>
  </div>
</template>

<style scoped>
.appcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:26px;}
.card{border:1px solid var(--line);border-radius:10px;padding:16px 18px;background:rgba(255,255,255,.015);display:flex;flex-direction:column;align-items:flex-start;}
.chip{font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--acc);border:1px solid rgba(200,255,0,.35);border-radius:20px;padding:3px 9px;}
.card h4{margin:11px 0 6px;font-size:14.5px;color:var(--fg);}
.card p{font-size:13px;line-height:1.65;color:var(--fg-dim);}
.preset{margin-top:auto;padding:10px 0 0;font-family:var(--mono);font-size:11.5px;color:var(--acc);background:none;border:none;cursor:pointer;}
.preset:hover{text-decoration:underline;}
</style>
