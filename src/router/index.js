// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue'; // Home 컴포넌트 경로
// GraDesc.vue 또는 SurfaceVisualizer.vue 등 시각화 컴포넌트 임포트
import GraDesc from '../components/GraDesc.vue'; // GraDesc.vue 경로 (이전에 만든 SurfaceVisualizer.vue를 사용한다면 해당 경로로)
import ConvexFunction from '../components/ConvexFunction.vue';
// 필요하다면 다른 컴포넌트들도 임포트
// import FourierTransformVisualizer from '../components/FourierTransformVisualizer.vue';
// import SortingVisualizer from '../components/SortingVisualizer.vue';

const routes = [
  {
    path: '/', // 기본 경로
    name: 'Home',
    component: Home,
  },
  {
    path: '/gradient-descent', // 3D 표면 시각화 페이지 경로 예시
    name: 'GradientDescent',
    component: GraDesc, // 여기에 3D 시각화 컴포넌트를 연결합니다.
                       // (예: 이전 단계에서 만든 SurfaceVisualizer.vue)
  },
  {
    path: '/convex-function',
    name: 'ConvexFunction',
    component: ConvexFunction,
  }
  // {
  //   path: '/fourier-transform',
  //   name: 'FourierTransform',
  //   component: FourierTransformVisualizer,
  // },
  // {
  //   path: '/sorting-algorithms',
  //   name: 'SortingAlgorithms',
  //   component: SortingVisualizer,
  // },
  // 추후 다른 알고리즘 시각화 페이지 라우트 추가
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // HTML5 히스토리 모드 사용
  routes, // `routes: routes`와 동일
});

export default router;