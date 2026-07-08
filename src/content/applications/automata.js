// Cellular Automata 응용 카드. preset은 CellularAutomata.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: '산불·전염병 확산 모델',
    body: '이웃이 타면 나도 탄다 — 산불, 전염병, 소문의 확산은 전부 "이웃 상태가 내 다음 상태를 정한다"는 국소 규칙의 전역 결과다. Seeds 규칙(B2/S∅)은 폭발적 전파가 어떤 모습인지 보여준다.',
    preset: { rule: 'seeds', pattern: 'random' },
    presetLabel: 'Seeds 폭발적 확산',
  },
  {
    angle: 'dev',
    title: '절차적 맵 생성',
    body: '로그라이크 게임의 동굴 맵은 무작위 노이즈에 CA 스무딩을 몇 세대 돌려 만든다. 규칙 비트 몇 개(B/S)를 바꾸는 것만으로 전혀 다른 질감이 나오는 것을 Day&Night 규칙에서 확인해 보라.',
    preset: { rule: 'daynight', pattern: 'random' },
    presetLabel: 'Day&Night 질감 보기',
  },
  {
    angle: 'math',
    title: '규칙 4줄로 튜링 완전',
    body: '생명 게임은 글라이더로 신호를 보내고 충돌로 논리 게이트를 만들 수 있어 계산 가능한 모든 것을 계산한다. 단순한 국소 규칙에서 보편 계산이 창발한다는 것이 이 격자의 진짜 충격이다.',
    preset: { rule: 'life', pattern: 'glider' },
    presetLabel: '글라이더 발사',
  },
]
