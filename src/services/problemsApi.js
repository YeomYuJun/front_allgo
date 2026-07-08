import apiClient from './api'

/**
 * 문제 플러그인 공통 solve. 표준 trace envelope를 반환한다.
 * @param {{problemId:string, params:object, input:object}} payload
 * @returns {Promise<{meta:object, frames:{op:string,args:object,note?:string}[]}>}
 */
export function solve(payload) {
  return apiClient.post('/algorithms/problems/solve', payload).then((r) => r.data)
}
