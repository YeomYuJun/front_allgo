import apiClient from './api'

/**
 * @param {{state:{a,b}, gravity:number, armRatio:number, damping:number, steps:number}} payload
 * @returns {Promise<{steps:Array, series:number[]}>}
 */
export function simulate(payload) {
  return apiClient.post('/algorithms/pendulum/simulate', payload).then((r) => r.data)
}
