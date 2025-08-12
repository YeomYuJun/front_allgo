import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // API 요청을 Spring Boot로 프록시
      '/api': {
        target: 'http://15.164.49.226:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})