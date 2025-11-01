<template>
  <div class="d-flex vh-100">
    <!-- Sidebar -->
    <aside class="bg-dark text-light p-3" style="width: 220px; position: relative;">
      <h2 class="mb-4">GymApp</h2>

      <nav class="nav flex-column">
        <router-link to="/" class="nav-link text-light" active-class="active">Dashboard</router-link>
        <router-link to="/billing" class="nav-link text-light" active-class="active">Billing</router-link>
        <router-link to="/assign-membership-plan" class="nav-link text-light" active-class="active">Assign Membership Plan</router-link>
        <router-link to="/members" class="nav-link text-light" active-class="active">Members</router-link>
        <router-link to="/trainers" class="nav-link text-light" active-class="active">Trainers</router-link>
        <router-link to="/classes" class="nav-link text-light" active-class="active">Classes</router-link>
        <router-link to="/plans" class="nav-link text-light" active-class="active">Your Plans</router-link>
        <router-link to="/payment-history" class="nav-link text-light" active-class="active">Payment History</router-link>
      </nav>

      <!-- Logout Button -->
      <div class="mt-auto pt-3">
        <button
          @click="logout"
          class="btn btn-outline-light w-100"
          title="Clear local storage and log out"
        >
          Logout
        </button>
      </div>
    </aside>

    <!-- Toast Container (same as your other page) -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1100;">
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

    <!-- Main content -->
    <div class="flex-grow-1 d-flex flex-column">
      <header class="bg-light p-3 border-bottom">
        <h3>Welcome to Gym Management</h3>
      </header>
      <main class="flex-grow-1 p-3 bg-light">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'bootstrap'

const router = useRouter()

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast

const toastMessage = ref('')

const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
}

const hideToast = () => toastInstance?.hide()

const logout = () => {
  // Clear localStorage
  localStorage.clear()

  // Show success toast
  showToast('Logged out successfully!')

  // Redirect to login page after a short delay (so toast is visible)
  setTimeout(() => {
    router.push('/login') // Change '/login' if your login route is different
  }, 800)
}

// Initialize Bootstrap Toast
onMounted(() => {
  if (toastRef.value) {
    toastInstance = new Toast(toastRef.value)
  }
})

// Auto-hide toast after 3 seconds
watch(toastMessage, (msg) => {
  if (msg) {
    setTimeout(() => {
      if (toastMessage.value === msg) hideToast()
    }, 3000)
  }
})
</script>

<style scoped>
/* Active link style */
.active {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-weight: 500;
}

/* Push logout button to bottom */
.mt-auto {
  margin-top: auto;
}
</style>