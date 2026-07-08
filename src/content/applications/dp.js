// DP 응용 카드. preset은 DynamicProgramming.vue의 applyPreset이 해석한다 (적용 후 자동 Run).
export default [
  {
    angle: 'life',
    title: '내비게이션의 구간 합성',
    body: '서울에서 부산까지의 최적 경로는 "대전까지의 최적 + 대전에서 부산까지의 최적"으로 쪼개진다. 부분의 최적이 전체의 최적을 만든다는 이 성질이 DP가 성립하는 조건 그 자체다.',
    preset: { size: 8, mode: 'max' },
    presetLabel: '8x8 최대 수확 경로',
  },
  {
    angle: 'dev',
    title: 'diff와 편집 거리',
    body: 'git diff, 맞춤법 교정, DNA 서열 정렬은 전부 편집 거리 DP다. 이 격자와 똑같이 2차원 테이블을 채우고 역추적해 "무엇을 바꿨는가"를 복원한다. 최소 모드가 그 감각에 더 가깝다.',
    preset: { size: 10, mode: 'min' },
    presetLabel: '10x10 최소 비용 경로',
  },
  {
    angle: 'math',
    title: '메모이제이션 — 지수를 다항으로',
    body: '순진한 재귀는 같은 부분문제를 지수적으로 다시 푼다. 테이블에 답을 적어두는 것만으로 O(2^n)이 O(n²)이 된다 — 채워지는 셀 하나하나가 "다시는 안 풀 문제"다.',
    preset: { size: 6, mode: 'max' },
    presetLabel: '셀 단위로 관찰(6x6)',
  },
]
