<template>
  <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div
        ref="toastRef"
        class="toast align-items-center text-white bg-success border-0"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            @click="hideToast"
          ></button>
        </div>
      </div>
    </div>

    <!-- Login Card -->
    <div class="card shadow-lg" style="max-width: 420px; width: 100%">
      <div class="card-header bg-primary text-white text-center py-3">
        <h4 class="mb-0">Gym Admin Portal</h4>
      </div>
      <div class="card-body p-4">
        <!-- Tabs: Login / Sign Up -->
        <ul class="nav nav-tabs mb-4" id="authTab" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link active"
              data-bs-toggle="tab"
              data-bs-target="#login"
              type="button"
            >
              Login
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              data-bs-toggle="tab"
              data-bs-target="#signup"
              type="button"
            >
              Sign Up
            </button>
          </li>
        </ul>

        <div class="tab-content">
          <!-- Login Tab -->
          <div class="tab-pane fade show active" id="login">
            <form @submit.prevent="loginUser">
              <div class="mb-3">
                <label for="loginEmail" class="form-label">Email</label>
                <input
                  id="loginEmail"
                  v-model="loginForm.email"
                  type="email"
                  class="form-control"
                  placeholder="admin@gym.com"
                  required
                  :disabled="isLoading"
                />
              </div>
              <div class="mb-3">
                <label for="loginPassword" class="form-label">Password</label>
                <div class="input-group">
                  <input
                    id="loginPassword"
                    v-model="loginForm.password"
                    :type="showLoginPassword ? 'text' : 'password'"
                    class="form-control"
                    placeholder="••••••••"
                    required
                    :disabled="isLoading"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="showLoginPassword = !showLoginPassword"
                    :disabled="isLoading"
                  >
                    <i :class="showLoginPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                class="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                :disabled="isLoading"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isLoading ? 'Logging in...' : 'Login' }}
              </button>
            </form>
          </div>

          <!-- Sign Up Tab -->
          <div class="tab-pane fade" id="signup">
            <form @submit.prevent="signupUser">
              <div class="mb-3">
                <label for="signupName" class="form-label">Full Name</label>
                <input
                  id="signupName"
                  v-model="signupForm.name"
                  type="text"
                  class="form-control"
                  placeholder="John Doe"
                  required
                  :disabled="isLoading"
                />
              </div>
              <div class="mb-3">
                <label for="signupEmail" class="form-label">Email</label>
                <input
                  id="signupEmail"
                  v-model="signupForm.email"
                  type="email"
                  class="form-control"
                  placeholder="john@example.com"
                  required
                  :disabled="isLoading"
                />
              </div>
              <div class="mb-3">
                <label for="signupPassword" class="form-label">Password</label>
                <div class="input-group">
                  <input
                    id="signupPassword"
                    v-model="signupForm.password"
                    :type="showSignupPassword ? 'text' : 'password'"
                    class="form-control"
                    placeholder="Min. 6 characters"
                    required
                    minlength="6"
                    :disabled="isLoading"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="showSignupPassword = !showSignupPassword"
                    :disabled="isLoading"
                  >
                    <i :class="showSignupPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                class="btn btn-success w-100 d-flex align-items-center justify-content-center"
                :disabled="isLoading"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isLoading ? 'Creating...' : 'Create Account' }}
              </button>
            </form>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="serverError"
          class="alert alert-danger mt-3 py-2 text-center small"
        >
          {{ serverError }}
        </div>

        <!-- Footer -->
        <div class="text-center mt-4">
          <small class="text-muted">
            Need help?
            <a href="mailto:admin@gym.com" class="text-primary">Contact Admin</a>
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Toast } from 'bootstrap'
import api from '@/api/axios'

const loginForm = ref({ email: '', password: '' })
const signupForm = ref({ name: '', email: '', password: '' })

const showLoginPassword = ref(false)
const showSignupPassword = ref(false)
const isLoading = ref(false)
const serverError = ref('')
const toastMessage = ref('')

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast

const router = useRouter()
const route = useRoute()

const showToast = (message: string, isSuccess = true) => {
  toastMessage.value = message
  if (!toastRef.value) return
  toastRef.value.className = `toast align-items-center text-white ${
    isSuccess ? 'bg-success' : 'bg-danger'
  } border-0`
  toastRef.value.querySelector('.toast-body')!.textContent = message
  toastInstance?.show()
  setTimeout(() => hideToast(), 4000)
}
const hideToast = () => toastInstance?.hide()

// --- Login ---
const loginUser = async () => {
  serverError.value = ''
  isLoading.value = true
  try {
    const res = await api.post('/auth/login', {
      email: loginForm.value.email.trim(),
      password: loginForm.value.password,
    })

    // Check for approval
    const userStatus = res.data?.user?.status
    if (userStatus && userStatus !== 'APPROVED') {
      throw new Error(
        userStatus === 'PENDING'
          ? 'Your account is pending admin approval.'
          : 'Your account has been rejected.'
      )
    }

    const token = res.data.token
    if (!token) throw new Error('No token received')

    localStorage.setItem('token', token)
    showToast('Login successful! Redirecting...')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    serverError.value = err.response?.data?.message || err.message || 'Login failed.'
    showToast(serverError.value, false)
  } finally {
    isLoading.value = false
  }
}

// --- Sign Up ---
const signupUser = async () => {
  serverError.value = ''
  isLoading.value = true
  try {
    await api.post('/auth/register', {
      name: signupForm.value.name.trim(),
      email: signupForm.value.email.trim(),
      password: signupForm.value.password,
    })
    showToast('Account created! Awaiting admin approval.', true)
    const loginTab = document.querySelector('[data-bs-target="#login"]') as HTMLElement
    loginTab?.click()
    signupForm.value = { name: '', email: '', password: '' }
  } catch (err: any) {
    serverError.value = err.response?.data?.message || 'Sign up failed.'
    showToast(serverError.value, false)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
})
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.card {
  border: none;
  border-radius: 1rem;
}
.card-header {
  border-radius: 1rem 1rem 0 0 !important;
}
.nav-tabs .nav-link {
  border: none;
  border-bottom: 2px solid transparent;
  color: #6c757d;
  font-weight: 500;
}
.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom: 2px solid #0d6efd;
}
.btn-primary {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  border: none;
  font-weight: 500;
}
.btn-success {
  background: linear-gradient(135deg, #198754, #157347);
  border: none;
}
.btn-primary:hover,
.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
.alert {
  font-size: 0.875rem;
}
</style>
