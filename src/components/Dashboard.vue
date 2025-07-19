<template>
  <Navbar />   
  <div class="dashboard">
    <h2>Estadísticas de Visitas</h2>
    
    <div class="charts">
      <p>Visitas por tipo</p>
      <canvas ref="tipoChart"></canvas>
      <p>Visitas por veterinario</p>
      <canvas ref="veterinarioChart"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Chart } from 'chart.js/auto'
import { supabase } from '../supabase'
import Navbar from './Navbar.vue'

const tipoChart = ref(null)
const veterinarioChart = ref(null)

const visitas = ref([])

onMounted(async () => {
  const { data, error } = await supabase
    .from('visitas')
    .select(`
      id,
      tipo_visita,
      fecha,
      usuarios (nombre)
    `)

  if (error) return console.error('Error:', error)
  visitas.value = data

  renderCharts()
})

function contarPorCampo(campo) {
  const conteo = {}
  visitas.value.forEach(v => {
    const key = campo === 'veterinario' ? v.usuarios?.nombre || 'Desconocido' : v[campo]
    conteo[key] = (conteo[key] || 0) + 1
  })
  return conteo
}

function renderCharts() {
  const porTipo = contarPorCampo('tipo_visita')
  const porVeterinario = contarPorCampo('veterinario')

  new Chart(tipoChart.value, {
    type: 'bar',
    data: {
      labels: Object.keys(porTipo),
      datasets: [{
        label: 'Visitas por tipo',
        data: Object.values(porTipo),
        backgroundColor: '#4bc0c0'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  })

  new Chart(veterinarioChart.value, {
    type: 'pie',
    data: {
      labels: Object.keys(porVeterinario),
      datasets: [{
        label: 'Visitas por veterinario',
        data: Object.values(porVeterinario),
        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
      }]
    },
    options: { responsive: true }
  })
}
</script>

<style scoped>
h2{
  text-align: center;
  margin-bottom: 20px;
}
.charts {
  background: white;
  padding: 20px;
  width: 100%;
  max-width: 1200px;
  border-radius: 10px;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: auto;
}

canvas {
  width: 100% !important;
  height: auto !important;
  margin-top: 20px;
  max-height: 400px;
}

@media (min-width: 768px) {
  .charts {
    flex-direction: row;
    justify-content: space-between;
    gap: 40px;
  }
  canvas {
    width: 48% !important;
    max-width: 48%;
  }
}
</style>
