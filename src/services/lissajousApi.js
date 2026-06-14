import apiClient from './api'

/**
 * @param {{a:number,b:number,delta:number,phase:number,steps:number}} payload
 * @returns {Promise<{steps:Array<{x:number,y:number}>, series:number[]}>}
 */
export function simulate(payload) {
  return apiClient.post('/algorithms/lissajous/simulate', payload).then((r) => r.data)
}
