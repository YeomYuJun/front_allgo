// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue'; // Home 컴포넌트 경로
// GraDesc.vue 또는 SurfaceVisualizer.vue 등 시각화 컴포넌트 임포트
import GraDesc from '../components/GraDesc.vue'; // GraDesc.vue 경로 (이전에 만든 SurfaceVisualizer.vue를 사용한다면 해당 경로로)
import ConvexFunction from '../components/ConvexFunction.vue';
import FFT from '../components/FFT.vue';
import Fractal from '../components/Fractal.vue';
import SaddleFunction from '../components/SaddleFunction.vue';
import MonteCarlo from '../components/MonteCarlo.vue';
import Bezier from '../components/Bezier.vue';
import BFSVisualization from '../components/BFS.vue';
import CellularAutomata from '../components/CellularAutomata.vue';
import DoublePendulum from '../components/DoublePendulum.vue';
import Lissajous from '../components/Lissajous.vue';
import Flow from '../components/Flow.vue';
import Voronoi from '../components/Voronoi.vue';
import Fourier from '../components/Fourier.vue';
import Plotter from '../components/Plotter.vue';

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
    component: MonteCarlo,
  },
  {
    path: '/bezier',
    name: 'Bezier',
    component: Bezier,
  },
  {
    path: '/bfs',
    name: 'BFS',
    component: BFSVisualization,
  },
  {
    path: '/cellular-automata',
    name: 'CellularAutomata',
    component: CellularAutomata,
  },
  // {
  //   path: '/quick-sort',
  //   name: 'QuickSort',
  //   component: QuickSort,
  // },
  
  {
    path: '/double-pendulum',
    name: 'DoublePendulum',
    component: DoublePendulum,
  },
  {
    path: '/lissajous',
    name: 'Lissajous',
    component: Lissajous,
  },
  {
    path: '/flow',
    name: 'Flow',
    component: Flow,
  },
  {
    path: '/voronoi',
    name: 'Voronoi',
    component: Voronoi,
  },
  {
    path: '/fourier',
    name: 'Fourier',
    component: Fourier,
  },
  {
    path: '/plotter',
    name: 'Plotter',
    component: Plotter,
  },
  // Catch-all route for undefined paths - must be at the end
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // HTML5 히스토리 모드 사용
  routes, // `routes: routes`와 동일
});

export default router;