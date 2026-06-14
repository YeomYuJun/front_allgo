import apiClient from './api'

/**
 * @param {{iterations:number, bounds:{xMin,xMax,yMin,yMax}, functionType:string}} payload
 * @returns {Promise<object>} MonteCarloResult { totalCount, insideCount, estimate, actualValue, convergenceHistory, points }
 */
export function integrate(payload) {
  return apiClient.post('/monte-carlo/integrate', payload).then((r) => r.data)
}
