// Bezier 응용 카드. preset은 Bezier.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: '지금 읽는 이 글자도 베지어다',
    body: '트루타입·오픈타입 폰트의 글리프 윤곽은 2차·3차 베지어 곡선의 이어붙임이다. 어떤 크기로 확대해도 매끈한 이유는 픽셀이 아니라 제어점 몇 개로 정의되어 있기 때문이다.',
    preset: { degree: 3, showPoly: true, animate: false, t: 0.5 },
    presetLabel: '3차 곡선(폰트 표준) 보기',
  },
  {
    angle: 'dev',
    title: 'CSS cubic-bezier — 가속감의 언어',
    body: 'ease-in, ease-out은 전부 cubic-bezier(x1,y1,x2,y2)다. 제어점 두 개가 시간-진행 곡선의 모양을, 즉 애니메이션의 "손맛"을 결정한다. t가 흐르는 모습을 재생하며 감을 잡아 보라.',
    preset: { degree: 3, animate: true, showCast: false },
    presetLabel: '이징처럼 재생하기',
  },
  {
    angle: 'math',
    title: '드 카스텔조 — 선형보간의 재귀',
    body: '복잡해 보이는 곡선도 원리는 "점 두 개 사이를 t:1-t로 나눈다"의 반복이다. 4차 곡선에서 보조선이 층층이 접히며 한 점으로 수렴하는 과정을 보면 재귀의 기하학이 보인다.',
    preset: { degree: 4, animate: true, showCast: true, showPoly: true },
    presetLabel: '4차 구성 과정 보기',
  },
]
