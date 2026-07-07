<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isLanding = computed(() => route.path === '/')

// 전역 API 오류 토스트 (services/api.js가 dispatch)
const apiError = ref('')
let toastTimer = null
function onApiError(e) {
  apiError.value = e.detail?.message || 'API error'
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { apiError.value = '' }, 4000)
}
onMounted(() => window.addEventListener('agm:api-error', onApiError))
onBeforeUnmount(() => { clearTimeout(toastTimer); window.removeEventListener('agm:api-error', onApiError) })

const links = [
  { to: '/plotter', label: 'Plotter' },
  { to: '/fractal', label: 'Fractal' },
  { to: '/bezier', label: 'Bezier' },
  { to: '/fourier', label: 'Fourier' },
  { to: '/cellular-automata', label: 'Life' },
  { to: '/double-pendulum', label: 'Pendulum' },
  { to: '/lissajous', label: 'Lissajous' },
  { to: '/flow', label: 'Flow' },
  { to: '/voronoi', label: 'Voronoi' },
  { to: '/breadth-first-search', label: 'BFS' },
  { to: '/dynamic-programming', label: 'DP' },
  { to: '/depth-first-search', label: 'DFS' },
  { to: '/greedy', label: 'Greedy' },
  { to: '/fourier-transform', label: 'FFT' },
  { to: '/sorting', label: 'Sorting' },
]
</script>

<template>
  <div class="agm-root agm-grid-bg">
    <nav v-if="!isLanding">
      <RouterLink to="/" class="brand">
        <span class="mark"></span>
        <span class="name">AllGoMath</span>
      </RouterLink>
      <div class="navlinks">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" active-class="on">{{ l.label }}</RouterLink>
        <RouterLink to="/monte-carlo" class="cta">Open the lab</RouterLink>
      </div>
    </nav>
    <slot />
    <transition name="toastfade">
      <div v-if="apiError" class="api-toast" role="alert">API error — {{ apiError }}</div>
    </transition>
    <footer v-if="!isLanding">
      <div class="foot-bottom wrap">
        <span>AllGoMath</span>
        <span>yyj2046@gmail.com</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:16px 40px;background:rgba(10,11,12,.72);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);}
.brand{display:flex;align-items:center;gap:12px;}
.brand .mark{width:24px;height:24px;border:1.5px solid var(--acc);border-radius:5px;display:grid;place-items:center;flex:none;}
.brand .mark::after{content:"";width:7px;height:7px;background:var(--acc);border-radius:50%;}
.brand .name{font-weight:700;font-size:16px;letter-spacing:-.01em;}
.navlinks{display:flex;align-items:center;gap:28px;}
.navlinks a{font-family:var(--mono);font-size:12px;letter-spacing:.06em;color:var(--fg-dim);transition:color .2s;}
.navlinks a:hover,.navlinks a.on{color:var(--fg);}
.navlinks a.cta{color:var(--bg);background:var(--acc);padding:8px 16px;border-radius:6px;font-weight:700;}
footer{border-top:1px solid var(--line);padding:60px 0 50px;margin-top:80px;position:relative;z-index:3;}
.foot-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px;font-family:var(--mono);font-size:11px;color:var(--fg-mute);letter-spacing:.04em;max-width:1280px;margin:0 auto;padding:0 40px;}
.api-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:80;font-family:var(--mono);font-size:12px;letter-spacing:.03em;color:var(--fg);background:rgba(10,11,12,.92);border:1px solid var(--danger);border-radius:8px;padding:11px 18px;box-shadow:0 8px 30px rgba(0,0,0,.5);}
.toastfade-enter-active,.toastfade-leave-active{transition:opacity .25s,transform .25s;}
.toastfade-enter-from,.toastfade-leave-to{opacity:0;transform:translateX(-50%) translateY(8px);}
@media (max-width:760px){ .navlinks a:not(.cta){display:none;} }
</style>
