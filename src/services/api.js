import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error?.response?.status, error?.message)
    return Promise.reject(error)
  }
)

export default apiClient
export function testConnection() {
  return apiClient.get('/test')
}
