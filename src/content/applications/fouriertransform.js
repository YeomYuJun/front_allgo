// Fourier Transform(DFT) 응용 카드. preset은 FourierTransform.vue의 applyPreset이 해석한다.
export default [
  {
    angle: 'life',
    title: 'Shazam은 스펙트럼을 듣는다',
    body: '노래 검색은 파형이 아니라 스펙트로그램의 피크 지문을 비교한다. 시간 영역에서 뒤엉킨 두 성분이 주파수 영역에서는 깨끗한 스파이크 두 개로 갈라지는 것을 스캔해 보라.',
    preset: { reset: true, sweep: true },
    presetLabel: '3Hz+7Hz 스펙트럼 스캔',
  },
  {
    angle: 'dev',
    title: 'FFT — 신호처리의 워크호스',
    body: '나이브 DFT는 O(n²), FFT는 O(n log n). 이 차이가 실시간 오디오 필터·이미지 처리·5G 통신을 가능하게 했다. 성분이 멀리 떨어져 있을수록 스펙트럼 분리가 선명한 것을 확인해 보라.',
    preset: { reset: true, set: [{ i: 0, f: 2, a: 1 }, { i: 1, f: 11, a: 0.4 }], sweep: true },
    presetLabel: '2Hz+11Hz 분리 보기',
  },
  {
    angle: 'math',
    title: '감기와 질량중심 — 공명의 기하학',
    body: '신호를 f Hz로 원에 감으면 f가 실제 성분과 일치하는 순간에만 그래프가 한쪽으로 쏠려 질량중심이 튄다. 적분 ∫g(t)e^{-2πift}dt가 하는 일이 정확히 이 "쏠림 측정"이다.',
    preset: { reset: true, windF: 7 },
    presetLabel: '7Hz에 정렬(공명) 보기',
  },
]
