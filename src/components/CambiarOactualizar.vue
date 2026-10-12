<template>
  <div class="formulario">
    <h2 v-if="!enModoCambio">Recuperar Contraseña</h2>
    <h2 v-else>Cambiar Contraseña</h2>

    <div v-if="!enModoCambio">
      <input v-model="email" type="email" placeholder="Correo electrónico" />
      <button @click="enviarEnlace">Enviar enlace de recuperación</button>
    </div>

    <div v-else>
      <input v-model="password" type="password" placeholder="Nueva contraseña" />
      <button @click="actualizarContrasena">Actualizar contraseña</button>
    </div>

    <p v-if="mensaje">{{ mensaje }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const email = ref('')
const password = ref('')
const mensaje = ref('')
const enModoCambio = ref(false)

onMounted(() => {
  // Detecta si el usuario vino del enlace de recuperación
  supabase.auth.getSession().then(({ data }) => {
    if (data?.session) {
      enModoCambio.value = true
    }
  })
})

const enviarEnlace = async () => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: window.location.href, // vuelve a esta misma ruta
  })
  if (error) {
    mensaje.value = 'Error: ' + error.message
  } else {
    mensaje.value = 'Revisa tu correo para cambiar la contraseña.'
  }
}

const actualizarContrasena = async () => {
  const { error } = await supabase.auth.updateUser({ password: password.value })
  if (error) {
    mensaje.value = 'Error: ' + error.message
  } else {
    mensaje.value = 'Contraseña actualizada correctamente. Redirigiendo...'
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
  }
}

</script>

<style scoped>
.formulario {
  max-width: 400px;
  margin: auto;
  padding: 20px;
}
input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
}
button {
  width: 100%;
}
</style>
