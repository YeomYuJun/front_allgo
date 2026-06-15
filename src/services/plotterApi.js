import apiClient from './api'

/**
 * @param {{fn:string,range:number,resolution:number}} payload
 * @returns {Promise<{z:number[][],zMin:number,zMax:number,critical:{x:number,y:number,z:number}}>}
 */
export function surface(payload) {
  return apiClient.post('/algorithms/plotter/surface', payload).then((r) => r.data)
}

/**
 * @param {{fn:string,startX:number,startY:number,learningRate:number,maxIterations:number}} payload
 * @returns {Promise<{path:Array<{step:number,x:number,y:number,z:number,gradientX:number,gradientY:number}>,converged:boolean,iterations:number}>}
 */
export function descend(payload) {
  return apiClient.post('/algorithms/plotter/gradient-descent', payload).then((r) => r.data)
}
