import apiClient from './api'

/**
 * @param {{particles:number[][], scale:number, time:number, steps:number}} payload
 * @returns {Promise<{steps:number[][][], series:number[]}>}
 */
export function simulate(payload) {
  return apiClient.post('/algorithms/flow/simulate', payload).then((r) => r.data)
}
