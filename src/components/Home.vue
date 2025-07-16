<template>
  <Navbar />
  
  <Visitas />
  
</template>

<script setup>
import { useRouter } from 'vue-router'
import Navbar from './Navbar.vue'
import Visitas from './Visitas.vue';
const router = useRouter()


</script>

<style scoped>
.navbar {
  background: #2c3e50;
  color: #fff;
  padding: 10px;
}
</style>
