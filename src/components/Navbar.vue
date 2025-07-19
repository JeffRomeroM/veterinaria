<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const usuario = ref(null)
const veterinariaNombre = ref('Vet. El Almendro')
const menuAbierto = ref(false)
const mostrarModal = ref(false)

const cargarUsuario = async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const user = session?.user
  if (!user) {
    console.error('No hay usuario logueado')
    return
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('nombre, rol')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error supabase:', error)
    } else {
      usuario.value = data
    }
  } catch (err) {
    console.error('Error catch:', err)
  }
}

const abrirModal = () => {
  mostrarModal.value = true
}
const cerrarModal = () => {
  mostrarModal.value = false
}

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

onMounted(() => {
  cargarUsuario()
})
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <div class="logo">{{ veterinariaNombre }}</div>

      <div class="nav-links" :class="{ open: menuAbierto }">
        <router-link to="/visitas" class="nav-item">Visitas</router-link>
        <router-link v-if="usuario?.rol === 'admin'" to="/dashboard" class="nav-item">Dashboard</router-link>
        <router-link v-if="usuario?.rol === 'admin'" to="/recordatorios" class="nav-item">Recordatorios</router-link>
        <router-link v-if="usuario?.rol === 'admin'" to="/admin" class="nav-item">Admin</router-link>
        <div class="usuario-nombre" v-if="usuario">{{ usuario.nombre }} ({{ usuario.rol }})</div>
        <button @click="abrirModal" class="btn-logout">Salir</button>
      </div>

      <button
        class="menu-toggle"
        @click="menuAbierto = !menuAbierto"
        aria-label="Toggle menu"
      >
        <span :class="{ bar: true, open: menuAbierto }"></span>
        <span :class="{ bar: true, open: menuAbierto }"></span>
        <span :class="{ bar: true, open: menuAbierto }"></span>
      </button>

      
    </div>

    <!-- Modal Confirm Logout -->
    <div v-if="mostrarModal" class="modal-backdrop">
      <div class="modal">
        <h3>Confirmar cierre de sesión</h3>
        <p>¿Estás seguro que quieres cerrar sesión?</p>
        <div class="modal-buttons">
          <button @click="logout" class="btn-confirm">Sí</button>
          <button @click="cerrarModal" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: #10b981 !important;
  color: #f3f4f6;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  user-select: none;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-item {
  color: #f3f4f6;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.nav-item:hover {
  color: #60a5fa;
}

.btn-logout {
  background: #ef4444;
  border: none;
  padding: 0.4rem 0.8rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #b91c1c;
}

.usuario-nombre {
  margin-left: 1rem;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
}

/* Menu hamburguesa */
.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.bar {
  width: 25px;
  height: 3px;
  background-color: #f3f4f6;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.bar.open:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.bar.open:nth-child(2) {
  opacity: 0;
}

.bar.open:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* Responsive */
@media (max-width: 768px) {
    .navbar {

    background-color: #10b981;
    }
  .nav-links {
    width: 100%;
    flex-direction: column;
    display: none;
    margin-top: 0.5rem;
    background: #10B981;
    border-radius: 6px;
    padding: 0.5rem 1rem;
  }

  .nav-links.open {
    display: flex;
  }

  .menu-toggle {
    display: flex;
  }

  .usuario-nombre {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: white;
  padding: 1.5rem 2rem;
  color: #1f2937;
  border-radius: 8px;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  text-align: center;
}

.modal-buttons {
  margin-top: 1.2rem;
  display: flex;
  justify-content: space-around;
}

.btn-confirm {
  background: #ef4444;
  border: none;
  padding: 0.4rem 1rem;
  color: white;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}
.btn-confirm:hover {
  background: #b91c1c;
}

.btn-cancel {
  background: #6b7280;
  border: none;
  padding: 0.4rem 1rem;
  color: white;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}
.btn-cancel:hover {
  background: #4b5563;
}
</style>
