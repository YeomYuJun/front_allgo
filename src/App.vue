<template>
  <MainLayout>
    <router-view /> 
  </MainLayout>
</template>

<script setup>
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
  color: #333;
}
</style>