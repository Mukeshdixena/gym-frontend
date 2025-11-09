<template>
  <div class="app-layout min-vh-100" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- Hamburger Toggle (Mobile Only) -->
    <button
      class="sidebar-toggle d-lg-none"
      @click.stop="isSidebarOpen = !isSidebarOpen"
      :aria-label="isSidebarOpen ? 'Close navigation' : 'Open navigation'"
      :aria-expanded="isSidebarOpen"
      aria-controls="sidebar"
    >
      <i :class="isSidebarOpen ? 'bi bi-x-lg' : 'bi bi-list'"></i>
    </button>

    <!-- Toast Container -->
    <div class="toast-container">
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

    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar">
      <div class="sidebar-brand">
        <h3 class="fw-bold mb-0">💪DailyGym®</h3>
        <small class="text-muted">Admin Panel</small>
      </div>

      <nav class="sidebar-nav">
        <!-- Show only if ADMIN -->
        <router-link
          v-if="isAdmin"
          to="/admin/approvals"
          class="nav-item"
          active-class="active"
          @click="closeSidebarOnMobile"
        >
          <i class="bi bi-people-fill"></i>
          User Approvals
        </router-link>

        <router-link to="/" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-speedometer2"></i>
          Dashboard
        </router-link>

        <router-link to="/billing" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-receipt-cutoff"></i>
          Billing
        </router-link>

        <router-link
          to="/assign-membership-plan"
          class="nav-item"
          active-class="active" @click="closeSidebarOnMobile"
        >
          <i class="bi bi-card-checklist"></i>
          Assign Plan
        </router-link>

        <router-link to="/members" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-person-vcard"></i>
          Members
        </router-link>

        <router-link to="/trainers" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-person-badge-fill"></i>
          Trainers
        </router-link>

        <router-link to="/plans" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-journal-bookmark-fill"></i>
          Your Plans
        </router-link>

        <router-link to="/addons" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-collection-play"></i>
          Classes
        </router-link>

        <router-link to="/expenses" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-collection-play"></i>
          Expenses
        </router-link>

        <router-link
          to="/payment-history"
          class="nav-item"
          active-class="active" @click="closeSidebarOnMobile"
        >
          <i class="bi bi-credit-card-2-back"></i>
          Payment History
        </router-link>
      </nav>

      <!-- Logout Button -->
      <div class="sidebar-footer">
        <button
          @click="logout"
          class="btn btn-outline-light w-100 d-flex align-items-center gap-2"
        >
          <i class="bi bi-box-arrow-right"></i> Logout
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
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { Toast } from "bootstrap";

const router = useRouter();

const toastRef = ref<HTMLElement | null>(null);
let toastInstance: Toast;

const toastMessage = ref("");
const isSidebarOpen = ref(false); // Mobile sidebar state

const isAdmin = computed(() => localStorage.getItem("role") === "ADMIN");

const showToast = (msg: string, success = true) => {
  toastMessage.value = msg;
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${
      success ? "bg-success" : "bg-danger"
    } border-0`;
    toastInstance?.show();
  }
};

const hideToast = () => toastInstance?.hide();

const logout = () => {
  localStorage.clear();
  showToast("Logged out successfully!");
  setTimeout(() => {
    router.push("/login");
  }, 800);
};

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 993) {
    isSidebarOpen.value = false
  }
}

onMounted(() => {
  if (toastRef.value) {
    toastInstance = new Toast(toastRef.value);
  }

  // Close sidebar when clicking outside (mobile)
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      isSidebarOpen.value &&
      !target.closest(".sidebar") &&
      !target.closest(".sidebar-toggle")
    ) {
      isSidebarOpen.value = false;
    }
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
});

// Auto-hide toast after 4 seconds
watch(toastMessage, (msg) => {
  if (msg) {
    setTimeout(() => {
      if (toastMessage.value === msg) hideToast();
    }, 4000);
  }
});
</script>

<style scoped>
/* ========================================
   Layout & Base
   ======================================== */
.app-layout {
  display: flex;
  min-height: 100vh;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
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
  right: 1rem;
  z-index: 1101;
  background: rgba(18, 58, 238, 0.95);
  border: none;
  border-radius: 0.5rem;
  padding: 0.3rem 0.6rem;
  color: #ebeef1;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
   display: flex;
  align-items: center;
  justify-content: center;
}


.sidebar-toggle i {
  font-size: 1.4rem;
  transition: transform 0.3s ease, color 0.2s ease;
}

.sidebar-toggle:active {
  transform: scale(0.95);
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
    right: 0;
    top: 0;
    transform: translateX(100%);
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
