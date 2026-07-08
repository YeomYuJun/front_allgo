// Lissajous 응용 카드. preset은 Lissajous.vue의 applyPreset이 해석한다 (deltaDeg는 도 단위).
export default [
  {
    angle: 'life',
    title: '음정은 주파수비다',
    body: '완전5도(도-솔)는 3:2, 완전4도는 4:3 — 귀가 "어울린다"고 느끼는 화음은 간단한 정수비다. Sound를 켜고 3:2 도형을 보면서 들으면, 리사주 곡선의 잎 개수와 음정이 같은 수학임을 알 수 있다.',
    preset: { a: 3, b: 2, deltaDeg: 90, sound: true },
    presetLabel: '완전5도(3:2) 듣기',
  },
  {
    angle: 'dev',
    title: '오실로스코프 XY 모드 — 위상차 측정',
    body: '같은 주파수의 두 신호를 X·Y에 넣으면 위상차 0°는 대각선, 90°는 원, 그 사이는 타원이 된다. 아날로그 시절 엔지니어가 회로의 위상 지연을 눈으로 읽던 방법이고, 지금도 오디오 위상 미터가 같은 원리다.',
    preset: { a: 1, b: 1, deltaDeg: 90, phaseAnim: true },
    presetLabel: '1:1 위상 스윕 보기',
  },
  {
    angle: 'math',
    title: '유리비는 닫히고, 무리비는 채운다',
    body: 'a:b가 유리수면 곡선은 언젠가 자신을 다시 밟는 닫힌 궤도가 된다. 비가 복잡할수록 닫히기까지 오래 걸려 사각형을 빽빽이 채워 간다 — 9:7을 지켜보면 준주기 운동이 무엇인지 감이 온다.',
    preset: { a: 9, b: 7, deltaDeg: 30 },
    presetLabel: '9:7 조밀 궤도 보기',
  },
]
