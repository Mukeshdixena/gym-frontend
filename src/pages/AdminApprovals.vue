<template>
  <div class="container mt-4">
    <h3 class="mb-4">Admin – User Management</h3>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert"
        aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- ==== FILTERS ==== -->
    <div class="row g-3 mb-3">
      <div class="col-md-4">
        <input type="text" class="form-control form-control-sm" placeholder="Name / email" v-model="filterMember" />
      </div>
      <div class="col-md-3">
        <select class="form-select form-select-sm" v-model="filterRole">
          <option :value="null">All Roles</option>
          <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <select class="form-select form-select-sm" v-model="filterStatus">
          <option :value="null">All Statuses</option>
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="col-md-2">
        <button class="btn btn-outline-secondary btn-sm w-100" @click="resetFilters">Clear</button>
      </div>
    </div>

    <!-- Pending Approvals -->
    <div class="card mb-4 shadow-sm">
      <div class="card-header bg-warning text-dark fw-bold">Pending Approvals</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Registered</th>
              <th>Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in filteredPending" :key="u.id">
              <td>{{ i + 1 }}</td>
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ formatDate(u.createdAt) }}</td>
              <td><span class="badge bg-warning text-dark">PENDING</span></td>
              <td class="text-center">
                <button class="btn btn-success btn-sm me-2" @click="approveUser(u.id)">Approve</button>
                <button class="btn btn-danger btn-sm me-2" @click="rejectUser(u.id)">Reject</button>

                <!-- Login as (disabled for PENDING) -->
                <button class="btn btn-warning btn-sm" @click="loginAsUser(u.id)" :disabled="u.status !== 'APPROVED'"
                  title="Login as this user (only for approved users)">
                  Login as
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredPending.length" class="alert alert-info text-center">No pending users found.</div>
      </div>
    </div>

    <!-- Approved Users -->
    <div class="card shadow-sm">
      <div class="card-header bg-success text-white fw-bold">Approved Users</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Registered</th>
              <th>Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in filteredApproved" :key="u.id">
              <td>{{ i + 1 }}</td>
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.role }}</td>
              <td>{{ formatDate(u.createdAt) }}</td>
              <td>
                <span class="badge"
                  :class="{ 'bg-success': u.status === 'APPROVED', 'bg-danger': u.status === 'REJECTED' }">
                  {{ u.status }}
                </span>
              </td>
              <td class="text-center">
                <div class="dropdown" @click.stop="toggleDropdown(u.id)">
                  <button class="btn btn-light btn-sm border-0">…</button>
                  <div v-if="openDropdownId === u.id" class="dropdown-menu-custom shadow-sm">
                    <a href="javascript:void(0)" @click="openEditModal(u)" class="dropdown-item-custom">Edit</a>
                    <a href="javascript:void(0)" @click="deleteUser(u.id)"
                      class="dropdown-item-custom text-danger">Delete</a>
                    <a href="javascript:void(0)" @click="loginAsUser(u.id)"
                      class="dropdown-item-custom text-warning">Login as</a>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredApproved.length" class="alert alert-info text-center">No approved users found.</div>
      </div>
    </div>

    <!-- Edit / Create User Modal -->
    <div class="modal fade" ref="editModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editForm.id ? 'Edit User' : 'Create New User' }}</h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name</label>
                  <input v-model="editForm.name" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input v-model="editForm.email" type="email" class="form-control" required />
                </div>
                <div class="col-md-6" v-if="!editForm.id">
                  <label class="form-label">Password</label>
                  <input v-model="editForm.password" type="password" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Role</label>
                  <select v-model="editForm.role" class="form-select">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div class="col-md-6 mt-3">
                  <label class="form-label">Status</label>
                  <select v-model="editForm.status" class="form-select">
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
              <div class="d-grid gap-2 mt-4">
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Small Confirm Modal -->
    <div class="modal fade" :class="{ show: isConfirmOpen }" tabindex="-1" style="display: block;" v-if="isConfirmOpen"
      @click.self="resolveConfirm(false)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-2">
            <h5 class="modal-title fs-6">Confirm Action</h5>
            <button type="button" class="btn-close" @click="resolveConfirm(false)"></button>
          </div>
          <div class="modal-body pt-2 pb-3">{{ confirmMessage }}</div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="resolveConfirm(false)">Cancel</button>
            <button type="button" class="btn btn-danger btn-sm" @click="resolveConfirm(true)">OK</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isConfirmOpen" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import { useRouter } from 'vue-router'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

// ── State ─────────────────────────────────────────────────────────────────────
const allUsers = ref<User[]>([])
const pending = ref<User[]>([])
const approved = ref<User[]>([])

// Filters
const filterMember = ref('')
const filterRole = ref<string | null>(null)
const filterStatus = ref<string | null>(null)

// Toast / Modal refs
const toastRef = ref<HTMLElement | null>(null)
const editModalRef = ref<HTMLElement | null>(null)
let toastInstance: Toast
let editModal: Modal

// Edit form
interface EditForm { id?: number; name: string; email: string; password: string; role: string; status?: string }
const editForm = ref<EditForm>({ name: '', email: '', password: '', role: 'USER', status: 'PENDING' })
const isSubmitting = ref(false)

// Dropdown
const openDropdownId = ref<number | null>(null)

// Confirm modal
const isConfirmOpen = ref(false)
const confirmMessage = ref('')
let resolveConfirm: (v: boolean) => void = () => { }

const toastMessage = ref('')

const router = useRouter()

// ── Computed ───────────────────────────────────────────────────────────────────
const roleOptions = computed(() => {
  const set = new Set<string>()
  allUsers.value.forEach(u => set.add(u.role))
  return Array.from(set).sort()
})

const statusOptions = computed(() => {
  const set = new Set<string>()
  allUsers.value.forEach(u => set.add(u.status))
  return Array.from(set).sort()
})

const filteredPending = computed(() => applyFilters(pending.value))
const filteredApproved = computed(() => applyFilters(approved.value))

function applyFilters(list: User[]) {
  return list.filter(u => {
    const member = !filterMember.value ||
      u.name.toLowerCase().includes(filterMember.value.toLowerCase()) ||
      u.email.toLowerCase().includes(filterMember.value.toLowerCase())
    const role = filterRole.value === null || u.role === filterRole.value
    const status = filterStatus.value === null || u.status === filterStatus.value
    return member && role && status
  })
}

const resetFilters = () => {
  filterMember.value = ''
  filterRole.value = null
  filterStatus.value = null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN')

// Toast
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

// Confirm
const showConfirm = (msg: string): Promise<boolean> => {
  return new Promise<boolean>(resolve => {
    confirmMessage.value = msg
    isConfirmOpen.value = true
    resolveConfirm = v => {
      isConfirmOpen.value = false
      resolve(v)
    }
  })
}

// ── API ───────────────────────────────────────────────────────────────────────
const loadUsers = async () => {
  try {
    const { data } = await api.get<User[]>('/admin-users')
    allUsers.value = data
    pending.value = data.filter(u => u.status === 'PENDING')
    approved.value = data.filter(u => u.status !== 'PENDING')
  } catch {
    showToast('Failed to load users', false)
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────
const approveUser = async (id: number) => {
  try {
    await api.patch(`/admin-users/approve/${id}`)
    showToast('User approved')
    await loadUsers()
  } catch {
    showToast('Approve failed', false)
  }
}
const rejectUser = async (id: number) => {
  const ok = await showConfirm('Reject this user?')
  if (!ok) return
  try {
    await api.patch(`/admin-users/reject/${id}`)
    showToast('User rejected')
    await loadUsers()
  } catch {
    showToast('Reject failed', false)
  }
}
const deleteUser = async (id: number) => {
  const ok = await showConfirm('Delete this user? This action cannot be undone.')
  if (!ok) return
  try {
    await api.delete(`/admin-users/${id}`)
    showToast('User deleted')
    await loadUsers()
  } catch {
    showToast('Delete failed', false)
  }
}

// Login as / Impersonation
const loginAsUser = async (userId: number) => {
  const ok = await showConfirm('Login as this user? This will replace your current session token.')
  if (!ok) return

  try {
    // call impersonation API (admin-only)
    const { data } = await api.post(`/admin-users/impersonate/${userId}`)

    // store the returned token & user info (replaces current admin token)
    if (data?.token && data?.user) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.user.role)
      localStorage.setItem('name', data.user.name)

      showToast(`Now logged in as ${data.user.name}`)

      // Optional: redirect to user dashboard (home)
      setTimeout(() => {
        router.push('/') // go to user area
      }, 800)
    } else {
      showToast('Invalid server response', false)
    }
  } catch (err: any) {
    console.error(err)
    // If unauthorized, clear local and force login
    if (err.response?.status === 401) {
      localStorage.clear()
      showToast('Session expired. Please log in.', false)
      setTimeout(() => router.push('/login'), 800)
      return
    }
    showToast('Failed to impersonate user', false)
  }
}

// ── Edit / Create Modal ───────────────────────────────────────────────────────
const openEditModal = (user?: User) => {
  if (user) {
    editForm.value = { id: user.id, name: user.name, email: user.email, password: '', role: user.role, status: user.status }
  } else {
    editForm.value = { name: '', email: '', password: '', role: 'USER', status: 'PENDING' }
  }
  editModal?.show()
}
const closeEditModal = () => {
  editModal?.hide()
  editForm.value = { name: '', email: '', password: '', role: 'USER', status: 'PENDING' }
}
const saveUser = async () => {
  if (!editForm.value.name || !editForm.value.email || (!editForm.value.id && !editForm.value.password)) return
  isSubmitting.value = true
  try {
    if (editForm.value.id) {
      await api.patch(`/admin-users/${editForm.value.id}`, editForm.value)
      showToast('User updated')
    } else {
      await api.post('/admin-users', editForm.value)
      showToast('User created')
    }
    closeEditModal()
    await loadUsers()
  } catch {
    showToast('Save failed', false)
  } finally {
    isSubmitting.value = false
  }
}

// ── Dropdown ───────────────────────────────────────────────────────────────────
const toggleDropdown = (id: number) => {
  openDropdownId.value = openDropdownId.value === id ? null : id
}
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  if (editModalRef.value) editModal = new Modal(editModalRef.value)
  document.addEventListener('click', handleClickOutside)
  await loadUsers()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

/* Dropdown */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu-custom {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid #ddd;
  border-radius: .5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .1);
  z-index: 2000;
  min-width: 140px;
}

.dropdown-item-custom {
  display: block;
  padding: .5rem 1rem;
  color: #333;
  font-size: .9rem;
}

.dropdown-item-custom:hover {
  background: #f8f9fa;
}

.btn-sm.border-0 {
  font-size: 1.3rem;
  line-height: 1;
  padding: 0 .4rem;
}

/* Modal */
.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.card-body {
  overflow: visible !important;
}

/* warning button */
.btn-warning {
  background-color: #ffc107;
  border: none;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
}
</style>
