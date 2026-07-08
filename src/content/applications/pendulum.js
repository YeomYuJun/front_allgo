// Double Pendulum 응용 카드. preset은 DoublePendulum.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: '일기예보가 2주를 못 넘는 이유',
    body: '대기는 거대한 카오스계다. 관측 오차가 아무리 작아도 지수적으로 증폭되어 열흘 뒤에는 전혀 다른 날씨가 된다 — 나비효과라는 이름의 수학적 사실이다.',
    preset: { theta1Deg: 120, theta2Deg: -10, gravity: 1.0, damping: 0, trail: true },
    presetLabel: '고에너지 카오스 보기',
  },
  {
    angle: 'dev',
    title: '물리엔진의 적분기 선택',
    body: '게임 물리가 가끔 "터지는" 것은 강성이 큰 계를 큰 타임스텝으로 적분했기 때문이다. 중력을 최대로 올려 빠른 진동을 만들면 수치 적분이 어떤 조건에서 힘들어지는지 감이 온다.',
    preset: { gravity: 2.6, armRatio: 0.5, theta1Deg: 150, theta2Deg: 0 },
    presetLabel: '고강성 빠른 진동',
  },
  {
    angle: 'math',
    title: '초기조건 민감성 — 리아푸노프 지수',
    body: '0.01° 차이로 시작한 쌍둥이 진자는 처음엔 겹쳐 보이지만 어느 순간 완전히 갈라선다. 갈라지는 속도(리아푸노프 지수)가 양수라는 것이 카오스의 정의다.',
    preset: { theta1Deg: 179, theta2Deg: 0, twin: true, trail: true, damping: 0 },
    presetLabel: '179° 쌍둥이 진자',
  },
]
