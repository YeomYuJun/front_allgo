// Fractal 응용 카드. preset은 Fractal.vue의 applyPreset이 해석한다 (view는 lab.setView로 전달).
export default [
  {
    angle: 'life',
    title: '해안선 길이의 역설',
    body: '해안선은 자를 짧게 잡을수록 길이가 끝없이 늘어난다 — 확대해도 계속 새 굴곡이 나오는 프랙탈이기 때문이다. 망델브로 경계를 확대해 보면 지도 제작자들이 겪는 문제를 그대로 체험할 수 있다.',
    preset: { type: 'mandelbrot', maxIter: 500, view: { cx: -0.7435, cy: 0.1314, span: 0.005 } },
    presetLabel: '경계 확대해 보기',
  },
  {
    angle: 'dev',
    title: '절차적 생성 — 코드 몇 줄, 무한 디테일',
    body: '게임의 지형·구름·행성 텍스처는 자산을 그리는 대신 수식으로 만든다. z를 제곱하고 더하는 한 줄이 이만한 복잡도를 만드는 것이 절차적 생성의 원형이다.',
    preset: { type: 'burningship', scheme: 'fire', maxIter: 300, view: { cx: -1.755, cy: -0.03, span: 0.1 } },
    presetLabel: 'Burning Ship 함선 보기',
  },
  {
    angle: 'math',
    title: '망델브로는 줄리아의 지도다',
    body: '망델브로 집합의 각 점 c는 줄리아 집합 하나에 대응한다. c가 집합 안이면 그 줄리아는 연결되어 있고, 밖이면 먼지처럼 흩어진다 — c = -0.8 + 0.156i의 줄리아를 직접 보라.',
    preset: { type: 'julia', jRe: -0.8, jIm: 0.156, scheme: 'ice', maxIter: 300 },
    presetLabel: 'c = -0.8+0.156i 줄리아',
  },
]
