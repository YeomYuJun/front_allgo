import apiClient from './api'

/**
 * @param {{rows:number, cols:number, walls:boolean[], start:number, goal:number}} payload
 * @returns {Promise<{events:{type:"push"|"pop",cell:number}[], path:number[], found:boolean, deadEnds:number}>}
 */
export function search(payload) {
  return apiClient.post('/algorithms/dfs/search', payload).then((r) => r.data)
}
