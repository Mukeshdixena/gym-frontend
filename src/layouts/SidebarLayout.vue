<template>
  <div class="app-layout min-vh-100" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- Hamburger Toggle (Mobile Only) -->
    <button class="sidebar-toggle d-lg-none" @click.stop="isSidebarOpen = !isSidebarOpen"
      :aria-label="isSidebarOpen ? 'Close navigation' : 'Open navigation'" :aria-expanded="isSidebarOpen"
      aria-controls="sidebar">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd"
          d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm.5-3.5a.5.5 0 0 0 0 1h10a.5.5 0 0 0 0-1H3z" />
      </svg>
    </button>

    <!-- Toast Container -->
    <div class="toast-container">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert"
        aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar">
      <div class="sidebar-brand">
        <h3 class="fw-bold mb-0">DailyGym®</h3>
        <small class="text-muted">Admin Panel</small>
      </div>

      <nav class="sidebar-nav">
        <!-- Show only if ADMIN -->
        <router-link v-if="isAdmin" to="/admin/approvals" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z" />
          </svg>
          User Approvals
        </router-link>

        <router-link to="/" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6a5 5 0 0 1 10 0H1z" />
          </svg>
          Dashboard
        </router-link>

        <router-link to="/billing" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.5h15V4a1 1 0 0 0-1-1H2zm13.5 3a.5.5 0 0 1 0 1H4a.5.5 0 0 1 0-1h11.5z" />
          </svg>
          Billing
        </router-link>

        <router-link to="/assign-membership-plan" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M3.5 0a2.5 2.5 0 0 1 2.5 2.5V4H10v-.5a2.5 2.5 0 0 1 5 0V4a1 1 0 0 0 1 1h2v9a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h1.5zM3 2a1 1 0 0 0-1 1v.5h14V3a1 1 0 0 0-1-1H3zm11 10a1 1 0 1 0-2 0v1h2v-1z" />
          </svg>
          Assign Plan
        </router-link>

        <router-link to="/members" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            <path fill-rule="evenodd"
              d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.5h12V4a1 1 0 0 0-1-1H2z" />
          </svg>
          Members
        </router-link>

        <router-link to="/trainers" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            <path fill-rule="evenodd"
              d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10.36 7 10.36c2.195 0 3.758.866 4.468 2.01A7 7 0 0 0 8 1z" />
          </svg>
          Trainers
        </router-link>

        <router-link to="/plans" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd"
              d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm2 2h5v8H6V2zm0 1v6h5V3H6z" />
          </svg>
          Your Plans
        </router-link>

        <router-link to="/addons" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
          </svg>
          Special Programs
        </router-link>

        <router-link to="/expenses" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M8.5 2.687c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.743-.069-2.117-.356-3.387-.882-1.33-.526-2.457-.972-3.113-1.661V2.687zM8 1.783c.597.066 1.232.259 1.943.482V14.652c-.716.227-1.346.482-1.943.597V1.782zM7 1c-1.53 0-2.968.333-4.016.941v14.117C4.032 15.333 5.47 15 7 15c1.53 0 2.968-.333 4.016-.941V1.941C9.968.667 8.53 0 7 0z" />
          </svg>
          Expenses
        </router-link>

        <router-link to="/payment-history" class="nav-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H0V4zm0 1v5.996C0 11.668.79 12 1.5 12H2v-1h12v1h.5c.71 0 1.5-.332 1.5-.996V5H0zm14 6.997c0 .644-.58.997-1.5.997H1.5c-.92 0-1.5-.353-1.5-.997V6h14v4.997z" />
          </svg>
          Payment History
        </router-link>
      </nav>

      <!-- Logout Button -->
      <div class="sidebar-footer">
        <button @click="logout" class="btn btn-outline-light w-100 d-flex align-items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd"
              d="M9.646 7.646a.5.5 0 0 1 .708 0L13.5 11.207l1.646-1.147a.5.5 0 0 1 .708.708l-2 1.5a.5.5 0 0 1-.708 0l-2-1.5a.5.5 0 0 1 0-.708z" />
            <path fill-rule="evenodd" d="M8 5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-4A.5.5 0 0 1 8 5z" />
            <path
              d="M.5 8a.5.5 0 0 1 0-1H2V6a3 3 0 0 1 5.5-1.67l.646.647a.5.5 0 0 1 .708 0L11 7.293V1.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v6.293l2.646-1.646a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0L13 8.207V14.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-2.793l-2.646 1.646a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 11.207V5.5A3 3 0 0 0 2 6v1H.5a.5.5 0 0 1 0-1z" />
          </svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <main class="page-container">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'bootstrap'

const router = useRouter()

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast

const toastMessage = ref('')
const isSidebarOpen = ref(false) // Mobile sidebar state

const isAdmin = computed(() => localStorage.getItem('role') === 'ADMIN')

const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
}

const hideToast = () => toastInstance?.hide()

const logout = () => {
  localStorage.clear()
  showToast('Logged out successfully!')
  setTimeout(() => {
    router.push('/login')
  }, 800)
}

onMounted(() => {
  if (toastRef.value) {
    toastInstance = new Toast(toastRef.value)
  }

  // Close sidebar when clicking outside (mobile)
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      isSidebarOpen.value &&
      !target.closest('.sidebar') &&
      !target.closest('.sidebar-toggle')
    ) {
      isSidebarOpen.value = false
    }
  }

  document.addEventListener('click', handleClickOutside)
  return () => document.removeEventListener('click', handleClickOutside)
})

// Auto-hide toast after 4 seconds
watch(toastMessage, (msg) => {
  if (msg) {
    setTimeout(() => {
      if (toastMessage.value === msg) hideToast()
    }, 4000)
  }
})
</script>

<style scoped>
/* ========================================
   Layout & Base
   ======================================== */
.app-layout {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f8f9fa;
  position: relative;
  overflow-x: hidden;
  overflow-y: hidden;
  height: 100vh;
}

/* ========================================
   Hamburger Toggle (Mobile)
   ======================================== */
.sidebar-toggle {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1101;
  background: rgba(30, 41, 59, 0.95);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sidebar-toggle:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

/* ========================================
   Sidebar
   ======================================== */
.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  transition: transform 0.3s ease;
  z-index: 1090;
}

/* Desktop: always visible */
@media (min-width: 993px) {
  .sidebar {
    position: sticky;
    transform: translateX(0) !important;
  }
}

/* Mobile: hidden by default, slide in when open */
@media (max-width: 992px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
  }

  .app-layout.sidebar-open .sidebar {
    transform: translateX(0);
  }

  /* Optional: wider on very small screens */
  .sidebar {
    width: 260px;
  }
}

/* Sidebar Brand */
.sidebar-brand {
  padding: 1.5rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(30, 41, 59, 0.8);
}

.sidebar-brand h3 {
  color: #60a5fa;
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.sidebar-brand small {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  border-radius: 0 20px 20px 0;
  margin: 0.125rem 0.25rem;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: rgba(79, 70, 229, 0.15);
  color: #e2e8f0;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.nav-item svg {
  flex-shrink: 0;
  opacity: 0.9;
}

.nav-item.active svg {
  opacity: 1;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 2rem;
}

.sidebar-footer .btn {
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.sidebar-footer .btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

/* ========================================
   Main Content
   ======================================== */
.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100vh;
}

.page-container {
  flex: 1;
  padding: 1.5rem;
  padding-bottom: 0;

  max-width: 100%;
}

/* Adjust padding on small screens */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }
}

@media (max-width: 576px) {
  .page-container {
    padding: 0.75rem;
  }
}

/* ========================================
   Toast
   ======================================== */
.toast-container {
  position: fixed;
  top: 0.5rem;
  right: 0.5rem;
  left: 0.5rem;
  z-index: 1100;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}

.toast {
  max-width: 350px;
  pointer-events: auto;
}

@media (max-width: 576px) {
  .toast-container {
    top: 4rem;
    /* Below hamburger */
    left: 1rem;
    right: 1rem;
    justify-content: center;
  }

  .toast {
    width: 100%;
    max-width: none;
  }
}
</style>