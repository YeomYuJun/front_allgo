// Greedy 응용 카드. preset은 Greedy.vue의 applyPreset이 해석한다 (적용 후 자동 Run).
export default [
  {
    angle: 'life',
    title: '회의실 예약의 정석',
    body: '하루에 회의를 최대한 많이 잡고 싶다면 "일찍 시작하는 것"이 아니라 "일찍 끝나는 것"부터 수락하라. 끝이 빠를수록 뒤에 남는 시간이 길다 — 직관과 증명이 일치하는 드문 경우다.',
    preset: { count: 12, strategy: 'finish' },
    presetLabel: 'earliest-finish 최적 보기',
  },
  {
    angle: 'dev',
    title: '허프만 코딩과 스케줄러',
    body: 'zip의 허프만 트리, OS의 SJF 스케줄링, 다익스트라 — 실무의 그리디는 많다. 단 성립 조건을 어기면 조용히 틀린다. shortest 전략이 그럴듯해 보이면서 최적을 놓치는 것을 보라.',
    preset: { count: 16, strategy: 'shortest' },
    presetLabel: 'shortest 전략의 함정',
  },
  {
    angle: 'math',
    title: '교환 논증 — 그리디가 옳다는 증명법',
    body: '"최적해의 첫 선택을 그리디의 첫 선택으로 바꿔도 손해가 없다"를 보이면 귀납적으로 전체가 증명된다. start 전략은 이 논증이 깨지는 반례를 즉시 만들어 준다.',
    preset: { count: 12, strategy: 'start' },
    presetLabel: 'start 전략 실패 관찰',
  },
]
