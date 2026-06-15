import apiClient from './api'

/**
 * @param {{sites:number[][], metric:string, grid:number}} payload
 * @returns {Promise<{owner:number[][], grid:number, edges:number[][]}>}
 */
export function compute(payload) {
  return apiClient.post('/algorithms/voronoi/compute', payload).then((r) => r.data)
}
