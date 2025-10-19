**AllgoMath Frontend**

**Site** : [https://allgomath.com](https://allgomath.com/)

Vue 3와 Three.js로 구현된 수학 알고리즘 시각화 클라이언트. 3D 수학 함수, 프랙탈, FFT, 경사하강법 등을 실시간으로 시각화하고 상호작용 가능.

**Tech Stack**: Vue 3 + Vite + Three.js + Vuetify | **Backend**: [AllgoMath API](https://github.com/YeomYuJun/allgomath)

> 직관적인 인터페이스로 복잡한 수학 개념을 쉽게 탐험할 수 있는 웹 애플리케이션을 목표로 개발 진행 중
> 

---

## 🎨 주요 기능

### 구현 기능

- **Convex Function**: 볼록 함수 표면 렌더링 및 최소값 탐색(+**Gradient Descent)**
- **FFT**: 주파수 분석 및 Winding Visualization
- **Fractal**: Mandelbrot/Julia Set 동적 생성 및 줌
- **Monte Carlo**: 무작위 샘플링 기반 수치 적분 시각화
- **Bezier Curves**: 베지어 곡선 생성 및 제어점 조작
- ~~Sorting Algorithms~~(개발 예정)
- ~~Laplace Transform~~(개발 예정)

---

## 🏗️ 프로젝트 구조

```
src/
├── components/          # Vue 컴포넌트
│   ├── Home.vue         # 메인 페이지
│   ├── ConvexFunction.vue
│   ├── GraDesc.vue
│   ├── FFT.vue
│   ├── Fractal.vue
│   ├── MonteCarloVisualization.vue
│   └── BezierVisualization.vue
├── three/               # Three.js 유틸리티
│   ├── SceneManager.js  # 3D 씬 관리
│   ├── MathVisualization.js
│   └── GradientDescent.js
├── services/
│   └── api.js           # Axios API 클라이언트
├── router/
│   └── index.js         # Vue Router 설정
└── main.js              # 애플리케이션 진입점

```

### 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 5173)
npm run dev

# 프로덕션 빌드
npm run build

```

## 🔧 기술 스택

### Core

- **Vue 3** (v3.5.13): Composition API 기반 반응형 UI
- **Vite** (v6.2.0): 빠른 개발 서버 및 빌드 도구
- **Vue Router** (v4.0.13): SPA 라우팅

### Visualization

- **Three.js** (v0.174.0): WebGL 기반 3D 렌더링
- **Vuetify** (v3.8.0-beta.0): Material Design UI 컴포넌트

### HTTP Client

- **Axios** (v1.8.3): REST API 통신 및 인터셉터

### Three.js 씬 관리

`SceneManager.js`를 통한 3D 씬 초기화 및 렌더링:

- Camera, Renderer, Controls 설정
- 애니메이션 루프 관리
- 반응형 캔버스 리사이징

---

## 🔗 관련 링크

- **Backend Repository**: https://github.com/YeomYuJun/allgomath
- **Live Demo**: [https://allgomath.com](https://allgomath.com/)
