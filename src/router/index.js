import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import { supabase } from '../supabase'
import Home from '../components/Home.vue'
import Admin from '../components/Admin.vue'
import Register from '../components/Register.vue'
import Dashboard from '../components/Dashboard.vue'
import Recordatorio from '../components/Recordatorio.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/registrarse', component: Register },
  {
    path: '/visitas',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/recordatorios',
    component: Recordatorio,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard para proteger rutas
router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user

  // Rutas que requieren autenticación
  if (to.meta.requiresAuth) {
    if (!user) return next('/')

    // Si la ruta requiere admin, validamos rol
    if (to.meta.requiresAdmin) {
      const { data: perfil, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (error || perfil.rol !== 'admin') {
        // No es admin, redirigimos a inicio u otra ruta
        return next('/inicio')
      }
    }
  }

  next()
})


export default router
