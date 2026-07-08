import { accent } from '../../lib/theme.js'

const ACC = accent()

// 캔버스 레이아웃: 왼쪽 아이템 목록 + 오른쪽 DP 테이블. draw와 클릭 판정이 공유한다.
function geom(W, H, input, capacity) {
  const n = input.items.length
  const listW = Math.min(200, Math.floor(W * 0.28))
  const padL = 16, padT = 40, padB = 16, gap = 18
  const tableX = padL + listW + gap
  const cols = capacity + 1
  const cell = Math.max(12, Math.floor(Math.min((W - tableX - 16) / cols, (H - padT - padB) / (n + 1))))
  return { n, listW, padL, padT, tableX, cols, cell }
}

// frames[0..head)를 재적용해 화면 상태를 만든다
function replay(view) {
  const cells = new Map()
  const picked = new Set()
  let pickStarted = false
  let cur = null
  for (let k = 0; k < view.head; k++) {
    const f = view.frames[k]
    if (f.op === 'cell') cells.set(f.args.i * 100 + f.args.w, f.args)
    else if (f.op === 'pick') { picked.add(f.args.i - 1); pickStarted = true }
    cur = f
  }
  return { cells, picked, pickStarted, cur }
}

function capacityOf(view) {
  return view.meta.capacity ?? view.input.capacity
}

const renderer = {
  draw(ctx, view) {
    const input = view.input
    if (!input) return
    const K = capacityOf(view)
    const g = geom(view.W, view.H, input, K)
    const { cells, picked, pickStarted, cur } = replay(view)
    const mono = (s) => `${s}px 'Space Mono', monospace`

    // 아이템 목록 (테이블 행과 정렬)
    for (let i = 0; i < g.n; i++) {
      const y = g.padT + (i + 1) * g.cell
      const it = input.items[i]
      const isPicked = picked.has(i)
      ctx.fillStyle = isPicked ? 'rgba(200,255,0,0.14)' : 'rgba(255,255,255,0.03)'
      ctx.fillRect(g.padL, y + 1, g.listW, g.cell - 2)
      if (isPicked) { ctx.strokeStyle = ACC; ctx.lineWidth = 1.5; ctx.strokeRect(g.padL + 1, y + 2, g.listW - 2, g.cell - 4) }
      ctx.fillStyle = isPicked ? ACC : 'rgba(154,158,164,0.9)'
      ctx.font = mono(Math.min(12, Math.round(g.cell * 0.42)))
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText(`#${i + 1}`, g.padL + 8, y + g.cell / 2)
      ctx.fillText(`w ${it.w}`, g.padL + g.listW * 0.3, y + g.cell / 2)
      ctx.fillText(`v ${it.v}`, g.padL + g.listW * 0.66, y + g.cell / 2)
    }
    ctx.fillStyle = 'rgba(98,102,108,0.9)'
    ctx.font = mono(10); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'
    ctx.fillText('items (click: w/v edit)', g.padL, g.padT - 6)

    // DP 테이블 헤더 (무게 축)
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    const wStep = g.cell >= 18 ? 1 : 5
    for (let w = 0; w <= K; w += wStep) {
      ctx.fillStyle = 'rgba(98,102,108,0.9)'; ctx.font = mono(9)
      ctx.fillText(w, g.tableX + w * g.cell + g.cell / 2, g.padT + g.cell / 2)
    }
    // 테이블 셀 (행 1..n)
    for (let i = 1; i <= g.n; i++) {
      for (let w = 0; w <= K; w++) {
        const x = g.tableX + w * g.cell, y = g.padT + i * g.cell
        const c = cells.get(i * 100 + w)
        ctx.fillStyle = c ? (c.take ? 'rgba(90,120,50,0.4)' : 'rgba(60,80,40,0.22)') : '#0e1013'
        ctx.fillRect(x, y + 1, g.cell - 1, g.cell - 2)
        if (c && g.cell >= 17) {
          ctx.fillStyle = '#c9ccd1'; ctx.font = mono(Math.round(g.cell * 0.38))
          ctx.fillText(c.value, x + g.cell / 2, y + g.cell / 2)
        }
      }
    }
    // 현재 프레임 강조
    if (cur && view.phase !== 'idle' && view.head < view.frames.length) {
      const { i, w } = cur.args
      const x = g.tableX + w * g.cell, y = g.padT + i * g.cell
      ctx.strokeStyle = cur.op === 'pick' ? ACC : '#fff'; ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 2, g.cell - 3, g.cell - 4)
    }
    // 역추적 경로 셀
    if (pickStarted || view.phase === 'done') {
      for (let k = 0; k < view.head; k++) {
        const f = view.frames[k]
        if (f.op !== 'pick') continue
        const x = g.tableX + f.args.w * g.cell, y = g.padT + f.args.i * g.cell
        ctx.strokeStyle = ACC; ctx.lineWidth = 2
        ctx.strokeRect(x + 1, y + 2, g.cell - 3, g.cell - 4)
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
    ctx.strokeRect(g.tableX, g.padT + g.cell, g.cell * (K + 1), g.cell * g.n)
  },

  stat(view) {
    const { cells, picked, pickStarted } = replay(view)
    const total = view.frames.filter((f) => f.op === 'cell').length
    return {
      phase: view.phase,
      filled: cells.size,
      total,
      best: (pickStarted || view.phase === 'done') && view.frames.length ? view.meta.best : '—',
      picks: picked.size,
    }
  },
}

function randomItems(count) {
  return Array.from({ length: count }, () => ({
    w: 1 + Math.floor(Math.random() * 9),
    v: 1 + Math.floor(Math.random() * 9),
  }))
}

export default {
  id: 'knapsack',
  index: 'P1',
  title: 'Knapsack',
  subtitle: '0/1 배낭 (백준 12865) — 아이템별로 "넣는다/뺀다" 두 선택을 무게 축 전체에 펼쳐 최적을 확정한다. 아이템을 클릭해 무게·가치를 바꿔 보라.',
  tags: ['DP', 'knapsack', 'BOJ 12865', 'interactive'],
  eq: 'dp[i][w] = max(dp[i-1][w], dp[i-1][w-wᵢ]+vᵢ)',
  parent: { route: '/dynamic-programming', label: 'Dynamic Programming' },
  viewportHint: '아이템 행을 클릭하면 무게(왼쪽)/가치(오른쪽)가 바뀝니다',
  explain: '각 아이템은 "안 넣은 경우의 최적(위 칸)"과 "넣은 경우의 최적(왼쪽 위 칸+가치)" 중 큰 쪽을 취한다. 테이블이 다 차면 오른쪽 아래에서 역추적해 어떤 아이템을 넣었는지 복원한다. 연산은 백엔드가 수행하고 화면은 표준 trace를 재생할 뿐이다.',
  params: [
    { key: 'capacity', label: 'Capacity', min: 5, max: 20, step: 1, default: 12 },
    { key: 'count', label: 'Items', min: 3, max: 8, step: 1, default: 5 },
  ],
  speed: { min: 1, max: 30, step: 1, default: 8 },

  makeInput(params) {
    return { items: randomItems(params.count) }
  },
  // count 변경은 입력 재생성, capacity는 입력 유지(재계산만 필요)
  onParamChange(key, params, input) {
    return key === 'count' ? this.makeInput(params) : input
  },
  toRequest(params, input) {
    return { problemId: 'knapsack', params: { capacity: params.capacity }, input: { items: input.items } }
  },
  renderer,
  status(stat) {
    return `${stat.filled} filled · best ${stat.best}`
  },
  readout(stat) {
    return [
      { k: 'filled', v: `${stat.filled} / ${stat.total}`, acc: true },
      { k: 'best', v: String(stat.best) },
      { k: 'picked', v: String(stat.picks) },
      { k: 'phase', v: stat.phase },
    ]
  },

  interact(canvas, { getInput, getParams, markEdited }) {
    function onClick(e) {
      const input = getInput()
      const K = getParams().capacity
      const rct = canvas.getBoundingClientRect()
      const x = e.clientX - rct.left, y = e.clientY - rct.top
      const g = geom(rct.width, rct.height, input, K)
      if (x < g.padL || x > g.padL + g.listW) return
      const i = Math.floor((y - g.padT) / g.cell) - 1
      if (i < 0 || i >= input.items.length) return
      const it = input.items[i]
      if (x < g.padL + g.listW / 2) it.w = (it.w % 9) + 1
      else it.v = (it.v % 9) + 1
      markEdited()
    }
    canvas.addEventListener('click', onClick)
    return () => canvas.removeEventListener('click', onClick)
  },
}
