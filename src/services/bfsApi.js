import apiClient from './api'

/**
 * @param {{rows:number, cols:number, walls:boolean[], start:number, goal:number, diag:boolean}} payload
 * @returns {Promise<{order:number[], dist:number[], parent:number[], path:number[], found:boolean}>}
 */
export function search(payload) {
  return apiClient.post('/algorithms/bfs/search', payload).then((r) => r.data)
}
