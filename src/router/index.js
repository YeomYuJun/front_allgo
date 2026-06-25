// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Landing from '../components/Landing.vue';
import Fractal from '../components/Fractal.vue';
import MonteCarlo from '../components/MonteCarlo.vue';
import Bezier from '../components/Bezier.vue';
import CellularAutomata from '../components/CellularAutomata.vue';
import DoublePendulum from '../components/DoublePendulum.vue';
import Lissajous from '../components/Lissajous.vue';
import Flow from '../components/Flow.vue';
import Voronoi from '../components/Voronoi.vue';
import Fourier from '../components/Fourier.vue';
import Plotter from '../components/Plotter.vue';
import BreadthFirstSearch from '../components/BreadthFirstSearch.vue';
import DynamicProgramming from '../components/DynamicProgramming.vue';
import DepthFirstSearch from '../components/DepthFirstSearch.vue';
import Greedy from '../components/Greedy.vue';
import FourierTransform from '../components/FourierTransform.vue';

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
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
    path: '/cellular-automata',
    name: 'CellularAutomata',
    component: CellularAutomata,
  },
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
  {
    path: '/breadth-first-search',
    name: 'BreadthFirstSearch',
    component: BreadthFirstSearch,
  },
  {
    path: '/dynamic-programming',
    name: 'DynamicProgramming',
    component: DynamicProgramming,
  },
  {
    path: '/depth-first-search',
    name: 'DepthFirstSearch',
    component: DepthFirstSearch,
  },
  {
    path: '/greedy',
    name: 'Greedy',
    component: Greedy,
  },
  {
    path: '/fourier-transform',
    name: 'FourierTransform',
    component: FourierTransform,
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
