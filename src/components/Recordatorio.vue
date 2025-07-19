<template>
  <Navbar />  
  <div class="recordatorios">
    <h2>Recordatorios de Visitas</h2>
    <ul v-if="recordatorios.length">
      <li v-for="visita in recordatorios" :key="visita.id" class="tarjeta">
        <h2 class="recordar">Recordar en {{ diasRestantes(visita.proxima_visita) }} día(s)</h2>
        <h3>Veterinario: {{ visita.veterinario.nombre }}</h3><br />
    
        Ganadero: {{ visita.ganadero }}<br />
        Tipo de ganado: {{ visita.ganado_tipo }}<br />
        Comunidad: {{ visita.comunidad }}<br />
        Fecha: {{ visita.proxima_visita }}<br />
        
      </li>
    </ul>
    <p v-else>No hay visitas próximas para recordar.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import Navbar from './Navbar.vue'

const recordatorios = ref([])



// function diasRestantes(fecha) {
//   const hoy = new Date()
//   const visita = new Date(fecha)
//   const diff = Math.ceil((visita - hoy) / (1000 * 60 * 60 * 24))
//   return diff
// }
function diasRestantes(fecha) {
  const hoy = new Date()
  const visita = new Date(fecha)
  // Ignorar horas, minutos y segundos
  hoy.setHours(0, 0, 0, 0)
  visita.setHours(0, 0, 0, 0)
  const diff = Math.round((visita - hoy) / (1000 * 60 * 60 * 24))
  return diff
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('visitas')
  .select(`
    id,
    proxima_visita,
    ganadero,
    ganado_tipo,
    comunidad,
    veterinario:veterinario_id(nombre)
  `)
  .order('proxima_visita', { ascending: true })

  if (!error) {
    const hoy = new Date()
    recordatorios.value = data.filter(v => {
      const visita = new Date(v.proxima_visita)
      const diff = Math.ceil((visita - hoy) / (1000 * 60 * 60 * 24))
      return diff === 1 || diff === 2 || diff === 3 || diff === 4 || diff === 5 || diff === 6
    })
  }
})
</script>

<style scoped>
.recordatorios {
  padding: 16px;
  border-radius: 8px;
  margin: 1rem auto;
  max-width: 500px;
}

h2 {
  font-size: 20px;
  margin-bottom: 10px;
  text-align: center;
}

.tarjeta {
  background: #f5f5f5;
  padding: 12px;
  margin-bottom: 12px;
  list-style: none;
  border-radius: 6px;
}
.recordar{
  color: red;
}

@media (max-width: 600px) {
  .recordatorios {
    padding: 10px;
    max-width: 100%;
    font-size: 14px;
  }

  .tarjeta {
    padding: 10px;
  }
}
</style>











