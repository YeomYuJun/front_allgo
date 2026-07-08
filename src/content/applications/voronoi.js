// Voronoi 응용 카드. preset은 Voronoi.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: '기지국 커버리지 · 배달 권역',
    body: '통신사가 기지국을 세우면 각 단말은 가장 가까운 기지국에 붙는다 — 서비스 권역이 곧 보로노이 셀이다. 배달앱의 지점 담당 구역, 편의점 상권 분석도 같은 수학이다.',
    preset: { count: 24, metric: 'euclid' },
    presetLabel: '기지국 24개로 재현',
  },
  {
    angle: 'dev',
    title: '최근접 검색 · 게임 AI 영토',
    body: '"가장 가까운 지점 찾기"를 매번 전수 비교하면 O(n). 보로노이의 듀얼인 들로네 삼각분할을 미리 만들어 두면 이웃 탐색이 상수에 가깝다. RTS 게임의 세력권, 절차적 맵 생성에도 쓰인다.',
    preset: { count: 14, metric: 'euclid', delaunay: true },
    presetLabel: 'Delaunay 듀얼 보기',
  },
  {
    angle: 'math',
    title: '거리 정의가 바뀌면 경계가 바뀐다',
    body: '유클리드 거리에서 셀 경계는 두 사이트의 수직이등분선(직선)이다. 맨해튼 거리로 바꾸면 경계가 꺾인 선이 된다 — "가깝다"의 정의 자체가 기하를 결정한다는 것을 눈으로 확인해 보라.',
    preset: { count: 10, metric: 'manhattan' },
    presetLabel: '맨해튼 거리로 전환',
  },
]
