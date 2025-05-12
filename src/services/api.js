import axios from 'axios';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: '/api', // Vite의 프록시 설정을 사용
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  config => {
    // 토큰이 있는 경우 추가 (나중에 인증 기능 구현 시)
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API 오류:', error);
    return Promise.reject(error);
  }
);

export default {
  // API 함수들
  testConnection() {
    return apiClient.get('/test');
  },
  
  // 여기에 필요한 API 함수 추가
}