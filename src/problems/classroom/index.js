import { accent } from '../../lib/theme.js'

const ACC = accent()
const T = 100

function roomColor(r, alpha = 0.85) {
  const hue = (75 + r * 53) % 360
  return `hsla(${hue}, 70%, 55%, ${alpha})`
}

// 위: 강의 목록(인덱스 순 레인), 아래: 강의실 레인. draw와 드래그 판정이 공유한다.
function geom(W, H, input) {
  const n = input.lectures.length
  const padX = 54, padT = 30, padB = 16, midGap = 34
  const lecH = (H - padT - padB - midGap) * 0.55
  const roomH = (H - padT - padB - midGap) * 0.45
  const roomY = padT + lecH + midGap
  return {
    n, padX, padT, lecH, roomY, roomH,
    laneH: lecH / n,
    xOf: (t) => padX + (t / T) * (W - padX - 20),
    tOf: (x) => ((x - padX) / (W - padX - 20)) * T,
  }
}

function replay(view) {
  const assigned = new Map()
  let rooms = 0
  let cur = null
  for (let k = 0; k < view.head; k++) {
    const f = view.frames[k]
    assigned.set(f.args.idx, f.args)
    rooms = Math.max(rooms, f.args.room + 1)
    cur = f
  }
  return { assigned, rooms, cur }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

const renderer = {
  draw(ctx, view) {
    const input = view.input
    if (!input) return
    const g = geom(view.W, view.H, input)
    const { assigned, rooms, cur } = replay(view)
    const mono = (s) => `${s}px 'Space Mono', monospace`

    ctx.fillStyle = 'rgba(98,102,108,0.9)'; ctx.font = mono(10)
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'
    ctx.fillText('lectures (drag to move)', g.padX, g.padT - 6)
    ctx.fillText('rooms', g.padX, g.roomY - 6)

    // 시간 눈금
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    for (let tk = 0; tk <= T; tk += 20) {
      const x = g.xOf(tk)
      ctx.beginPath(); ctx.moveTo(x, g.padT); ctx.lineTo(x, g.roomY + g.roomH); ctx.stroke()
      ctx.fillStyle = 'rgba(98,102,108,0.7)'; ctx.font = mono(9)
      ctx.fillText(tk, x, g.roomY + g.roomH + 4)
    }

    // 강의 레인
    for (let i = 0; i < g.n; i++) {
      const lec = input.lectures[i]
      const y = g.padT + i * g.laneH + g.laneH * 0.16, bh = g.laneH * 0.68
      const x0 = g.xOf(lec.s), x1 = g.xOf(lec.e)
      const a = assigned.get(i)
      roundRect(ctx, x0, y, x1 - x0, bh, Math.min(5, bh / 2))
      ctx.fillStyle = a ? roomColor(a.room, 0.75) : 'rgba(255,255,255,0.05)'
      ctx.fill()
      const isCur = cur && cur.args.idx === i && view.phase !== 'idle' && view.head < view.frames.length
      ctx.lineWidth = isCur ? 2.4 : 1.1
      ctx.strokeStyle = isCur ? '#fff' : a ? roomColor(a.room, 1) : 'rgba(255,255,255,0.22)'
      ctx.stroke()
      if (bh > 12 && x1 - x0 > 30) {
        ctx.fillStyle = a ? '#0a0b0c' : 'rgba(154,158,164,0.85)'
        ctx.font = mono(Math.min(11, Math.round(bh * 0.5)))
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(a ? `L${i} · R${a.room}` : `L${i}`, x0 + 6, y + bh / 2)
      }
    }

    // 강의실 레인 (배정 진행에 따라 드러남)
    const lanes = Math.max(rooms, 1)
    const rlH = g.roomH / lanes
    for (const [i, a] of assigned) {
      const lec = input.lectures[i]
      const y = g.roomY + a.room * rlH + rlH * 0.16, bh = rlH * 0.68
      const x0 = g.xOf(lec.s), x1 = g.xOf(lec.e)
      roundRect(ctx, x0, y, x1 - x0, bh, Math.min(5, bh / 2))
      ctx.fillStyle = roomColor(a.room, 0.9); ctx.fill()
      if (bh > 11 && x1 - x0 > 26) {
        ctx.fillStyle = '#0a0b0c'; ctx.font = mono(Math.min(11, Math.round(bh * 0.5)))
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(`L${i}`, x0 + 6, y + bh / 2)
      }
    }
    for (let r = 0; r < rooms; r++) {
      ctx.fillStyle = roomColor(r, 1); ctx.font = mono(10)
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      ctx.fillText(`R${r}`, g.padX - 8, g.roomY + r * rlH + rlH / 2)
    }
  },

  stat(view) {
    const { assigned, rooms } = replay(view)
    return {
      phase: view.phase,
      assigned: assigned.size,
      count: view.input ? view.input.lectures.length : 0,
      rooms,
      minRooms: view.phase === 'done' && view.frames.length ? view.meta.rooms : '—',
    }
  },
}

function randomLectures(count) {
  return Array.from({ length: count }, () => {
    const dur = 10 + Math.floor(Math.random() * 26)
    const s = Math.floor(Math.random() * (T - dur))
    return { s, e: s + dur }
  })
}

export default {
  id: 'classroom',
  index: 'P2',
  title: 'Classroom Assignment',
  subtitle: '강의실 배정 (백준 11000) — 시작시각 순으로 스캔하며 가장 일찍 비는 강의실(최소힙)에 넣는다. 강의를 드래그해 겹침을 바꿔 보라.',
  tags: ['greedy', 'min-heap', 'BOJ 11000', 'interactive'],
  eq: 'reuse if min(roomEnd) ≤ start, else open new room',
  parent: { route: '/greedy', label: 'Greedy Scheduling' },
  viewportHint: '강의 막대를 좌우로 드래그해 시간을 옮겨 보세요',
  explain: '겹치는 강의는 같은 방에 둘 수 없으므로, 필요한 강의실 수는 "동시에 진행 중인 강의의 최대 개수"다. 시작시각 순으로 보며 가장 일찍 끝나는 방이 비어 있으면 재사용하고 아니면 새 방을 연다 — 최소힙 하나로 최적이 보장되는 탐욕이다. 연산은 백엔드가 수행하고 화면은 표준 trace를 재생할 뿐이다.',
  params: [
    { key: 'count', label: 'Lectures', min: 3, max: 12, step: 1, default: 6 },
  ],
  speed: { min: 1, max: 10, step: 1, default: 2 },

  makeInput(params) {
    return { lectures: randomLectures(params.count) }
  },
  onParamChange(key, params, input) {
    return key === 'count' ? this.makeInput(params) : input
  },
  toRequest(params, input) {
    return { problemId: 'classroom', params: {}, input: { lectures: input.lectures } }
  },
  renderer,
  status(stat) {
    return `${stat.assigned}/${stat.count} assigned · rooms ${stat.rooms}`
  },
  readout(stat) {
    return [
      { k: 'rooms', v: String(stat.rooms), acc: true },
      { k: 'assigned', v: `${stat.assigned} / ${stat.count}` },
      { k: 'min rooms', v: String(stat.minRooms) },
      { k: 'phase', v: stat.phase },
    ]
  },

  interact(canvas, { getInput, markEdited }) {
    let dragIdx = -1, grabDt = 0
    function hit(e) {
      const input = getInput()
      const rct = canvas.getBoundingClientRect()
      const x = e.clientX - rct.left, y = e.clientY - rct.top
      const g = geom(rct.width, rct.height, input)
      const i = Math.floor((y - g.padT) / g.laneH)
      if (i < 0 || i >= input.lectures.length) return { i: -1 }
      const lec = input.lectures[i]
      if (x < g.xOf(lec.s) - 4 || x > g.xOf(lec.e) + 4) return { i: -1 }
      return { i, t: g.tOf(x) }
    }
    function down(e) {
      const h = hit(e)
      if (h.i < 0) return
      dragIdx = h.i
      grabDt = h.t - getInput().lectures[h.i].s
      if (e.cancelable) e.preventDefault()
    }
    function move(e) {
      if (dragIdx < 0) return
      const input = getInput()
      const lec = input.lectures[dragIdx]
      const rct = canvas.getBoundingClientRect()
      const g = geom(rct.width, rct.height, input)
      const dur = lec.e - lec.s
      let s = Math.round(g.tOf(e.clientX - rct.left) - grabDt)
      s = Math.max(0, Math.min(T - dur, s))
      if (s !== lec.s) { lec.s = s; lec.e = s + dur; markEdited() }
      if (e.cancelable) e.preventDefault()
    }
    function up() { dragIdx = -1 }
    canvas.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  },
}
