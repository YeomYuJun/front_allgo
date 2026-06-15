import apiClient from './api'

/**
 * @param {{controlPoints:number[][], samples:number}} payload
 * @returns {Promise<{curve:number[][], degree:number}>}
 */
export function compute(payload) {
  return apiClient.post('/algorithms/bezier/compute', payload).then((r) => r.data)
}
