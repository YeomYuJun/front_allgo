// Monte Carlo 응용 카드. preset은 MonteCarlo.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: '여론조사는 몬테카를로다',
    body: '전 국민에게 묻지 않아도 무작위 표본 1,000명이면 오차 ±3%로 전체를 추정한다. 무작위 점을 뿌려 넓이를 세는 이 화면과 정확히 같은 원리 — 표본이 모집단을 대변한다.',
    preset: { functionType: 'ellipse', iterations: 3000 },
    presetLabel: '표본 3000으로 정밀 추정',
  },
  {
    angle: 'dev',
    title: '레이트레이싱과 금융 리스크',
    body: '영화 렌더링은 픽셀마다 광선을 무작위로 쏘아 평균하고, 은행은 시장 시나리오를 수만 번 굴려 VaR를 계산한다. 적분이 불가능할 만큼 복잡한 영역일수록 몬테카를로가 유일한 실전 해법이 된다.',
    preset: { functionType: 'sin_product', iterations: 1500 },
    presetLabel: '복잡한 영역 적분해 보기',
  },
  {
    angle: 'math',
    title: '오차는 1/√n으로만 준다',
    body: '표본을 100배 늘려야 정밀도가 한 자리 좋아진다 — 차원과 무관하다는 것이 축복이자(고차원 적분 가능) 저주다(수렴이 느림). 표본 100개의 요동을 직접 보라.',
    preset: { functionType: 'square', iterations: 100 },
    presetLabel: '표본 100의 오차 관찰',
  },
]
