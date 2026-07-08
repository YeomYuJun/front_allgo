// Perlin Flow 응용 카드. preset은 Flow.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: '바람 지도 · 해류 시각화',
    body: 'windy.com 같은 기상 지도는 바람 벡터장 위에 수천 개 입자를 흘려 보내 흐름을 보여준다. 이 페이지와 똑같은 기법이다 — 입자가 많고 노이즈가 완만할수록 실제 기류처럼 보인다. 드래그로 직접 돌풍을 만들어 보라.',
    preset: { scale: 0.8, count: 1200 },
    presetLabel: '기류 모드(입자 1200)',
  },
  {
    angle: 'dev',
    title: '게임 VFX — 연기·마법·군중',
    body: '물리 시뮬레이션 없이 노이즈 장만으로 연기·불꽃·군중의 "그럴듯한" 움직임을 만드는 것이 게임 VFX의 단골 트릭이다. 프레임당 비용이 입자 수에 선형이라 모바일에서도 돌아간다.',
    preset: { scale: 2.6, count: 700 },
    presetLabel: '난류 이펙트 모드',
  },
  {
    angle: 'math',
    title: 'Perlin 노이즈는 매끄러운 무작위다',
    body: '백색소음과 달리 그래디언트 노이즈는 미분 가능해서, 가까운 두 점의 방향이 급변하지 않는다. scale을 키우면 고주파 성분이 늘어 장이 잘게 요동친다 — 주파수와 매끄러움의 관계를 직접 조절해 보라.',
    preset: { scale: 4, count: 500 },
    presetLabel: '고주파 장 보기',
  },
]
