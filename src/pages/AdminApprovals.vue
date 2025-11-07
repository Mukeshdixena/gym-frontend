<template>
  <div class="members-container">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="font-size: 1.5rem;">Admin – User Management</h2>
        <p class="text-muted small mb-0">Approve, edit, and manage all gym users.</p>
      </div>
      <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" @click="openEditModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 1v14m7-7H1" />
        </svg>
        + New User
      </button>
    </div>

    <!-- Filter Bar (Sticky) -->
    <div class="filter-bar">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <div v-for="(value, key) in activeFilters" :key="key"
          class="filter-chip d-flex align-items-center gap-1 px-2 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M6 10a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 10zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 7zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 4z" />
          </svg>
          <strong>{{ filterLabels[key as unknown as string] }}:</strong>
          {{ formatFilterValue(key as unknown as string, value) }}
          <button @click="clearFilter(key as unknown as string)" class="btn-close btn-close-sm"></button>

        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
      <div class="mt-2 text-muted">Loading users...</div>
    </div>

    <!-- Table -->
    <div v-else class="table-responsive rounded-3 overflow-hidden">
      <div class="table-scroll-container">
        <div class="table-container border rounded-3">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
              <tr>
                <th>#</th>
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.name }">Name</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.name" v-model.trim="filters.name" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="Name"
                        @blur="handleBlur('name')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.name }"
                      @click.stop="toggleFilter('name')">
                      <template v-if="columnFilters.name">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.708-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.email }">Email</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.email" v-model.trim="filters.email" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="Email"
                        @blur="handleBlur('email')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.email }"
                      @click.stop="toggleFilter('email')">
                      <template v-if="columnFilters.email">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.708-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.role }">Role</span>
                    <transition name="fade-slide">
                      <select v-if="columnFilters.role" v-model="filters.role" @change="debouncedResetPageAndLoad"
                        class="form-select form-select-sm filter-input" @blur="handleBlur('role')">
                        <option value="">All</option>
                        <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
                      </select>
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.role }"
                      @click.stop="toggleFilter('role')">
                      <template v-if="columnFilters.role">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.708-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M6 10a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 10zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 7zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 4z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>
                <th>Registered</th>
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.status }">Status</span>
                    <transition name="fade-slide">
                      <select v-if="columnFilters.status" v-model="filters.status" @change="debouncedResetPageAndLoad"
                        class="form-select form-select-sm filter-input" @blur="handleBlur('status')">
                        <option value="">All</option>
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.status }"
                      @click.stop="toggleFilter('status')">
                      <template v-if="columnFilters.status">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.708-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M6 10a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 10zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 7zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 4z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, i) in paginatedUsers" :key="u.id">
                <td class="small text-muted">{{ (meta.page - 1) * Number(meta.limit) + i + 1 }}</td>
                <td class="fw-semibold">{{ u.name }}</td>
                <td class="small text-muted">{{ u.email }}</td>
                <td><span class="badge bg-secondary text-white">{{ u.role }}</span></td>
                <td class="small">{{ formatDate(u.createdAt) }}</td>
                <td>
                  <span class="status-badge" :class="{
                    'status-warning': u.status === 'PENDING',
                    'status-success': u.status === 'APPROVED',
                    'status-danger': u.status === 'REJECTED'
                  }">
                    {{ u.status }}
                  </span>
                </td>
                <td class="text-center" @click.stop>
                  <div class="d-flex justify-content-center gap-2">
                    <!-- Approve / Reject for PENDING -->
                    <template v-if="u.status === 'PENDING'">
                      <button class="icon-btn text-success" title="Approve" @click="approveUser(u.id)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                        </svg>
                      </button>
                      <button class="icon-btn text-danger" title="Reject" @click="rejectUser(u.id)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                      </button>
                    </template>

                    <button class="icon-btn" title="Edit" @click="openEditModal(u)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M12.146.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708L4.207 13.5 2 14l.5-2.207L12.146.146zM11.207 2L3 10.207V12h1.793L13 3.793 11.207 2z" />
                      </svg>
                    </button>

                    <button class="icon-btn text-danger" title="Delete" @click="deleteUser(u.id)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path d="M5.5 5.5v7h1v-7h-1zm3 0v7h1v-7h-1z" />
                        <path fill-rule="evenodd"
                          d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2.5a1 1 0 1 1 0-2H5l.5-1h5l.5 1h2.5a1 1 0 0 1 1 1z" />
                      </svg>
                    </button>

                    <button class="icon-btn text-warning" title="Login as User" @click="loginAsUser(u.id)"
                      :disabled="u.status !== 'APPROVED'">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path fill-rule="evenodd"
                          d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z" />
                        <path fill-rule="evenodd"
                          d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!paginatedUsers.length">
                <td colspan="7" class="text-center text-muted py-5">No users found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Footer -->
      <footer class="pagination-footer">
        <div class="d-flex justify-content-between align-items-center small text-muted w-100">
          <div class="d-flex align-items-center gap-2">
            <span>
              Showing {{ (meta.page - 1) * Number(meta.limit) + 1 }} to
              {{ Math.min(meta.page * Number(meta.limit), meta.total) }} of {{ meta.total }} users
            </span>
            <div class="d-flex align-items-center ms-3">
              <label class="me-1">Rows per page:</label>
              <select v-model.number="pagination.limit" @change="debouncedResetPageAndLoad"
                class="form-select form-select-sm w-auto">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
          </div>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: meta.page <= 1 }">
                <a class="page-link" href="#" @click.prevent="goToPage(meta.page - 1)">Previous</a>
              </li>
              <li v-for="p in visiblePages" :key="p" class="page-item" :class="{ active: p === meta.page }">
                <a class="page-link" href="#" @click.prevent="goToPage(p)">{{ p }}</a>
              </li>
              <li class="page-item" :class="{ disabled: meta.page >= meta.totalPages }">
                <a class="page-link" href="#" @click.prevent="goToPage(meta.page + 1)">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>

    <!-- Edit / Create Modal -->
    <div class="modal fade" ref="editModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editForm.id ? 'Edit User' : 'Create New User' }}</h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>Name</strong></label>
                  <input v-model.trim="editForm.name" type="text" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Email</strong></label>
                  <input v-model.trim="editForm.email" type="email" class="form-control" required />
                </div>
                <div class="col-md-6" v-if="!editForm.id">
                  <label class="form-label"><strong>Password</strong></label>
                  <input v-model="editForm.password" type="password" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Role</strong></label>
                  <select v-model="editForm.role" class="form-select">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Status</strong></label>
                  <select v-model="editForm.status" class="form-select">
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
              <div class="d-grid gap-2 mt-4">
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Saving…' : 'Save User' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
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

const router = useRouter()

// ---------------------------------------------------------------------
// Types
interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}
interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ---------------------------------------------------------------------
// State
const allUsers = ref<User[]>([])
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)

const toastRef = ref<HTMLElement | null>(null)
const editModalRef = ref<HTMLElement | null>(null)
let toastInstance: Toast
let editModal: Modal

const toastMessage = ref('')
const editForm = ref<any>({ name: '', email: '', password: '', role: 'USER', status: 'PENDING' })
const isSubmitting = ref(false)

const filters = ref({ name: '', email: '', role: '', status: '' })
const columnFilters = ref({ name: false, email: false, role: false, status: false })
const pagination = ref({ page: 1, limit: 10 })

const filterLabels: Record<string, string> = { name: 'Name', email: 'Email', role: 'Role', status: 'Status' }

// ---------------------------------------------------------------------
// Computed
const activeFilters = computed(() => {
  const active: any = {}
  Object.entries(filters.value).forEach(([k, v]) => { if (v) active[k] = v })
  return active
})
const formatFilterValue = (key: string, value: string) => value

const roleOptions = computed(() => [...new Set(allUsers.value.map(u => u.role))].sort())

const visiblePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  for (let i = Math.max(2, meta.value.page - delta); i <= Math.min(meta.value.totalPages - 1, meta.value.page + delta); i++) range.push(i)
  if (meta.value.page - delta > 2) range.unshift('...')
  if (meta.value.page + delta < meta.value.totalPages - 1) range.push('...')
  range.unshift(1)
  if (meta.value.totalPages > 1) range.push(meta.value.totalPages)
  return range
})

const filteredUsers = computed(() => {
  return allUsers.value.filter(u => {
    const name = !filters.value.name || u.name.toLowerCase().includes(filters.value.name.toLowerCase())
    const email = !filters.value.email || u.email.toLowerCase().includes(filters.value.email.toLowerCase())
    const role = !filters.value.role || u.role === filters.value.role
    const status = !filters.value.status || u.status === filters.value.status
    return name && email && role && status
  })
})

const paginatedUsers = computed(() => {
  const start = (meta.value.page - 1) * Number(meta.value.limit)
  const end = start + Number(meta.value.limit)
  return filteredUsers.value.slice(start, end)
})

// ---------------------------------------------------------------------
// Helpers
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN')

const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

const buildQuery = () => ({
  ...filters.value,
  page: pagination.value.page,
  limit: pagination.value.limit
})

// ---------------------------------------------------------------------
// Pagination & Load
const resetPageAndLoad = () => { pagination.value.page = 1; loadUsers() }
const goToPage = (page: number | string) => {
  if (typeof page !== 'number') return
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadUsers()
}
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 800): T {
  let timeout: any
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }) as T
}
const debouncedResetPageAndLoad = debounce(resetPageAndLoad, 800)

// ---------------------------------------------------------------------
// API
const loadUsers = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get<User[]>('/admin-users', { params: buildQuery() })
    allUsers.value = data
    meta.value = {
      total: data.length,
      page: pagination.value.page,
      limit: pagination.value.limit,
      totalPages: Math.ceil(data.length / pagination.value.limit)
    }
  } catch {
    showToast('Failed to load users', false)
  } finally {
    isLoading.value = false
  }
}

// ---------------------------------------------------------------------
// Actions
const openEditModal = (user?: User) => {
  editForm.value = user
    ? { ...user, password: '' }
    : { name: '', email: '', password: '', role: 'USER', status: 'PENDING' }
  editModal?.show()
}
const closeEditModal = () => editModal?.hide()

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

const approveUser = async (id: number) => {
  try {
    await api.patch(`/admin-users/approve/${id}`)
    showToast('User approved')
    await loadUsers()
  } catch { showToast('Approve failed', false) }
}
const rejectUser = async (id: number) => {
  if (!await showConfirm('Reject this user?')) return
  try {
    await api.patch(`/admin-users/reject/${id}`)
    showToast('User rejected')
    await loadUsers()
  } catch { showToast('Reject failed', false) }
}
const deleteUser = async (id: number) => {
  if (!await showConfirm('Delete this user? This action cannot be undone.')) return
  try {
    await api.delete(`/admin-users/${id}`)
    showToast('User deleted')
    await loadUsers()
  } catch { showToast('Delete failed', false) }
}
const loginAsUser = async (userId: number) => {
  if (!await showConfirm('Login as this user? This will replace your current session.')) return
  try {
    const { data } = await api.post(`/admin-users/impersonate/${userId}`)
    if (data?.token && data?.user) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.user.role)
      localStorage.setItem('name', data.user.name)
      showToast(`Now logged in as ${data.user.name}`)
      setTimeout(() => router.push('/'), 800)
    }
  } catch (err: any) {
    if (err.response?.status === 401) { localStorage.clear(); router.push('/login') }
    showToast('Failed to impersonate', false)
  }
}

// ---------------------------------------------------------------------
// Confirm modal
const isConfirmOpen = ref(false)
const confirmMessage = ref('')
let resolveConfirm: (v: boolean) => void = () => { }
const showConfirm = (msg: string): Promise<boolean> => new Promise(resolve => {
  confirmMessage.value = msg
  isConfirmOpen.value = true
  resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) }
})

// ---------------------------------------------------------------------
// Filter helpers
const clearFilter = (key: string) => {
  ; (filters.value as any)[key] = ''
    ; (columnFilters.value as any)[key] = false
  resetPageAndLoad()
}
const toggleFilter = (key: string) => {
  ; (columnFilters.value as any)[key] = !(columnFilters.value as any)[key]
  if (!(columnFilters.value as any)[key]) (filters.value as any)[key] = ''
}
const handleBlur = (key: string) => {
  if (!(filters.value as any)[key]) (columnFilters.value as any)[key] = false
}

// ---------------------------------------------------------------------
// Lifecycle
onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  if (editModalRef.value) editModal = new Modal(editModalRef.value)
  await loadUsers()
})
</script>

<style scoped>
/* ---- SAME STYLES AS MEMBERS ---- */
.members-container {
  padding: 1.5rem;
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
}

.filter-bar {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 15;
  padding: 0.75rem 0;
  border-bottom: 1px solid #dee2e6;
  backdrop-filter: blur(4px);
}

.filter-chip {
  background: #e9ecef;
  border-radius: 1rem;
  font-size: .8rem;
  color: #495057;
}

.filter-chip .btn-close {
  opacity: .7;
}

.filter-chip .btn-close:hover {
  opacity: 1;
}

.table {
  --bs-table-hover-bg: #f1f5f9;
  margin-bottom: 0;
}

.table thead th {
  font-weight: 600;
  font-size: .85rem;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: #6c757d;
  border-bottom: 1px solid #dee2e6;
  padding: .75rem 1rem;
}

.table tbody td {
  padding: .75rem 1rem;
  font-size: .925rem;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: var(--bs-table-hover-bg);
}

.status-badge {
  font-size: .75rem;
  font-weight: 600;
  padding: .25rem .6rem;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}

.status-danger {
  background: #fee2e2;
  color: #991b1b;
}

.icon-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s;
}

.icon-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.icon-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.pagination .page-link {
  color: #495057;
  border-radius: 6px;
  padding: .35rem .65rem;
  font-size: .875rem;
}

.pagination .page-item.active .page-link {
  background: #4361ee;
  border-color: #4361ee;
  color: white;
}

.table-container {
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  background: white;
}

.pagination-footer {
  position: fixed;
  bottom: 10px;
  left: 240px;
  right: 0;
  background: #fff;
  padding: .65rem 1rem;
  z-index: 1040;
  display: flex;
  justify-content: center;
}

.pagination-footer>div {
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-header {
  position: relative;
  white-space: nowrap;
  min-width: 140px;
}

.filter-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: .4rem;
}

.header-label {
  font-weight: 600;
  font-size: .85rem;
  color: #495057;
  transition: opacity .2s ease;
}

.header-label.hidden {
  opacity: 0;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  max-width: 120px;
  opacity: 1;
  transition: all .3s ease;
  padding: .15rem .4rem;
}

.filter-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color .2s;
}

.filter-btn:hover,
.filter-btn.active {
  color: #4361ee;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all .25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

@media (max-width: 768px) {
  .pagination-footer {
    left: 0;
    padding: .5rem;
  }
}
</style>