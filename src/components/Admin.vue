<script setup>
import { ref, onMounted } from 'vue'
import Navbar from './Navbar.vue'
import { supabase } from '../supabase'

const usuarios = ref([])
const cargando = ref(true)
const error = ref('')

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

const eliminarUsuario = async (id) => {
  if (!confirm('¿Eliminar este usuario?')) return
  await supabase.from('usuarios').delete().eq('id', id)
  cargarUsuarios()
}

onMounted(cargarUsuarios)
</script>

<template>
    <Navbar />
  <div class="admin-container">
    <h2>Gestión de Usuarios</h2>

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
          <td>
            <input v-model="u.nombre" placeholder="Nombre" />
          </td>
          <td>
            <select v-model="u.rol">
              <option value="">--</option>
              <option value="admin">admin</option>
              <option value="veterinario">veterinario</option>
            </select>
          </td>
          <td>
            <button @click="guardarDatos(u)">Guardar</button>
            <button @click="eliminarUsuario(u.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>No hay usuarios registrados.</p>
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
</style>
