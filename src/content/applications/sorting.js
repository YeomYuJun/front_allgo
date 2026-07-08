// Sorting 응용 카드. preset은 Sorting.vue의 applyPreset이 해석한다 (적용 후 자동 Run).
export default [
  {
    angle: 'life',
    title: '책장 정리에도 전략이 있다',
    body: '책을 한 권씩 옆과 비교해 미는 것(버블)과, 반씩 나눠 정리한 뒤 합치는 것(병합)은 수고가 다르다. 카운터의 비교·이동 횟수가 그 수고를 정직하게 센다.',
    preset: { algorithm: 'bubble', preset: 'random', size: 24 },
    presetLabel: '버블로 24권 정리',
  },
  {
    angle: 'dev',
    title: '실전 정렬은 하이브리드다',
    body: '파이썬·자바의 Timsort는 "실데이터는 대체로 거의 정렬돼 있다"는 관찰에서 출발했다. nearly sorted 입력에서 병합 정렬이 얼마나 적은 이동으로 끝나는지 보라 — 입력 분포가 알고리즘 선택을 정한다.',
    preset: { algorithm: 'merge', preset: 'nearly', size: 64 },
    presetLabel: 'nearly sorted + merge',
  },
  {
    angle: 'math',
    title: '비교 정렬의 하한 Ω(n log n)',
    body: 'n개의 순열은 n!가지이고 비교 1회는 경우를 절반으로만 줄인다 — 그래서 어떤 비교 정렬도 log(n!) ≈ n log n번 아래로는 못 내려간다. 역순 입력의 버블 정렬은 그 반대편 극단 O(n²)을 보여준다.',
    preset: { algorithm: 'bubble', preset: 'reversed', size: 48 },
    presetLabel: '역순 최악 사례 보기',
  },
]
