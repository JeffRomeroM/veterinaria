<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { supabase } from '../supabase'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const visitas = ref([])
const cargando = ref(false)
const error = ref('')

const map = ref(null)
const marcador = ref(null)

const modalAbierto = ref(false)
const modoEdicion = ref(false)

const modalEliminarAbierto = ref(false)
const idEliminar = ref(null)

const formulario = reactive({
  id: null,
  ganadero: '',
  telefono: '',
  finca: '',
  comunidad: '',
  fecha: '',
  tipo_visita: '',
  ganado_tipo: '',
  cantidad_animales: null,
  estado_general: '',
  diagnostico: '',
  tratamiento: '',
  recomendaciones: '',
  proxima_visita: '',
  latitud: '',
  longitud: ''
})

const tiposVisita = [
  'Diagnóstico',
  'Seguimiento',
  'Vacunación',
  'Desparasitación',
  'Control sanitario',
  'Emergencias médicas',
  'Toma de muestras para análisis',
  'Cirugías o procedimientos menores',
  'Asesoría en manejo de ganado',
  'Reproducción y control de parto',
  'Asesoría en manejo animal',
  'Otra'
]

const tiposGanado = [
  'Bovino',
  'Caprino',
  'Porcino',
  'Ovinos',
  'Aves',
  'Otros'
]

const user = ref(null)
const userRol = ref('')

const filtroNombre = ref('')
const filtroFecha = ref('')
const filtroVeterinario = ref('')

const veterinarios = ref([])

const cargarUsuario = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  user.value = session.user

  const { data: usuarioData, error: usuarioError } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.value.id)
    .single()

  if (!usuarioError) userRol.value = usuarioData.rol
}

const cargarVeterinarios = async () => {
  const { data, error: err } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .eq('rol', 'veterinario')

  if (!err) veterinarios.value = data
}

const cargarVisitas = async () => {
  cargando.value = true
  error.value = ''
  if (!user.value) {
    error.value = 'No hay usuario logueado'
    cargando.value = false
    return
  }

  let query = supabase
    .from('visitas')
    .select('*, veterinario_id (nombre)')
    .order('fecha', { ascending: false })

  if (userRol.value !== 'admin') {
    query = query.eq('veterinario_id', user.value.id)
  }

  const { data, error: err } = await query

  if (err) error.value = err.message
  else visitas.value = data

  cargando.value = false
}

const visitasFiltradas = computed(() => {
  return visitas.value.filter(v => {
    const nombreMatch = v.ganadero.toLowerCase().includes(filtroNombre.value.toLowerCase())
    const fechaMatch = filtroFecha.value ? v.fecha === filtroFecha.value : true
    const vetMatch = filtroVeterinario.value ? v.veterinario_id?.id === filtroVeterinario.value : true
    return nombreMatch && fechaMatch && vetMatch
  })
})

const abrirModal = async (visita = null) => {
  if (visita) {
    modoEdicion.value = false
    Object.assign(formulario, visita)
  } else {
    modoEdicion.value = true
    Object.assign(formulario, {
      id: null,
      ganadero: '',
      telefono: '',
      finca: '',
      comunidad: '',
      fecha: '',
      tipo_visita: '',
      ganado_tipo: '',
      cantidad_animales: null,
      estado_general: '',
      diagnostico: '',
      tratamiento: '',
      recomendaciones: '',
      proxima_visita: '',
      latitud: '',
      longitud: ''
    })
  }
  
  modalAbierto.value = true
  await nextTick()
  
  setTimeout(() => {
    initMapa()
    if (map.value) {
      map.value.invalidateSize()
    }
  }, 300)
}

const cerrarModal = () => {
  modalAbierto.value = false
  modoEdicion.value = false
}

const activarEdicion = async () => {
  modoEdicion.value = true
  await nextTick()
  setTimeout(() => {
    initMapa()
    if (map.value) {
      map.value.invalidateSize()
    }
  }, 300)
}

const guardarVisita = async () => {
  if (!user.value) {
    error.value = 'No hay usuario logueado'
    return
  }

  const visitaData = { ...formulario }
  delete visitaData.id
  visitaData.veterinario_id = user.value.id

  if (!visitaData.proxima_visita) {
    delete visitaData.proxima_visita
  }

  let res
  if (formulario.id) {
    res = await supabase
      .from('visitas')
      .update(visitaData)
      .eq('id', formulario.id)
  } else {
    res = await supabase
      .from('visitas')
      .insert(visitaData)
  }

  if (res.error) {
    error.value = res.error.message
  } else {
    cerrarModal()
    await cargarVisitas()
  }
}

const abrirModalEliminar = (id) => {
  idEliminar.value = id
  modalEliminarAbierto.value = true
}

const cancelarEliminar = () => {
  idEliminar.value = null
  modalEliminarAbierto.value = false
}

const confirmarEliminar = async () => {
  if (!idEliminar.value) return
  const { error: err } = await supabase
    .from('visitas')
    .delete()
    .eq('id', idEliminar.value)

  if (err) {
    error.value = err.message
  } else {
    modalEliminarAbierto.value = false
    idEliminar.value = null
    await cargarVisitas()
  }
}

const formatDate = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString()
}

const obtenerInicial = (nombre) => {
  return nombre ? nombre.charAt(0).toUpperCase() : ''
}

function obtenerUbicacion() {
  if (!navigator.geolocation) {
    alert('Geolocalización no soportada por este navegador.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      formulario.latitud = lat
      formulario.longitud = lng

      if (map.value) {
        map.value.setView([lat, lng], 17)
        if (marcador.value) {
          marcador.value.setLatLng([lat, lng])
        } else {
          marcador.value = L.marker([lat, lng], { draggable: true }).addTo(map.value)
          marcador.value.on('dragend', () => {
            const pos = marcador.value.getLatLng()
            formulario.latitud = pos.lat
            formulario.longitud = pos.lng
          })
        }
      }
    },
    (error) => {
      alert('No se pudo obtener la ubicación: ' + error.message)
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  )
}

function initMapa() {
  if (map.value) {
    map.value.remove()
    map.value = null
    marcador.value = null
  }

  const latInit = formulario.latitud || 12.131
  const lngInit = formulario.longitud || -86.2504
  map.value = L.map('mapa').setView([latInit, lngInit], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)

  marcador.value = L.marker([latInit, lngInit], { draggable: true }).addTo(map.value)

  marcador.value.on('dragend', () => {
    const pos = marcador.value.getLatLng()
    formulario.latitud = pos.lat
    formulario.longitud = pos.lng
  })

  map.value.on('click', (e) => {
    const { lat, lng } = e.latlng
    formulario.latitud = lat
    formulario.longitud = lng
    marcador.value.setLatLng(e.latlng)
  })
}

function enviarWhatsApp(v) {
  if (!v.telefono) return alert('Número de celular no disponible')
  const mensaje = `📅 Fecha: ${v.fecha || 'N/A'}
👨‍🌾 Ganadero: ${v.ganadero || 'N/A'}
🐮 Tipo de ganado: ${v.ganado_tipo || 'N/A'}
🔢 Cantidad: ${v.cantidad_animales ?? 'Ninguno'}
📋 Estado: ${v.estado_general || 'Ninguno'}
✅ Diagnóstico: ${v.diagnostico || 'Ninguno'}
✅ Tratamiento: ${v.tratamiento || 'Ninguno'}
✅ Recomendaciones: ${v.recomendaciones || 'Ninguno'}
✅ Próxima visita: ${v.proxima_visita || 'Ninguno'}`

  const url = `https://wa.me/505${v.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
  window.open(url, '_blank')
} 

onMounted(async () => {
  await cargarUsuario()
  await cargarVeterinarios()
  await cargarVisitas()
})
</script>

<template>
  <div class="visitas-container">
    <h2>Visitas</h2>

    <div class="filtros-container">
      <input
        v-model="filtroNombre"
        type="text"
        placeholder="Buscar por ganadero"
        class="input-filtro"
      />
      <input v-model="filtroFecha" type="date" class="input-filtro" />
      <select v-model="filtroVeterinario" class="input-filtro">
        <option value="">Todos los veterinarios</option>
        <option v-for="v in veterinarios" :key="v.id" :value="v.id">{{ v.nombre }}</option>
      </select>
    </div>

    <button class="btn-nuevo" @click="abrirModal()">Nueva Visita</button>

    <p v-if="cargando">Cargando visitas...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="visitasFiltradas.length" class="cards-container">
      <div
        v-for="v in visitasFiltradas"
        :key="v.id"
        class="card"
        @click="abrirModal(v)"
        tabindex="0"
      >
        <div class="inicial">{{ obtenerInicial(v.ganadero) }}</div>
        <h3>{{ v.ganadero }}</h3>
        <p><strong>Comunidad:</strong> {{ v.comunidad }}</p>
        <p><strong>Fecha:</strong> {{ formatDate(v.fecha) }}</p>
      </div>
    </div>

    <p v-else>No hay visitas registradas</p>

    <!-- Modal de formulario -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content">
        <h3>{{ modoEdicion ? (formulario.id ? 'Editar Visita' : 'Nueva Visita') : 'Detalles de Visita' }}</h3>

        <form v-if="modoEdicion" @submit.prevent="guardarVisita">
          <label>
            Ganadero:
            <input v-model="formulario.ganadero" required />
          </label>
          <label>
            Teléfono:
            <input v-model="formulario.telefono" required />
          </label>
          <label>
            Finca:
            <input v-model="formulario.finca" required />
          </label>
          <label>
            Comunidad:
            <input v-model="formulario.comunidad" required />
          </label>
          <label>
            Fecha:
            <input type="date" v-model="formulario.fecha" required />
          </label>

          <label>Tipo Visita:</label>
          <div class="tipos-visita">
            <button
              v-for="tipo in tiposVisita"
              :key="tipo"
              :class="['boton-visita', { activo: formulario.tipo_visita === tipo }]"
              @click.prevent="formulario.tipo_visita = tipo"
              type="button"
            >
              {{ tipo }}
            </button>
          </div>

          <label>Tipo de Ganado:</label>
          <div class="tipos-visita">
            <button
              v-for="tipo in tiposGanado"
              :key="tipo"
              :class="['boton-visita', { activo: formulario.ganado_tipo === tipo }]"
              @click.prevent="formulario.ganado_tipo = tipo"
              type="button"
            >
              {{ tipo }}
            </button>
          </div>

          <label>
            Cantidad Animales:
            <input type="number" v-model.number="formulario.cantidad_animales" min="0" />
          </label>
          <label>
            Estado General:
            <input v-model="formulario.estado_general" />
          </label>
          <label>
            Diagnóstico:
            <textarea v-model="formulario.diagnostico"></textarea>
          </label>
          <label>
            Tratamiento:
            <textarea v-model="formulario.tratamiento"></textarea>
          </label>
          <label>
            Recomendaciones:
            <textarea v-model="formulario.recomendaciones"></textarea>
          </label>
          <label>
            Próxima Visita:
            <input type="date" v-model="formulario.proxima_visita" />
          </label>

          <div id="mapa" style="height: 250px; margin-bottom: 10px;"></div>
          <button type="button" @click="obtenerUbicacion" class="btn-ubicacion">
            Usar ubicación actual
          </button>
          <p v-if="formulario.latitud && formulario.longitud" class="ubicacion-info">
            Ubicación seleccionada: {{ Number(formulario.latitud).toFixed(5) }}, {{ Number(formulario.longitud).toFixed(5) }}
          </p>

          <div class="modal-buttons">
            <button type="submit" class="btn-guardar">{{ formulario.id ? 'Guardar Cambios' : 'Crear Visita' }}</button>
            <button type="button" @click="cerrarModal" class="btn-cancelar">Cancelar</button>
          </div>
        </form>

        <div v-else class="detalles-visita">
          <p><strong>Veterinario:</strong> {{ formulario.veterinario_id?.nombre || 'Desconocido' }}</p>
          <p><strong>Ganadero:</strong> {{ formulario.ganadero }}</p>
          <p><strong>Teléfono:</strong> {{ formulario.telefono }}</p>
          <p><strong>Finca:</strong> {{ formulario.finca }}</p>
          <p><strong>Comunidad:</strong> {{ formulario.comunidad }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(formulario.fecha) }}</p>
          <p><strong>Tipo Visita:</strong> {{ formulario.tipo_visita }}</p>
          <p><strong>Tipo de Ganado:</strong> {{ formulario.ganado_tipo }}</p>
          <p><strong>Cantidad Animales:</strong> {{ formulario.cantidad_animales }}</p>
          <p><strong>Estado General:</strong> {{ formulario.estado_general }}</p>
          <p><strong>Diagnóstico:</strong></p>
          <ul>
            <li class="lista" v-for="linea in formulario.diagnostico?.split('\n')" :key="linea">
              {{ linea.replace(/^[-•]\s*/, '') }}
            </li>
          </ul>
          <p><strong>Tratamiento:</strong></p>
          <ul>
            <li class="lista" v-for="linea in formulario.tratamiento?.split('\n')" :key="linea">
              {{ linea.replace(/^[-•]\s*/, '') }}
            </li>
          </ul>
          <p><strong>Recomendaciones:</strong></p>
          <ul>
            <li class="lista" v-for="linea in formulario.recomendaciones?.split('\n')" :key="linea">
              {{ linea.replace(/^[-•]\s*/, '') }}
            </li>
          </ul>
          <p><strong>Próxima Visita:</strong> {{ formatDate(formulario.proxima_visita) }}</p>
          <p><strong>Latitud:</strong> {{ formulario.latitud }}</p>
          <p><strong>Longitud:</strong> {{ formulario.longitud }}</p>

          <p v-if="Number.isFinite(formulario.latitud) && Number.isFinite(formulario.longitud)" class="ubicacion-info">
            Ubicación seleccionada: {{ formulario.latitud.toFixed(5) }}, {{ formulario.longitud.toFixed(5) }}
          </p>
          <a :href="`https://www.google.com/maps?q=${formulario.latitud},${formulario.longitud}`" target="_blank" rel="noopener noreferrer">
              Ver en Google Maps
          </a>

          <div class="modal-buttons">
            <button @click="activarEdicion" class="btn-editar">Editar</button>
            <button @click="abrirModalEliminar(formulario.id)" class="btn-eliminar">Eliminar</button>
            <button @click="enviarWhatsApp(formulario)" class="btn-whatsapp">Enviar WhatsApp</button>
            <button @click="cerrarModal" class="btn-cerrar">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Eliminación -->
    <div v-if="modalEliminarAbierto" class="modal-overlay" @click.self="cancelarEliminar">
      <div class="modal-content">
        <h3>Confirmar Eliminación</h3>
        <p>¿Seguro que deseas eliminar esta visita?</p>
        <div class="modal-buttons">
          <button @click="confirmarEliminar" class="btn-eliminar">Sí, eliminar</button>
          <button @click="cancelarEliminar" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visitas-container {
  max-width: 1300px;
  margin: auto;
  padding: 1rem;
  font-family: Arial, sans-serif;
}

.filtros-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.input-filtro {
  flex: 1;
  min-width: 150px;
  padding: 6px 10px;
  font-size: 14px;
}

.btn-nuevo {
  background: #10b981;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 15px;
}

.btn-nuevo:hover {
  background: #30daa1;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(240px,1fr));
  gap: 12px;
}

.card {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 0 6px #ccc;
  outline: none;
}

.card:focus {
  box-shadow: 0 0 8px #10b981;
}

.inicial {
  width: 100%;
  height: 50px;
  background: #10b981;
  color: white;
  font-weight: bold;
  font-size: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px 10px 0px 0px;
  margin-bottom: 6px;
}

.error {
  color: red;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 95%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

label {
  display: block;
  margin: 8px 0 4px;
  font-weight: bold;
}

input, textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  min-height: 60px;
}

.tipos-visita {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.boton-visita {
  background: #e0e0e0;
  border: none;
  padding: 6px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.boton-visita.activo {
  background: #10b981;
  color: white;
}
.detalles-visita p{
  margin: 7px 0;
}

.btn-ubicacion {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  margin-top: 8px;
  cursor: pointer;
}

.btn-ubicacion:hover {
  background: #1e7e34;
}

.ubicacion-info {
  margin-top: 8px;
  font-size: 14px;
  color: #333;
}

.modal-buttons {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-guardar {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-guardar:hover {
  background: #3de4ac;
}

.btn-cancelar, .btn-cerrar {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancelar:hover, .btn-cerrar:hover {
  background: #565e64;
}

.btn-editar {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-editar:hover {
  background: #49ebb5;
}


.detalles-visitas p{
  margin-top: 16px ;
}


.btn-eliminar {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-eliminar:hover {
  background: #a71d2a;
}
.btn-whatsapp {
  background: #25d366;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-whatsapp:hover {
  background: #128c7e;
}
.lista {
  margin-left: 20px;
  margin-bottom: 6px;
  font-size: 14px;
}
@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
