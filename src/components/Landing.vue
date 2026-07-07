<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ALGOS } from '../lib/landingAlgorithms.js'
import { makeSaddle, previews } from '../lib/landingViz.js'
import { prefersReducedMotion } from '../lib/motion.js'

const rootRef = ref(null)
const algoSecRef = ref(null)
const heroCanvas = ref(null)
const previewCanvas = ref(null)

const activeKey = ref('plotter')
const active = computed(() => ALGOS.find((a) => a.key === activeKey.value) || ALGOS[0])
const navScrolled = ref(false)
const pvStat = ref('')
const hudTheta = ref('0.00')
const hudCur = ref('0.0, 0.0')

let hero = null
let current = null
let thetaTimer = null
let observer = null

function activate(key) {
  if (key === activeKey.value && current) return
  activeKey.value = key
  if (current) { current.stop(); current = null }
  pvStat.value = ''
  const factory = previews[key]
  if (!factory || !previewCanvas.value) return
  if (key === 'montecarlo') {
    current = factory(previewCanvas.value, (pi, n) => { pvStat.value = `π ≈ <b>${pi}</b> · n=${n}` })
  } else {
    current = factory(previewCanvas.value)
  }
  current.start()
}

function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onScroll() { navScrolled.value = window.scrollY > 40 }

function onMouseMove(e) {
  const x = ((e.clientX / window.innerWidth) * 4 - 2).toFixed(1)
  const y = ((e.clientY / window.innerHeight) * -4 + 2).toFixed(1)
  hudCur.value = `${x}, ${y}`
}

function revealCheck() {
  if (!rootRef.value) return
  const skip = document.visibilityState !== 'visible'
  rootRef.value.querySelectorAll('.reveal:not(.in)').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
      el.classList.add('in')
      if (skip) { el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none' }
    }
  })
}

onMounted(() => {
  hero = makeSaddle(heroCanvas.value, {
    density: 30, autoSpin: prefersReducedMotion() ? 0 : 0.0015, rotX: -0.95, rotY: 0.4,
    scale: 1.16, alpha: 0.95, parallax: true, yShift: 0.02, xShift: 0.18, lineWidth: 1,
  })
  hero.start()

  let th = 0
  thetaTimer = setInterval(() => {
    th = (th + 0.0015 * 16) % (Math.PI * 2)
    hudTheta.value = th.toFixed(2)
  }, 16)

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  window.addEventListener('scroll', revealCheck, { passive: true })
  window.addEventListener('resize', revealCheck)
  document.addEventListener('visibilitychange', revealCheck)
  revealCheck(); setTimeout(revealCheck, 120); setTimeout(revealCheck, 450)

  activate('plotter')

  observer = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!current) return
    if (e.isIntersecting) current.start(); else current.stop()
  }), { threshold: 0.05 })
  if (algoSecRef.value) observer.observe(algoSecRef.value)
})

onBeforeUnmount(() => {
  if (hero) hero.stop()
  if (current) current.stop()
  if (thetaTimer) clearInterval(thetaTimer)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('scroll', revealCheck)
  window.removeEventListener('resize', revealCheck)
  document.removeEventListener('visibilitychange', revealCheck)
  if (observer) observer.disconnect()
})
</script>

<template>
  <div class="landing" ref="rootRef">
    <nav :class="{ scrolled: navScrolled }">
      <a class="brand" href="#top" @click.prevent="scrollToId('top')">
        <span class="mark"></span>
        <span>
          <span class="name">AllGoMath</span>
          <span class="sub">Algorithm · I · Math</span>
        </span>
      </a>
      <div class="navlinks">
        <a href="#algorithms" @click.prevent="scrollToId('algorithms')">Algorithms</a>
        <a href="#sortings" @click.prevent="scrollToId('sortings')">Sortings</a>
        <a href="#about" @click.prevent="scrollToId('about')">About</a>
        <a class="cta" href="#algorithms" @click.prevent="scrollToId('algorithms')">Open the lab →</a>
      </div>
    </nav>

    <header class="hero" id="top">
      <canvas ref="heroCanvas" id="heroCanvas"></canvas>
      <div class="hero-inner">
        <div class="wrap">
          <div class="hero-eyebrow reveal">
            <span class="dot"></span>
            <span class="tag">Interactive visualization lab · v.2026</span>
          </div>
          <h1 class="reveal">Algorithms you can <em>reach into.</em></h1>
          <p class="lead reveal">AllGoMath renders mathematical algorithms in real time. Adjust the numbers, move the camera, and watch the structure respond — every surface, curve and sample is live.</p>
          <div class="hero-actions reveal">
            <a class="btn btn-primary" href="#algorithms" @click.prevent="scrollToId('algorithms')">Explore the index <span class="arrow">→</span></a>
            <a class="btn btn-ghost" href="#about" @click.prevent="scrollToId('about')">How it works</a>
          </div>
        </div>
      </div>
      <div class="hud">
        <span>ƒ(x,y) = <b>x² − y²</b></span>
        <span>θ <b>{{ hudTheta }}</b></span>
        <span>cursor <b>{{ hudCur }}</b></span>
      </div>
      <div class="scrollcue"><span>scroll</span><span class="ln"></span></div>
    </header>

    <main>
      <section class="algorithms wrap" id="algorithms" ref="algoSecRef">
        <div class="sec-head reveal">
          <div class="l">
            <span class="tag">Index / Algorithms</span>
            <h2><span class="num">10</span>Choose a visualization</h2>
          </div>
          <p class="desc">Hover an entry to preview it live, then open the full interactive plotter with controls and camera.</p>
        </div>

        <div class="algo-layout">
          <div class="algo-list">
            <RouterLink
              v-for="a in ALGOS"
              :key="a.key"
              :to="a.route"
              class="algo-row"
              :class="{ active: a.key === activeKey }"
              @mouseenter="activate(a.key)"
              @focus="activate(a.key)"
            >
              <span class="idx">{{ a.idx }}</span>
              <div class="body">
                <div class="name">{{ a.name }}</div>
                <div class="meta">{{ a.meta }}</div>
              </div>
              <div class="end">
                <div class="tags"><span class="chip" v-for="t in a.tags" :key="t">{{ t }}</span></div>
                <span class="go">↗</span>
              </div>
            </RouterLink>
          </div>

          <aside class="algo-preview">
            <div class="pv-frame">
              <div class="pv-top">
                <span class="tag">{{ active.name.toLowerCase() }}</span>
                <span class="dots"><i></i><i></i><i></i></span>
              </div>
              <div class="pv-canvas-wrap">
                <canvas ref="previewCanvas" id="previewCanvas"></canvas>
                <div class="pv-stat" v-html="pvStat"></div>
              </div>
            </div>
            <div class="pv-meta">
              <div class="pv-idx">/ {{ active.idx }}</div>
              <div class="pv-name">{{ active.name }}</div>
              <div class="pv-eq">{{ active.eq }}</div>
              <div class="pv-desc">{{ active.desc }}</div>
              <RouterLink class="pv-open" :to="active.route">Open visualization <span>→</span></RouterLink>
            </div>
          </aside>
        </div>
      </section>

      <section class="sortings wrap" id="sortings">
        <div class="sec-head reveal">
          <div class="l">
            <span class="tag">Index / Sortings</span>
            <h2><span class="num">00</span>Sorting algorithms</h2>
          </div>
          <p class="desc">Comparison and distribution sorts, visualized step by step. Currently in development.</p>
        </div>
        <div class="soon-block reveal">
          <div class="lft">
            <h3>Sorting visualizations</h3>
            <p>Bubble, merge, quick, radix and more — animated with live comparison counts and array states. Stay tuned for the next release.</p>
          </div>
          <div class="soon-right">
            <div class="sort-bars">
              <i style="animation-delay:0s"></i><i style="animation-delay:.15s"></i><i style="animation-delay:.3s"></i>
              <i style="animation-delay:.45s"></i><i style="animation-delay:.6s"></i><i style="animation-delay:.75s"></i>
              <i style="animation-delay:.9s"></i>
            </div>
            <span class="badge">Coming soon</span>
          </div>
        </div>
      </section>
    </main>

    <footer id="about">
      <div class="wrap">
        <div class="foot-grid">
          <div class="big reveal">Made for<br>people who think in <span>functions.</span></div>
          <div class="foot-right reveal">
            <div class="tag" style="margin-bottom:6px;">Contact</div>
            <a href="mailto:yyj2046@gmail.com">yyj2046@gmail.com</a>
            <a href="#top" @click.prevent="scrollToId('top')">Back to top ↑</a>
          </div>
        </div>
        <div class="foot-bottom">
          <span>© 2026 AllGoMath — yyj2046</span>
          <span>Built with Three.js · canvas · real-time rendering</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing { position: relative; z-index: 1; }
a { color: inherit; text-decoration: none; }
.eq { font-family: var(--serif); font-style: italic; }
.wrap { max-width: 1280px; margin: 0 auto; padding: 0 40px; }
.tag { font-family: var(--mono); font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--fg-mute); }

nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 40px; border-bottom: 1px solid transparent;
  transition: background .4s ease, border-color .4s ease, backdrop-filter .4s;
}
nav.scrolled { background: rgba(10, 11, 12, .72); backdrop-filter: blur(14px); border-color: var(--line); }
.brand { display: flex; align-items: center; gap: 12px; }
.brand .mark { width: 24px; height: 24px; border: 1.5px solid var(--acc); border-radius: 5px; display: grid; place-items: center; position: relative; flex: none; }
.brand .mark::after { content: ""; width: 7px; height: 7px; background: var(--acc); border-radius: 50%; }
.brand .name { display: block; font-weight: 700; font-size: 16px; letter-spacing: -.01em; }
.brand .sub { display: block; font-family: var(--mono); font-size: 10px; color: var(--fg-mute); letter-spacing: .08em; margin-top: 1px; }
.navlinks { display: flex; align-items: center; gap: 34px; }
.navlinks a { font-family: var(--mono); font-size: 12px; letter-spacing: .06em; color: var(--fg-dim); transition: color .2s; }
.navlinks a:hover { color: var(--fg); }
.navlinks a.cta { color: var(--bg); background: var(--acc); padding: 8px 16px; border-radius: 6px; font-weight: 700; transition: transform .2s, box-shadow .2s; }
.navlinks a.cta:hover { color: var(--bg); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(200, 255, 0, .22); }

.hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; }
#heroCanvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
.hero::after {
  content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background:
    linear-gradient(90deg, rgba(10, 11, 12, .95) 0%, rgba(10, 11, 12, .72) 26%, rgba(10, 11, 12, .22) 48%, transparent 64%),
    radial-gradient(ellipse 70% 60% at 72% 50%, transparent 42%, rgba(10, 11, 12, .5) 100%),
    linear-gradient(180deg, rgba(10, 11, 12, .6) 0%, transparent 20%, transparent 72%, var(--bg) 100%);
}
.hero-inner { position: relative; z-index: 3; width: 100%; }
.hero-eyebrow { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; }
.hero-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 12px var(--acc); }
.hero h1 { font-size: clamp(44px, 8vw, 108px); font-weight: 700; line-height: .94; letter-spacing: -.035em; max-width: 14ch; }
.hero h1 em { font-style: normal; color: var(--acc); }
.hero p.lead { margin-top: 30px; max-width: 46ch; font-size: clamp(15px, 1.4vw, 18px); color: var(--fg-dim); line-height: 1.6; }
.hero-actions { display: flex; gap: 14px; margin-top: 40px; flex-wrap: wrap; }
.btn { font-family: var(--mono); font-size: 13px; letter-spacing: .03em; padding: 14px 24px; border-radius: 8px; display: inline-flex; align-items: center; gap: 10px; transition: transform .2s, background .2s, border-color .2s, box-shadow .2s; cursor: pointer; }
.btn-primary { background: var(--acc); color: var(--bg); font-weight: 700; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(200, 255, 0, .25); }
.btn-ghost { border: 1px solid var(--line-2); color: var(--fg); }
.btn-ghost:hover { border-color: var(--acc); color: var(--acc); }
.btn .arrow { transition: transform .2s; }
.btn:hover .arrow { transform: translateX(3px); }
.hud { position: absolute; left: 40px; bottom: 34px; z-index: 3; font-family: var(--mono); font-size: 11px; color: var(--fg-mute); display: flex; gap: 26px; letter-spacing: .05em; }
.hud b { color: var(--acc); font-weight: 400; }
.scrollcue { position: absolute; right: 40px; bottom: 34px; z-index: 3; font-family: var(--mono); font-size: 11px; color: var(--fg-mute); letter-spacing: .12em; display: flex; align-items: center; gap: 10px; text-transform: uppercase; }
.scrollcue .ln { width: 38px; height: 1px; background: var(--line-2); position: relative; overflow: hidden; }
.scrollcue .ln::after { content: ""; position: absolute; inset: 0; width: 14px; background: var(--acc); animation: slide 2.2s ease-in-out infinite; }
@keyframes slide { 0% { transform: translateX(-14px); } 100% { transform: translateX(38px); } }

section { position: relative; z-index: 3; }
.sec-head { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 30px; border-bottom: 1px solid var(--line); margin-bottom: 0; flex-wrap: wrap; gap: 20px; }
.sec-head .l { display: flex; flex-direction: column; gap: 14px; }
.sec-head h2 { font-size: clamp(30px, 4.4vw, 52px); font-weight: 600; letter-spacing: -.03em; line-height: 1; }
.sec-head h2 .num { color: var(--fg-mute); font-family: var(--mono); font-size: .4em; vertical-align: super; font-weight: 400; margin-right: 10px; }
.sec-head .desc { color: var(--fg-dim); font-size: 15px; max-width: 40ch; }

.algorithms { padding: 140px 0 120px; }
.algo-layout { display: grid; grid-template-columns: 1.15fr .85fr; gap: 56px; margin-top: 56px; align-items: start; }
.algo-list { display: flex; flex-direction: column; }
.algo-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 24px; padding: 26px 8px; border-bottom: 1px solid var(--line); cursor: pointer; position: relative; transition: padding .35s cubic-bezier(.2, .7, .2, 1); }
.algo-row::before { content: ""; position: absolute; left: -40px; top: 0; bottom: 0; width: 2px; background: var(--acc); transform: scaleY(0); transform-origin: top; transition: transform .35s cubic-bezier(.2, .7, .2, 1); }
.algo-row:hover, .algo-row.active { padding-left: 24px; }
.algo-row.active::before { transform: scaleY(1); }
.algo-row .idx { font-family: var(--mono); font-size: 13px; color: var(--fg-mute); transition: color .3s; }
.algo-row.active .idx { color: var(--acc); }
.algo-row .body .name { font-size: clamp(22px, 2.4vw, 30px); font-weight: 600; letter-spacing: -.02em; transition: color .3s; line-height: 1.1; }
.algo-row.active .body .name { color: var(--acc); }
.algo-row .body .meta { font-size: 13.5px; color: var(--fg-dim); margin-top: 7px; transition: opacity .3s; }
.algo-row .end { display: flex; align-items: center; gap: 16px; }
.algo-row .tags { display: flex; gap: 6px; }
.algo-row .chip { font-family: var(--mono); font-size: 10px; letter-spacing: .05em; color: var(--fg-mute); border: 1px solid var(--line); padding: 4px 8px; border-radius: 20px; white-space: nowrap; }
.algo-row .go { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line-2); display: grid; place-items: center; color: var(--fg-dim); flex: none; transition: background .3s, color .3s, border-color .3s, transform .3s; }
.algo-row:hover .go, .algo-row.active .go { background: var(--acc); color: var(--bg); border-color: var(--acc); transform: rotate(-45deg); }

.algo-preview { position: sticky; top: 96px; }
.pv-frame { border: 1px solid var(--line); border-radius: 14px; background: var(--panel); overflow: hidden; position: relative; }
.pv-frame .pv-top { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.pv-frame .pv-top .dots { display: flex; gap: 6px; }
.pv-frame .pv-top .dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--line-2); }
.pv-canvas-wrap { position: relative; aspect-ratio: 1 / .84; background: radial-gradient(circle at 50% 45%, rgba(200, 255, 0, .05), transparent 60%), var(--bg); }
#previewCanvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.pv-stat { position: absolute; left: 14px; bottom: 12px; font-family: var(--mono); font-size: 11px; color: var(--fg-mute); letter-spacing: .04em; }
.pv-stat b { color: var(--acc); font-weight: 400; }
.pv-meta { padding: 24px 22px 26px; }
.pv-meta .pv-idx { font-family: var(--mono); font-size: 11px; color: var(--fg-mute); letter-spacing: .1em; }
.pv-meta .pv-name { font-size: 26px; font-weight: 600; letter-spacing: -.02em; margin-top: 10px; }
.pv-meta .pv-eq { font-family: var(--serif); font-style: italic; font-size: 21px; color: var(--acc); margin-top: 14px; }
.pv-meta .pv-desc { color: var(--fg-dim); font-size: 14px; line-height: 1.6; margin-top: 14px; }
.pv-meta .pv-open { margin-top: 22px; display: inline-flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 12px; color: var(--acc); letter-spacing: .04em; border: 1px solid var(--acc-ghost); background: var(--acc-ghost); padding: 11px 18px; border-radius: 8px; transition: background .2s, gap .2s; }
.pv-meta .pv-open:hover { background: rgba(200, 255, 0, .16); gap: 14px; }

.sortings { padding: 0 0 130px; }
.soon-block { margin-top: 48px; border: 1px dashed var(--line-2); border-radius: 14px; padding: 60px 48px; display: flex; align-items: center; justify-content: space-between; gap: 30px; background: linear-gradient(180deg, var(--panel), transparent); flex-wrap: wrap; }
.soon-block .lft h3 { font-size: 26px; font-weight: 600; letter-spacing: -.02em; }
.soon-block .lft p { color: var(--fg-dim); margin-top: 8px; font-size: 14px; max-width: 48ch; }
.soon-block .badge { font-family: var(--mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--fg-mute); border: 1px solid var(--line); padding: 8px 16px; border-radius: 30px; white-space: nowrap; }
.soon-right { display: flex; align-items: center; gap: 28px; }
.sort-bars { display: flex; align-items: flex-end; gap: 5px; height: 54px; }
.sort-bars i { width: 8px; background: var(--line-2); border-radius: 2px; animation: bars 2.4s ease-in-out infinite; }
@keyframes bars { 0%, 100% { height: 14px; } 50% { height: 48px; background: var(--acc-deep); } }

footer { border-top: 1px solid var(--line); padding: 70px 0 50px; position: relative; z-index: 3; }
.foot-grid { display: flex; justify-content: space-between; align-items: flex-start; gap: 40px; flex-wrap: wrap; }
.foot-grid .big { font-size: clamp(30px, 5vw, 60px); font-weight: 700; letter-spacing: -.035em; line-height: .95; }
.foot-grid .big span { color: var(--fg-mute); }
.foot-right { text-align: right; display: flex; flex-direction: column; gap: 10px; font-family: var(--mono); font-size: 12px; color: var(--fg-dim); }
.foot-right a:hover { color: var(--acc); }
.foot-bottom { margin-top: 50px; padding-top: 24px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 14px; font-family: var(--mono); font-size: 11px; color: var(--fg-mute); letter-spacing: .04em; }

.reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s cubic-bezier(.2, .7, .2, 1), transform .8s cubic-bezier(.2, .7, .2, 1); }
.reveal.in { opacity: 1; transform: none; }

@media (max-width: 900px) {
  .algo-layout { grid-template-columns: 1fr; gap: 40px; }
  .algo-preview { position: relative; top: 0; order: -1; }
  .navlinks { gap: 18px; }
  .navlinks a:not(.cta) { display: none; }
  .hud { display: none; }
  .algo-row .tags { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .scrollcue .ln::after, .sort-bars i { animation: none; }
  .reveal { transition: none; opacity: 1; transform: none; }
}
</style>
