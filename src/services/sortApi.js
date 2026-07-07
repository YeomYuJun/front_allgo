import apiClient from './api'

export const run = (payload) => apiClient.post('/algorithms/sort/run', payload).then((r) => r.data)
