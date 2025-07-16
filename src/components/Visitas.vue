<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '../supabase'

const visitas = ref([])
const cargando = ref(false)
const error = ref('')

const modalAbierto = ref(false)
const modoEdicion = ref(false) // indica si está editando o solo viendo

const formulario = reactive({
  id: null,
  ganadero: '',
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

const abrirModal = (visita = null) => {
  if (visita) {
    modoEdicion.value = false
    Object.assign(formulario, visita)
  } else {
    modoEdicion.value = true
    Object.assign(formulario, {
      id: null,
      ganadero: '',
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
}

const cerrarModal = () => {
  modalAbierto.value = false
  modoEdicion.value = false
}

const activarEdicion = () => {
  modoEdicion.value = true
}

const guardarVisita = async () => {
  if (!user.value) {
    error.value = 'No hay usuario logueado'
    return
  }

  const visitaData = { ...formulario }
  delete visitaData.id
  visitaData.veterinario_id = user.value.id

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

const eliminarVisita = async (id) => {
  if (!confirm('¿Seguro que deseas eliminar esta visita?')) return
  const { error: err } = await supabase
    .from('visitas')
    .delete()
    .eq('id', id)

  if (err) {
    error.value = err.message
  } else {
    cerrarModal()
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

onMounted(async () => {
  await cargarUsuario()
  await cargarVeterinarios()
  await cargarVisitas()
})
</script>

<template>
  <div>
    <h2>Visitas Veterinarias</h2>

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

    <!-- Modal -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content">
        <h3>{{ modoEdicion ? (formulario.id ? 'Editar Visita' : 'Nueva Visita') : 'Detalles de Visita' }}</h3>

        <form v-if="modoEdicion" @submit.prevent="guardarVisita">
          <label>
            Ganadero:
            <input v-model="formulario.ganadero" required />
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
          <label>
            Tipo Visita:
            <input v-model="formulario.tipo_visita" required />
          </label>
          <label>
            Tipo de Ganado:
            <input v-model="formulario.ganado_tipo" />
          </label>
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
          <label>
            Latitud:
            <input v-model="formulario.latitud" />
          </label>
          <label>
            Longitud:
            <input v-model="formulario.longitud" />
          </label>

          <div class="modal-buttons">
            <button type="submit">{{ formulario.id ? 'Guardar Cambios' : 'Crear Visita' }}</button>
            <button type="button" @click="cerrarModal">Cancelar</button>
          </div>
        </form>

        <div v-else>
          <p><strong>Veterinario:</strong> {{ formulario.veterinario_id?.nombre || 'Desconocido' }}</p>     
          <p><strong>Ganadero:</strong> {{ formulario.ganadero }}</p>
          <p><strong>Finca:</strong> {{ formulario.finca }}</p>
          <p><strong>Comunidad:</strong> {{ formulario.comunidad }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(formulario.fecha) }}</p>
          <p><strong>Tipo Visita:</strong> {{ formulario.tipo_visita }}</p>
          <p><strong>Tipo de Ganado:</strong> {{ formulario.ganado_tipo }}</p>
          <p><strong>Cantidad Animales:</strong> {{ formulario.cantidad_animales }}</p>
          <p><strong>Estado General:</strong> {{ formulario.estado_general }}</p>
          <p><strong>Diagnóstico:</strong> {{ formulario.diagnostico }}</p>
          <p><strong>Tratamiento:</strong> {{ formulario.tratamiento }}</p>
          <p><strong>Recomendaciones:</strong> {{ formulario.recomendaciones }}</p>
          <p><strong>Próxima Visita:</strong> {{ formatDate(formulario.proxima_visita) }}</p>
          <p><strong>Latitud:</strong> {{ formulario.latitud }}</p>
          <p><strong>Longitud:</strong> {{ formulario.longitud }}</p>

          <div class="modal-buttons">
            <button @click="activarEdicion" class="btn-editar">Editar</button>
            <button @click="eliminarVisita(formulario.id)" class="btn-eliminar">Eliminar</button>
            <button @click="cerrarModal" class="btn-cerrar">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error {
  color: #b91c1c;
  font-weight: 600;
  margin-bottom: 1rem;
}

.btn-nuevo {
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 700;
  margin-bottom: 1rem;
  transition: background-color 0.2s ease;
}
.btn-nuevo:hover {
  background-color: #27f8b2;
}

.filtros-container {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.input-filtro {
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
  min-width: 150px;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  width: 96%;
  margin: auto;
}

.card {
  position: relative;
  border: 1px solid #ccc;
  padding: 40px 8px 8px 8px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
  cursor: pointer;
}

.inicial {
  position: absolute;
  top: 8px;
  left: 0;
  right: 0;
  background-color: #10b981;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  padding: 6px 0;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  user-select: none;
}

.card h3 {
  margin-top: 4px;
  margin-bottom: 0.3rem;
}

.card p {
  margin: 0.2rem 0;
  font-size: 0.9rem;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-height: 90vh;
  overflow-y: auto;
  width: 90%;
  max-width: 600px;
}

.modal-content form label {
  display: block;
  margin-bottom: 10px;
}

.modal-content form input,
.modal-content form textarea {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.btn-editar {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.2s ease;
}
.btn-editar:hover {
  background-color: #1769aa;
}

.btn-eliminar {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.2s ease;
}
.btn-eliminar:hover {
  background-color: #d32f2f;
}

.btn-cerrar {
  background-color: #777;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.2s ease;
}
.btn-cerrar:hover {
  background-color: #555;
}

/* Responsive: móvil 2 columnas */
@media (max-width: 600px) {
  .cards-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Responsive: móvil pequeño 1 columna */
@media (max-width: 360px) {
  .cards-container {
    grid-template-columns: repeat(2, 1fr);

  }
}
</style>
