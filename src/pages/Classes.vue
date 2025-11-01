<template>
  <div class="container mt-4">
    <h3 class="mb-4">Classes Management</h3>

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

    <!-- Search & Add -->
    <div class="row g-3 mb-3">
      <div class="col-md-5">
        <input type="text" class="form-control form-control-sm" placeholder="Search by class name or trainer"
          v-model="searchTerm" />
      </div>
      <div class="col-md-7 text-end">
        <button class="btn btn-primary btn-sm" @click="openAddModal" :disabled="isLoading">
          Add Class
        </button>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading classes and trainers...</p>
    </div>

    <!-- Classes Table -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Classes</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Class Name</th>
              <th>Trainer</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(cls, i) in filteredClasses" :key="cls.id">
              <td>{{ i + 1 }}</td>
              <td>{{ cls.name }}</td>
              <td>
                {{ cls.trainer?.firstName }} {{ cls.trainer?.lastName }}
              </td>
              <td>{{ formatDateTime(cls.startTime) }}</td>
              <td>{{ formatDateTime(cls.endTime) }}</td>
              <td class="text-center">
                <div class="dropdown" @click.stop="toggleDropdown(cls.id)">
                  <button class="btn btn-light btn-sm border-0">...</button>
                  <div v-if="openDropdownId === cls.id" class="dropdown-menu-custom shadow-sm">
                    <a href="javascript:void(0)" @click="editClass(cls)" class="dropdown-item-custom">Edit</a>
                    <a href="javascript:void(0)" @click="confirmDelete(cls.id)" class="dropdown-item-custom text-danger">
                      Delete
                    </a>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="filteredClasses.length === 0">
              <td colspan="6" class="text-center text-muted py-4">No classes found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingClass ? 'Edit Class' : 'Add New Class' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="mb-3">
                <label class="form-label"><strong>Class Name</strong></label>
                <input v-model="form.name" type="text" class="form-control" required
                  placeholder="e.g., Yoga Flow" :disabled="isSubmitting" />
              </div>

              <div class="mb-3">
                <label class="form-label"><strong>Trainer</strong></label>
                <select v-model="form.trainerId" class="form-select" required :disabled="isSubmitting">
                  <option :value="null" disabled>Select Trainer</option>
                  <option v-for="t in trainers" :key="t.id" :value="t.id">
                    {{ t.firstName }} {{ t.lastName }}
                  </option>
                </select>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>Start Time</strong></label>
                  <input v-model="form.startTime" type="datetime-local" class="form-control" required
                    :disabled="isSubmitting" :min="minDateTime" />
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>End Time</strong></label>
                  <input v-model="form.endTime" type="datetime-local" class="form-control" required
                    :disabled="isSubmitting" :min="form.startTime || minDateTime" />
                  <small v-if="form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)"
                    class="text-danger d-block mt-1">
                    End time must be after start time
                  </small>
                </div>
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="saveClass"
                  :disabled="isSubmitting || !isFormValid">
                  {{ isSubmitting ? 'Saving...' : (editingClass ? 'Update Class' : 'Add Class') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- SMALL CONFIRM MODAL -->
    <div class="modal fade" :class="{ show: isConfirmOpen }" tabindex="-1" style="display: block;" v-if="isConfirmOpen"
      @click.self="resolveConfirm(false)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-2">
            <h5 class="modal-title fs-6">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="resolveConfirm(false)"></button>
          </div>
          <div class="modal-body pt-2 pb-3">{{ confirmMessage }}</div>
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

// ──────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────
interface Trainer {
  id: number
  firstName: string
  lastName: string
}

interface GymClass {
  id: number
  name: string
  startTime: string
  endTime: string
  trainerId: number
  trainer?: Trainer
}

// ──────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────
const classes = ref<GymClass[]>([])
const trainers = ref<Trainer[]>([])
const searchTerm = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)

const toastRef = ref<HTMLElement | null>(null)
const modalRef = ref<HTMLElement | null>(null)

let modal: Modal
let toastInstance: Toast

const editingClass = ref<GymClass | null>(null)

const form = ref({
  id: 0,
  name: '',
  startTime: '',
  endTime: '',
  trainerId: null as number | null,
})

const toastMessage = ref('')

// ──────────────────────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────────────────────
const filteredClasses = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  if (!term) return classes.value

  return classes.value.filter((c) => {
    const trainerName = `${c.trainer?.firstName ?? ''} ${c.trainer?.lastName ?? ''}`.toLowerCase()
    return c.name.toLowerCase().includes(term) || trainerName.includes(term)
  })
})

const isFormValid = computed(() => {
  if (!form.value.name || !form.value.trainerId) return false
  if (!form.value.startTime || !form.value.endTime) return false
  const start = new Date(form.value.startTime)
  const end = new Date(form.value.endTime)
  return end > start
})

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

// ──────────────────────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────────────────────
const showToast = (message: string, isSuccess = true) => {
  toastMessage.value = message
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${isSuccess ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === message) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

// ──────────────────────────────────────────────────────────────
// API
// ──────────────────────────────────────────────────────────────
const fetchClasses = async () => {
  try {
    const res: AxiosResponse<GymClass[]> = await api.get('/classes')
    classes.value = Array.isArray(res.data) ? res.data : []
  } catch (err: any) {
    console.error('Fetch classes error:', err)
    showToast('Failed to load classes.', false)
  }
}

const fetchTrainers = async () => {
  try {
    const res: AxiosResponse<Trainer[]> = await api.get('/trainers')
    trainers.value = Array.isArray(res.data) ? res.data : []
  } catch (err: any) {
    console.error('Fetch trainers error:', err)
    showToast('Failed to load trainers.', false)
  }
}

const createClass = async () => {
  const payload = {
    name: form.value.name,
    trainerId: form.value.trainerId,
    startTime: new Date(form.value.startTime).toISOString(),
    endTime: new Date(form.value.endTime).toISOString(),
  }

  await api.post('/classes', payload)
  await fetchClasses()
  showToast('Class added successfully!')
}

const updateClass = async (id: number) => {
  const payload = {
    name: form.value.name,
    trainerId: form.value.trainerId,
    startTime: new Date(form.value.startTime).toISOString(),
    endTime: new Date(form.value.endTime).toISOString(),
  }

  await api.put(`/classes/${id}`, payload)
  await fetchClasses()
  showToast('Class updated successfully!')
}

// ──────────────────────────────────────────────────────────────
// Modals
// ──────────────────────────────────────────────────────────────
const openAddModal = () => {
  editingClass.value = null
  form.value = {
    id: 0,
    name: '',
    startTime: '',
    endTime: '',
    trainerId: null,
  }
  modal?.show()
}

const editClass = (cls: GymClass) => {
  editingClass.value = cls
  form.value = {
    id: cls.id,
    name: cls.name,
    startTime: cls.startTime.slice(0, 16),
    endTime: cls.endTime.slice(0, 16),
    trainerId: cls.trainerId,
  }
  modal?.show()
}

const closeModal = () => {
  modal?.hide()
  editingClass.value = null
}

const saveClass = async () => {
  if (!isFormValid.value) return
  isSubmitting.value = true

  try {
    if (editingClass.value) {
      await updateClass(editingClass.value.id)
    } else {
      await createClass()
    }
    closeModal()
  } catch (err: any) {
    console.error(err)
    showToast(err.response?.data?.message || 'Operation failed.', false)
  } finally {
    isSubmitting.value = false
  }
}

// ──────────────────────────────────────────────────────────────
// Delete with Confirm
// ──────────────────────────────────────────────────────────────
let deleteIdToConfirm = 0
const confirmDelete = async (id: number) => {
  deleteIdToConfirm = id
  const ok = await showConfirm('Are you sure you want to delete this class?')
  if (!ok) return

  try {
    await api.delete(`/classes/${deleteIdToConfirm}`)
    await fetchClasses()
    showToast('Class deleted.')
  } catch (err: any) {
    showToast('Failed to delete class.', false)
  }
}

// ──────────────────────────────────────────────────────────────
// Dropdown
// ──────────────────────────────────────────────────────────────
const openDropdownId = ref<number | null>(null)
const toggleDropdown = (id: number) => {
  openDropdownId.value = openDropdownId.value === id ? null : id
}
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null
}

// ──────────────────────────────────────────────────────────────
// Confirm Modal
// ──────────────────────────────────────────────────────────────
const isConfirmOpen = ref(false)
const confirmMessage = ref('')
let resolveConfirm: (v: boolean) => void = () => { }
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

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

// ──────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────
onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)

  document.addEventListener('click', handleClickOutside)

  await Promise.all([fetchTrainers(), fetchClasses()])
  isLoading.value = false
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
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .1);
  z-index: 2000;
  min-width: 160px;
}

.dropdown-item-custom {
  display: block;
  padding: 8px 12px;
  color: #333;
  text-decoration: none;
  font-size: .9rem;
}

.dropdown-item-custom:hover {
  background: #f8f9fa;
}

.dropdown-item-custom.text-danger {
  color: #dc3545 !important;
}

.btn-sm.border-0 {
  font-size: 1.3rem;
  line-height: 1;
  padding: 0 .4rem;
}

.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.toast {
  min-width: 280px;
}

.modal-sm .modal-content {
  border-radius: .5rem;
}

input[readonly],
.form-control-plaintext {
  background-color: #f8f9fa !important;
}
</style>