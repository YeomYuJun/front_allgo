// BFS 응용 카드. preset은 BreadthFirstSearch.vue의 applyPreset이 해석한다 (적용 후 자동 Run).
export default [
  {
    angle: 'life',
    title: '지하철 최소 환승 · 6단계 분리',
    body: '"몇 정거장이면 도착하나", "그 사람과 나는 몇 다리 건너 아는 사이인가"는 전부 무가중 최단경로 — BFS 한 방이다. 넓은 미로에서 파동이 목적지에 닿는 순간이 곧 정답이다.',
    preset: { size: 40, maze: 'random' },
    presetLabel: '넓은 미로 최단경로',
  },
  {
    angle: 'dev',
    title: '소셜 그래프의 friend-of-friend',
    body: '친구 추천, 웹 크롤러의 링크 깊이 제한, 네트워크 브로드캐스트 홉 수 — 실무의 BFS는 격자가 아니라 그래프 위에서 돈다. 8방향(대각선)을 켜면 이웃 정의가 결과를 바꾸는 것이 보인다.',
    preset: { size: 24, diag: true, maze: 'random' },
    presetLabel: '8방향 탐색 비교',
  },
  {
    angle: 'math',
    title: 'frontier의 단조성이 최단을 보장한다',
    body: 'BFS는 거리 k의 셀을 전부 끝낸 뒤에야 k+1로 넘어간다. 이 단조성 때문에 목적지에 처음 닿는 경로가 곧 최단임이 증명된다 — 거리 숫자를 켜고 동심원 레이어를 확인해 보라.',
    preset: { size: 24, numbers: true, maze: 'random' },
    presetLabel: '거리 레이어 보기',
  },
]
