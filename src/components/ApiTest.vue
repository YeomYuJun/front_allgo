<template>
  <div class="api-test">
    <h2>Spring Boot API 연동 테스트</h2>
    <button @click="testApi" :disabled="loading">
      {{ loading ? '로딩 중...' : 'API 테스트' }}
    </button>
    
    <div v-if="response" class="response-container">
      <h3>응답 결과:</h3>
      <pre>{{ JSON.stringify(response, null, 2) }}</pre>
    </div>
    
    <div v-if="error" class="error-container">
      <h3>오류 발생:</h3>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../services/api';

const loading = ref(false);
const response = ref(null);
const error = ref(null);

async function testApi() {
  loading.value = true;
  response.value = null;
  error.value = null;
  
  try {
    const result = await api.testConnection();
    response.value = result.data;
  } catch (err) {
    error.value = err.message || '알 수 없는 오류가 발생했습니다.';
    console.error('API 테스트 오류:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.api-test {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin: 10px 0;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.response-container, .error-container {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}

.response-container {
  background-color: #e7f7e7;
  border: 1px solid #c3e6cb;
}

.error-container {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
}
</style>