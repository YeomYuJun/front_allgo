// Plotter 응용 카드. preset은 Plotter.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: '지형과 등고선',
    body: '지도의 능선·계곡·봉우리는 고도 함수 f(x,y)의 그래프다. 등산로가 능선을 따라가듯, 빗물은 그래디언트의 반대 방향 — 가장 가파른 내리막 — 으로 흐른다.',
    preset: { fn: 'gaussian', heightColorOn: true, criticalOn: true },
    presetLabel: '봉우리 지형 보기',
  },
  {
    angle: 'dev',
    title: '머신러닝 학습 = 경사하강',
    body: '신경망 학습은 손실 함수 위에서 공을 굴리는 일이다. Rosenbrock 계곡은 옵티마이저 벤치마크의 고전 — 좁고 휘어진 골짜기에서 학습률이 너무 크면 발산하고, 너무 작으면 하세월이다.',
    preset: { fn: 'rosenbrock', startX: -1.8, startY: 1.6, learningRate: 0.005, maxIterations: 120 },
    presetLabel: 'Rosenbrock 계곡 하강',
  },
  {
    angle: 'math',
    title: '미분이 0이어도 극값이 아니다',
    body: '안장점에서는 모든 방향의 기울기가 0이지만 한 축으로는 오르막, 다른 축으로는 내리막이다. 고차원 딥러닝에서 학습이 느려지는 주범이 극소점이 아니라 안장점이라는 것이 알려져 있다.',
    preset: { fn: 'saddle', criticalOn: true, startX: 0.3, startY: 0.1 },
    presetLabel: '안장점 근처에서 하강',
  },
]
