<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const email = ref('')
const password = ref('')
const confirmar = ref('')
const error = ref('')
const mensaje = ref('')
const router = useRouter()

const registrar = async () => {
  error.value = ''
  mensaje.value = ''

  if (password.value !== confirmar.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  const { data, error: err } = await supabase.auth.signUp({
    email: email.value,
    password: password.value
  })

  if (err) {
    error.value = err.message
    return
  }

  mensaje.value = 'Registro exitoso. Revisa tu correo para confirmar.'
  email.value = ''
  password.value = ''
  confirmar.value = ''
}

const irALogin = () => {
  router.push('/login') // Cambia si tu ruta login es diferente
}
</script>

<template>
  <div class="registro">
    <h2>Registro de usuario</h2>

    <form @submit.prevent="registrar" class="form-registro">
      <input v-model="email" type="email" placeholder="Correo electrónico" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <input v-model="confirmar" type="password" placeholder="Confirmar contraseña" required />
      <button type="submit">Registrarse</button>
    </form>

    <button @click="irALogin" class="btn-login">Volver a Login</button>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mensaje" class="mensaje">{{ mensaje }}</p>
  </div>
</template>

<style scoped>
.registro {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1.5rem;
  font-family: Arial, sans-serif;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 0 8px rgb(0 0 0 / 0.1);
  background-color: #fafafa;
}
h2 {
  text-align: center;
  margin-bottom: 1rem;
}
.form-registro input {
  display: block;
  width: 100%;
  margin-bottom: 12px;
  padding: 10px;
  font-size: 1rem;
  border-radius: 5px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}
button[type="submit"] {
  width: 100%;
  padding: 12px;
  font-size: 1.1rem;
  background-color: #4caf50;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
button[type="submit"]:hover {
  background-color: #45a049;
}
.btn-login {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
}
.btn-login:hover {
  background-color: #1976d2;
}
.error {
  color: #b91c1c;
  margin-top: 10px;
  font-weight: bold;
  text-align: center;
}
.mensaje {
  color: #2e7d32;
  margin-top: 10px;
  font-weight: bold;
  text-align: center;
}
</style>
