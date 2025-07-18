<script setup>
import { ref, onMounted } from 'vue'
import Navbar from './Navbar.vue'
import { supabase } from '../supabase'

const usuarios = ref([])
const cargando = ref(true)
const error = ref('')
const modalVisible = ref(false)
const usuarioAEliminar = ref(null)

const cargarUsuarios = async () => {
  cargando.value = true
  const { data, error: err } = await supabase
    .from('usuarios')
    .select('id, correo, nombre, rol')
    .order('creado_en', { ascending: false })

  if (err) {
    error.value = err.message
    console.error(err)
  } else {
    usuarios.value = data
  }
  cargando.value = false
}

const guardarDatos = async (usuario) => {
  const { error } = await supabase
    .from('usuarios')
    .update({
      nombre: usuario.nombre,
      rol: usuario.rol
    })
    .eq('id', usuario.id)

  if (error) {
    console.error('Error al guardar:', error)
  } else {
    cargarUsuarios()
  }
}

const confirmarEliminar = (usuario) => {
  usuarioAEliminar.value = usuario
  modalVisible.value = true
}

const eliminarUsuario = async () => {
  await supabase.from('usuarios').delete().eq('id', usuarioAEliminar.value.id)
  modalVisible.value = false
  usuarioAEliminar.value = null
  cargarUsuarios()
}

const cancelarEliminar = () => {
  modalVisible.value = false
  usuarioAEliminar.value = null
}

onMounted(cargarUsuarios)

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const exportarVisitas = async () => {
  const { data, error } = await supabase
    .from('visitas')
    .select('*')

  if (error) {
    console.error('Error exportando visitas:', error)
    return
  }

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitas')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `respaldo_visitas_${new Date().toISOString().slice(0, 10)}.xlsx`)
}


</script>

<template>
  <Navbar />
  <div class="admin-container">
    <h2>Gestión de Usuarios</h2>
    <button @click="exportarVisitas" class="btn-exportar">Exportar visitas a Excel</button>


    <p v-if="cargando">Cargando usuarios...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <table v-if="usuarios.length">
      <thead>
        <tr>
          <th>Correo</th>
          <th>Nombre</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in usuarios" :key="u.id">
          <td>{{ u.correo }}</td>
          <td><input v-model="u.nombre" /></td>
          <td>
            <select v-model="u.rol">
              <option value="">--</option>
              <option value="admin">admin</option>
              <option value="veterinario">veterinario</option>
            </select>
          </td>
          <td>
            <button @click="guardarDatos(u)">Guardar</button>
            <button @click="confirmarEliminar(u)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>No hay usuarios registrados.</p>

    <!-- Modal -->
    <div v-if="modalVisible" class="modal-overlay">
      <div class="modal">
        <h3>¿Estás seguro de eliminar este usuario?</h3>
        <p>{{ usuarioAEliminar?.correo }}</p>
        <div class="modal-buttons">
          <button @click="eliminarUsuario" class="btn-confirmar">Sí, eliminar</button>
          <button @click="cancelarEliminar" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 900px;
  margin: auto;
  padding: 1rem;
  font-family: Arial, sans-serif;
}

h2 {
  text-align: center;
  margin-bottom: 1rem;
}
.btn-exportar {
  background-color: #1976d2;
  color: white;
  padding: 8px 12px;
  margin-bottom: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: #f9f9f9;
}

th, td {
  border: 1px solid #ccc;
  padding: 10px;
  text-align: left;
}

input, select {
  width: 100%;
  padding: 6px;
  box-sizing: border-box;
}

button {
  padding: 6px 10px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}

button:first-of-type {
  background-color: #4caf50;
}
button:last-of-type {
  background-color: #f44336;
}

.error {
  color: red;
  font-weight: bold;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  background: white;
  padding: 20px;
  max-width: 90%;
  border-radius: 8px;
  text-align: center;
}

.modal-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-confirmar {
  background: #e53935;
}

.btn-cancelar {
  background: #757575;
}

/* Responsive */
@media screen and (max-width: 600px) {
  table, thead, tbody, th, td, tr {
    display: block;
    width: 100%;
  }

  tr {
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    padding: 0.5rem;
  }

  th {
    display: none;
  }

  td {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
  }

  input, select {
    width: 60%;
  }
}
</style>
