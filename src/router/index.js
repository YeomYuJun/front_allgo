// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Landing from '../components/Landing.vue';

// 랜딩만 즉시 로드, 나머지는 라우트별 지연 로드(초기 번들 축소)
const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
  },
  {
    path: '/fractal',
    name: 'Fractal',
    component: () => import('../components/Fractal.vue'),
  },
  {
    path: '/monte-carlo',
    name: 'MonteCarlo',
    component: () => import('../components/MonteCarlo.vue'),
  },
  {
    path: '/bezier',
    name: 'Bezier',
    component: () => import('../components/Bezier.vue'),
  },
  {
    path: '/cellular-automata',
    name: 'CellularAutomata',
    component: () => import('../components/CellularAutomata.vue'),
  },
  {
    path: '/double-pendulum',
    name: 'DoublePendulum',
    component: () => import('../components/DoublePendulum.vue'),
  },
  {
    path: '/lissajous',
    name: 'Lissajous',
    component: () => import('../components/Lissajous.vue'),
  },
  {
    path: '/flow',
    name: 'Flow',
    component: () => import('../components/Flow.vue'),
  },
  {
    path: '/voronoi',
    name: 'Voronoi',
    component: () => import('../components/Voronoi.vue'),
  },
  {
    path: '/fourier',
    name: 'Fourier',
    component: () => import('../components/Fourier.vue'),
  },
  {
    path: '/plotter',
    name: 'Plotter',
    component: () => import('../components/Plotter.vue'),
  },
  {
    path: '/breadth-first-search',
    name: 'BreadthFirstSearch',
    component: () => import('../components/BreadthFirstSearch.vue'),
  },
  {
    path: '/dynamic-programming',
    name: 'DynamicProgramming',
    component: () => import('../components/DynamicProgramming.vue'),
  },
  {
    path: '/depth-first-search',
    name: 'DepthFirstSearch',
    component: () => import('../components/DepthFirstSearch.vue'),
  },
  {
    path: '/greedy',
    name: 'Greedy',
    component: () => import('../components/Greedy.vue'),
  },
  {
    path: '/fourier-transform',
    name: 'FourierTransform',
    component: () => import('../components/FourierTransform.vue'),
  },
  {
    path: '/sorting',
    name: 'Sorting',
    component: () => import('../components/Sorting.vue'),
  },
  // Catch-all route for undefined paths - must be at the end
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
