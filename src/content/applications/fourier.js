// Fourier(에피사이클) 응용 카드. preset은 Fourier.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: '노이즈 캔슬링과 이퀄라이저',
    body: '소리는 사인파의 합이다. 헤드폰의 노이즈 캔슬링은 소음의 성분을 분해해 반대 위상을 더하고, 이퀄라이저는 특정 성분의 크기만 키우거나 줄인다 — 전부 푸리에 분해 위에서 벌어지는 일이다.',
    preset: { wave: 'square', N: 8 },
    presetLabel: '사각파 8항 분해',
  },
  {
    angle: 'dev',
    title: '압축은 버리는 기술',
    body: 'JPEG와 MP3의 핵심은 신호를 주파수 성분으로 바꾼 뒤 사람이 못 느끼는 고차 성분을 버리는 것이다. 항 3개만 남겨도 원형이 얼추 보인다는 사실이 손실 압축이 성립하는 이유다.',
    preset: { wave: 'saw', N: 3 },
    presetLabel: '톱니파 3항 근사',
  },
  {
    angle: 'math',
    title: '기브스 현상 — 사라지지 않는 overshoot',
    body: '불연속점 근처의 물결침은 N을 아무리 키워도 약 9%로 수렴할 뿐 사라지지 않는다. 점별 수렴과 균등 수렴이 다르다는 것을 눈으로 보여주는 고전적 반례다.',
    preset: { wave: 'square', N: 40 },
    presetLabel: 'N=40에서 overshoot 확인',
  },
]
