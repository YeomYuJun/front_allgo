// DFS 응용 카드. preset은 DepthFirstSearch.vue의 applyPreset이 해석한다 (적용 후 자동 Run).
export default [
  {
    angle: 'life',
    title: '미로에서 오른손을 벽에 대라',
    body: '한 벽을 계속 짚으며 걷는 미로 탈출법은 사실 DFS다 — 막다른 길에서 되돌아 나와 다음 갈림길을 시도하는 백트래킹. 넓은 미로에서 탐색이 한 줄기로 깊게 파고드는 모습을 보라.',
    preset: { size: 40, maze: 'random' },
    presetLabel: '깊은 미로 탐험',
  },
  {
    angle: 'dev',
    title: '빌드 순서와 순환 참조 탐지',
    body: '패키지 의존성 설치 순서(위상정렬)와 "A가 B를, B가 A를 import" 탐지는 DFS의 방문 상태 3색 칠하기로 푼다. 스택이 깊어졌다 되감기는 이 화면이 콜스택 그 자체다.',
    preset: { size: 24, maze: 'random' },
    presetLabel: '스택 되감김 보기',
  },
  {
    angle: 'math',
    title: '완전하지만 최적은 아니다',
    body: 'DFS는 길이 있으면 반드시 찾지만(완전성) 그 길이 최단이라는 보장은 없다. 같은 미로를 BFS 페이지와 번갈아 돌려 경로 길이를 비교해 보면 두 탐색의 본질적 차이가 드러난다.',
    preset: { size: 24, maze: 'random' },
    presetLabel: 'BFS와 비교할 미로 생성',
  },
]
