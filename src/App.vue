// src/App.vue
<template>
  <MainLayout>
    <router-view /> </MainLayout>
</template>

<script setup>
// ApiTest, GraDesc, Home 임포트는 여기서 더 이상 필요 없을 수 있습니다.
// (각 라우트에서 직접 컴포넌트를 로드하므로)
// 하지만 MainLayout은 여전히 필요합니다.
import MainLayout from './layout/MainLayout.vue';
</script>

<style>
html {
  overflow-y: auto !important;
}

header {
  margin-bottom: 30px;
  text-align: center;
}

h1 {
  /* App.vue의 h1 스타일이 전역적으로 영향을 줄 수 있으니,
     필요하다면 각 컴포넌트 내부로 옮기거나 범위를 지정하는 것이 좋습니다. */
  color: #333;
}
</style>