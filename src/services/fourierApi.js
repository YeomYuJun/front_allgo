import apiClient from './api'

/**
 * @param {{wave:string, N:number}} payload
 * @returns {Promise<{harmonics:Array<{n:number,a:number}>}>}
 */
export function series(payload) {
  return apiClient.post('/algorithms/fourier/series', payload).then((r) => r.data)
}
