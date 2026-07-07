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
    // 페이지별 silent-catch에 묻히지 않도록 전역 토스트(MainLayout)에 알린다
    if (typeof window !== 'undefined') {
      const status = error?.response?.status
      const path = error?.config?.url || ''
      window.dispatchEvent(new CustomEvent('agm:api-error', {
        detail: { message: status ? `${status} · ${path}` : `backend unreachable · ${path}` },
      }))
    }
    return Promise.reject(error)
  }
)

export default apiClient
export function testConnection() {
  return apiClient.get('/test')
}
