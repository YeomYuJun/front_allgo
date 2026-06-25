import apiClient from './api'

/**
 * @param {{tasks:{s:number,e:number}[], strategy:"finish"|"start"|"shortest"}} payload
 * @returns {Promise<{order:number[], decisions:{idx:number,accepted:boolean,lastEnd:number}[], selected:number, optimal:number}>}
 */
export function schedule(payload) {
  return apiClient.post('/algorithms/greedy/schedule', payload).then((r) => r.data)
}
