<template>
  <div class="login-container">
    <h1>Veterinaria El Almendro</h1>
    <h2>Iniciar Sesión</h2>
    <form @submit.prevent="login" class="form">
      <label>
        Correo electrónico:
        <input v-model="email" type="email" placeholder="correo@ejemplo.com" required />
      </label>

      <label>
        Contraseña:
        <input v-model="password" type="password" placeholder="********" required />
      </label>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
      </button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="register-redirect">
      <span>¿No tienes cuenta?</span>
      <button @click="goToRegister" class="register-button">Regístrate aquí</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

const login = async () => {
  errorMessage.value = ''
  loading.value = true

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = error.message
    loading.value = false
    return
  }

  if (data.user) {
    router.push('/visitas')
  }

  loading.value = false
}

const goToRegister = () => {
  router.push('/registrarse')
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: auto;
  margin-top: 10vh;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  background: #f9fafb; /* gris claro */
  box-shadow: 0 8px 20px rgb(37 99 235 / 0.2);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-container h1 {
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #10b981; /* azul */
}
.login-container h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-weight: 700;
  color: #10b981;
  font-size: 1.8rem;
}

.form label {
  display: block;
  margin-bottom: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.form input {
  width: 100%;
  padding: 0.65rem 1rem;
  margin-top: 0.3rem;
  margin-bottom: 1.3rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.form input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 6px #2563ebaa;
}

button {
  width: 100%;
  padding: 0.75rem 0;
  font-size: 1.15rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 10px rgb(16 185 129 / 0.5);
}

button:hover:not(:disabled) {
  background-color: #059669;
  box-shadow: 0 6px 15px rgb(5 150 105 / 0.7);
}

button:disabled {
  background-color: #6ee7b7;
  cursor: not-allowed;
  box-shadow: none;
}

.error {
  margin-top: 1rem;
  color: #b91c1c;
  font-weight: 700;
  text-align: center;
  font-size: 0.95rem;
}

.register-redirect {
  margin-top: 1.8rem;
  text-align: center;
  font-size: 1rem;
  color: #374151;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.register-button {
  background: none;
  border: none;
  color: #059669;
  font-weight: 700;
  cursor: pointer;
  padding: 3px ;
  font-size: 1rem;
  text-decoration: none;
  transition: color 0.3s ease;
}

.register-button:hover {
  color: #f9fafb;
}

/* Responsive para móviles */
@media (max-width: 480px) {
  .login-container {
    margin: 2rem 1rem;
    padding: 1.5rem 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  button {
    font-size: 1rem;
  }

  .register-redirect {
    font-size: 0.9rem;
  }

  .register-button {
    font-size: 0.9rem;
    text-decoration: none;
  }
}


</style>
