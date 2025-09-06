// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue'; // Home 컴포넌트 경로
// GraDesc.vue 또는 SurfaceVisualizer.vue 등 시각화 컴포넌트 임포트
import GraDesc from '../components/GraDesc.vue'; // GraDesc.vue 경로 (이전에 만든 SurfaceVisualizer.vue를 사용한다면 해당 경로로)
import ConvexFunction from '../components/ConvexFunction.vue';
import FFT from '../components/FFT.vue';
import Fractal from '../components/Fractal.vue';
import SaddleFunction from '../components/SaddleFunction.vue';
import MonteCarloVisualization from '../components/MonteCarloVisualization.vue';
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
    path: '/gradient-descent',
    name: 'GradientDescent',
    component: GraDesc,
  },
  {
    path: '/convex-function',
    name: 'ConvexFunction',
    component: ConvexFunction,
  },
  {
    path: '/saddle-function',
    name: 'SaddleFunction',
    component: SaddleFunction,
  },
  {
    path: '/FFT',
    name: 'FFT',
    component: FFT,
  },
  {
    path: '/fractal',
    name: 'Fractal',
    component: Fractal,
  },
  {
    path: '/monte-carlo',
    name: 'MonteCarlo',
    component: MonteCarloVisualization,
  },
  // {
  //   path: '/quick-sort',
  //   name: 'QuickSort',
  //   component: QuickSort,
  // },
  
  
  
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // HTML5 히스토리 모드 사용
  routes, // `routes: routes`와 동일
});

export default router;