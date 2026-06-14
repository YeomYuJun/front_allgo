import apiClient from './api'

/**
 * @param {{grid:boolean[][], steps:number}} payload
 * @returns {Promise<{steps:boolean[][][], series:number[]}>}
 */
export function simulate(payload) {
  return apiClient.post('/algorithms/automata/life/simulate', payload).then((r) => r.data)
}
