<template>
  <div class="members-container">
    <!-- Top Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div style="width:100%;">
        <h2 class="fw-bold mb-1" style="font-size: 1.5rem;">Training Classes</h2>
        <p class="text-muted small mb-0">Manage add-ons and training programs such as PT, Yoga, Zumba, Dance.</p>
      </div>

      <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" @click="openAddModal">
        <i class="bi bi-plus-circle"></i> Classes
      </button>
    </div>

    <!-- Filter Bar (Sticky) -->
    <div class="filter-bar">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <div v-for="(value, key) in activeFilters" :key="key"
          class="filter-chip d-flex align-items-center gap-1 px-2 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.5 2.5A.5.5 0 0 1 3 2h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-1z" />
            <path d="M3 5h10v1H3z" />
          </svg>
          <strong>{{ filterLabels[key] }}:</strong> {{ value }}
          <button @click="clearFilter(key)" class="btn-close btn-close-sm"></button>
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
      <div class="mt-2 text-muted">Loading classes...</div>
    </div>

    <!-- Table Container -->
    <div v-else class="table-responsive rounded-3 overflow-hidden">
      <div class="table-scroll-container">
        <div class="table-container border rounded-3">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
              <tr>
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.id }">ID</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.id" v-model.trim="filters.id" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="ID"
                        @blur="handleBlur('id')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.id }" @click.stop="toggleFilter('id')">
                      <template v-if="columnFilters.id">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
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
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
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
                <th>Description</th>
                <th>Price</th>
                <th>Duration</th>
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.status }">Status</span>
                    <transition name="fade-slide">
                      <select v-if="columnFilters.status" v-model="filters.status" @change="debouncedResetPageAndLoad"
                        class="form-select form-select-sm filter-input" @blur="handleBlur('status')">
                        <option value="">All</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </transition>
                    >
                    <button class="filter-btn" :class="{ active: columnFilters.status }"
                      @click.stop="toggleFilter('status')">
                      <template v-if="columnFilters.status">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
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
              <tr v-for="addon in addons" :key="addon.id">
                <td class="small text-muted">{{ addon.id }}</td>
                <td class="fw-semibold">{{ addon.name }}</td>
                <td class="small text-muted">{{ addon.description }}</td>
                <td>₹{{ addon.price }}</td>
                <td>{{ addon.durationDays }} days</td>
                <td>
                  <span class="status-badge" :class="addon.isActive ? 'status-success' : 'status-secondary'">
                    {{ addon.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-center" @click.stop>
                  <div class="d-flex justify-content-center gap-2">
                    <button class="icon-btn" title="Toggle Status"
                      @click.stop="toggleAddonStatus(addon.id, !addon.isActive)" :disabled="isToggling">
                      <i class="bi bi-pause-circle"></i>
                    </button>
                    <button class="icon-btn" title="Edit" @click.stop="editAddon(addon)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="icon-btn text-danger" title="Delete" @click.stop="confirmDelete(addon.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!addons.length">
                <td colspan="7" class="text-center text-muted py-5">No classes found</td>
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
              Showing {{ (meta.page - 1) * meta.limit + 1 }} to {{ Math.min(meta.page * meta.limit, meta.total) }} of {{
              meta.total }} results
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

    <!-- Add/Edit Modal -->
    <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingAddon ? 'Edit Classes' : 'Add Classes' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>Name</strong></label>
                  <input v-model.trim="form.name" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.name }" @blur="validateField('name')" required />
                  <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Description</strong></label>
                  <textarea v-model.trim="form.description" class="form-control" rows="2"
                    :class="{ 'is-invalid': errors.description }" @blur="validateField('description')"
                    required></textarea>
                  <div v-if="errors.description" class="invalid-feedback">{{ errors.description }}</div>
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label"><strong>Price (₹)</strong></label>
                  <input v-if="!editingAddon" v-model.number="form.price" type="number" min="1" class="form-control"
                    :class="{ 'is-invalid': errors.price }" @blur="validateField('price')" required />
                  <div v-else class="form-control-plaintext">₹{{ form.price }}</div>
                  <div v-if="errors.price" class="invalid-feedback">{{ errors.price }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Duration (Days)</strong></label>
                  <input v-if="!editingAddon" v-model.number="form.durationDays" type="number" min="1"
                    class="form-control" :class="{ 'is-invalid': errors.durationDays }"
                    @blur="validateField('durationDays')" required />
                  <div v-else class="form-control-plaintext">{{ form.durationDays }} days</div>
                  <div v-if="errors.durationDays" class="invalid-feedback">{{ errors.durationDays }}</div>
                </div>
              </div>

              <div class="mt-3">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="statusSwitch" v-model="form.isActive" />
                  <label class="form-check-label" for="statusSwitch">
                    {{ form.isActive ? 'Active' : 'Inactive' }}
                  </label>
                </div>
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="saveAddon"
                  :disabled="!isFormValid || isUnchanged">
                  {{ editingAddon ? 'Update Program' : 'Add Program' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete -->
    <div class="modal fade" :class="{ show: isConfirmOpen }" tabindex="-1" style="display: block;" v-if="isConfirmOpen"
      @click.self="resolveConfirm(false)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-2">
            <h5 class="modal-title fs-6">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="resolveConfirm(false)"></button>
          </div>
          <div class="modal-body pt-2 pb-3">
            Are you sure you want to delete this program?<br>
            <small class="text-muted">This action cannot be undone.</small>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="resolveConfirm(false)">Cancel</button>
            <button type="button" class="btn btn-danger btn-sm" @click="resolveConfirm(true)">Delete</button>
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
import type { AxiosResponse } from 'axios'

interface Addon {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
  isActive: boolean
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

const addons = ref<Addon[]>([])
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)
const isToggling = ref(false)

const modalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)
let modal: Modal
let toastInstance: Toast

const editingAddon = ref<Addon | null>(null)
const form = ref<Partial<Addon>>({ name: '', description: '', price: 0, durationDays: 0, isActive: true })
const originalForm = ref<Partial<Addon>>({})
const errors = ref<Record<string, string>>({})
const toastMessage = ref('')

// Filters
const filters = ref({
  id: '',
  name: '',
  status: ''
})
const columnFilters = ref({
  id: false,
  name: false,
  status: false
})
const pagination = ref({ page: 1, limit: 10 })

const filterLabels: Record<string, string> = {
  id: 'ID',
  name: 'Name',
  status: 'Status'
}

const activeFilters = computed(() => {
  const active: Partial<typeof filters.value> = {}
  Object.entries(filters.value).forEach(([k, v]) => {
    if (v) (active as any)[k] = v === 'true' ? 'Active' : v === 'false' ? 'Inactive' : v
  })
  return active
})

// Debounce
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 800): T {
  let timeout: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }) as T
}

const handleBlur = (key: string) => {
  if (!filters.value[key as keyof typeof filters.value]) {
    columnFilters.value[key as keyof typeof columnFilters.value] = false
  }
}

const clearFilter = (key: string) => {
  filters.value[key as keyof typeof filters.value] = ''
  columnFilters.value[key as keyof typeof columnFilters.value] = false
  resetPageAndLoad()
}

const toggleFilter = (key: string) => {
  columnFilters.value[key as keyof typeof columnFilters.value] = !columnFilters.value[key as keyof typeof columnFilters.value]
  if (!columnFilters.value[key as keyof typeof columnFilters.value]) filters.value[key as keyof typeof filters.value] = ''
}

const isFormValid = computed(() => {
  ;['name', 'description', 'price', 'durationDays'].forEach(validateField)
  return !!form.value.name && !!form.value.description && (form.value.price ?? 0) > 0 && (form.value.durationDays ?? 0) > 0 && !Object.values(errors.value).some(e => e)
})

const isUnchanged = computed(() => JSON.stringify(form.value) === JSON.stringify(originalForm.value))

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

const validateField = (field: string) => {
  const v = form.value[field as keyof Addon]
  switch (field) {
    case 'name': errors.value.name = v ? '' : 'Required.'; break
    case 'description': errors.value.description = v ? '' : 'Required.'; break
    case 'price': errors.value.price = !v || Number(v) <= 0 ? 'Enter valid price.' : ''; break
    case 'durationDays': errors.value.durationDays = !v || Number(v) <= 0 ? 'Enter valid days.' : ''; break
  }
}

const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

const buildQuery = () => {
  const q: any = { ...filters.value, page: pagination.value.page, limit: pagination.value.limit }
  if (filters.value.status) q.isActive = filters.value.status
  return q
}

const loadAddons = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/addons', { params: buildQuery() }) as AxiosResponse<{ data: Addon[], meta: PaginationMeta }>
    addons.value = res.data.data
    meta.value = res.data.meta
  } catch {
    showToast('Failed to load programs.', false)
  } finally {
    isLoading.value = false
  }
}

const resetPageAndLoad = () => { pagination.value.page = 1; loadAddons() }
const debouncedResetPageAndLoad = debounce(resetPageAndLoad, 800)

const goToPage = (page: number | string) => {
  if (typeof page !== 'number') return
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadAddons()
}
const openAddModal = () => {
  editingAddon.value = null
  form.value = { name: '', description: '', price: 0, durationDays: 0, isActive: true }
  originalForm.value = { ...form.value }
  errors.value = {}
  modal?.show()
}

const editAddon = (addon: Addon) => {
  editingAddon.value = addon
  form.value = { ...addon }
  originalForm.value = { ...addon }
  errors.value = {}
  modal?.show()
}

const closeModal = () => { modal?.hide(); editingAddon.value = null }

const saveAddon = async () => {
  if (!isFormValid.value) return showToast('Fill all fields.', false)
  const payload: any = {
    name: form.value.name!.trim(),
    description: form.value.description!.trim(),
    isActive: form.value.isActive ?? true
  }
  if (!editingAddon.value) {
    payload.price = form.value.price!
    payload.durationDays = form.value.durationDays!
  }
  try {
    if (editingAddon.value) {
      await api.patch(`/addons/${editingAddon.value.id}`, payload)
      showToast('Updated!')
    } else {
      const res = await api.post('/addons', payload)
      addons.value.unshift(res.data.data)
      showToast('Added!')
    }
    await loadAddons(); closeModal()
  } catch { showToast('Save failed.', false) }
}

const toggleAddonStatus = async (id: number, status: boolean) => {
  isToggling.value = true
  try {
    await api.patch(`/addons/${id}`, { isActive: status })
    const addon = addons.value.find(a => a.id === id)
    if (addon) addon.isActive = status
    showToast(`Marked as ${status ? 'Active' : 'Inactive'}`)
  } catch {
    showToast('Update failed.', false)
  } finally {
    isToggling.value = false
  }
}

const isConfirmOpen = ref(false)
let resolveConfirm: (v: boolean) => void = () => { }
const showConfirm = (): Promise<boolean> => new Promise(resolve => {
  isConfirmOpen.value = true
  resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) }
})

const confirmDelete = async (id: number) => {
  if (await showConfirm()) {
    try {
      await api.delete(`/addons/${id}`)
      addons.value = addons.value.filter(a => a.id !== id)
      showToast('Deleted!')
      if (addons.value.length === 0 && meta.value.page > 1) goToPage(meta.value.page - 1)
    } catch { showToast('Delete failed.', false) }
  }
}

onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await loadAddons()
})
</script>

<style scoped>

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
  font-size: 0.8rem;
  color: #495057;
}

.filter-chip .btn-close {
  opacity: 0.7;
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
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6c757d;
  border-bottom: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
}

.table tbody td {
  padding: 0.75rem 1rem;
  font-size: 0.925rem;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: var(--bs-table-hover-bg);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-secondary {
  background: #e5e7eb;
  color: #4b5563;
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
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.sticky-top {
  position: sticky;
  top: 0;
  background: #f8f9fa;
}

.pagination .page-link {
  color: #495057;
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.875rem;
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
  padding: 0.65rem 1rem;
  z-index: 1040;
  display: flex;
  justify-content: center;
  align-items: center;
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
  gap: 0.4rem;
}

.header-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #495057;
  transition: opacity 0.2s ease;
}

.header-label.hidden {
  opacity: 0;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  max-width: 120px;
  opacity: 1;
  transition: all 0.3s ease;
  padding: 0.15rem 0.4rem;
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
  transition: color 0.2s;
}

.filter-btn:hover,
.filter-btn.active {
  color: #4361ee;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

/* Responsive Adjustments */
@media (max-width: 992px) {
  .members-container {
    padding: 1rem;
  }

  /* Stack Header Buttons */
  .justify-content-between.align-items-center.mb-4 {
    flex-direction: column;
    gap: 0.75rem;
  }


  /* Filters Stack */
  .filter-bar .d-flex {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .pagination-footer {
    left: 0;
    padding: 0.5rem;
  }
}
</style>