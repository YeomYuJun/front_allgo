import apiClient from './api'

/**
 * @param {{grid: number[][], mode: 'max'|'min'}} payload
 * @returns {Promise<{dp: number[][], from: (string|null)[][], fillOrder: number[][], path: number[][], best: number}>}
 */
export function solve(payload) {
  return apiClient.post('/algorithms/dp/solve', payload).then((r) => r.data)
}
