<template>
  <div class="container mt-4">
    <h3 class="mb-4">Trainers Management</h3>

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
        <input type="text" class="form-control form-control-sm" placeholder="Search by name or email"
          v-model="searchTerm" :disabled="isLoading" />
      </div>
      <div class="col-md-7 text-end">
        <button class="btn btn-primary btn-sm" @click="openAddModal" :disabled="isLoading">
          Add Trainer
        </button>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading trainers...</p>
    </div>

    <!-- Trainers Table -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Trainers</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Speciality</th>
              <th>Classes</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(trainer, i) in filteredTrainers" :key="trainer.id">
              <tr>
                <td>{{ i + 1 }}</td>
                <td>{{ trainer.firstName }} {{ trainer.lastName }}</td>
                <td>{{ trainer.email }}</td>
                <td>{{ trainer.phone }}</td>
                <td>
                  <span class="badge bg-info text-dark" v-if="trainer.speciality">
                    {{ trainer.speciality }}
                  </span>
                  <span class="text-muted" v-else>—</span>
                </td>
                <td>{{ trainer.classes?.length ?? 0 }}</td>
                <td class="text-center" @click.stop>
                  <div class="dropdown" @click.stop="toggleDropdown(trainer.id)">
                    <button class="btn btn-light btn-sm border-0">...</button>
                    <div v-if="openDropdownId === trainer.id" class="dropdown-menu-custom shadow-sm">
                      <a href="javascript:void(0)" @click="editTrainer(trainer)" class="dropdown-item-custom">Edit</a>
                      <a href="javascript:void(0)" @click="confirmDelete(trainer)"
                        class="dropdown-item-custom text-danger">
                        Delete
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="filteredTrainers.length === 0">
              <td colspan="7" class="text-center text-muted py-4">No trainers found</td>
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
            <h5 class="modal-title">
              {{ editingTrainer ? 'Edit Trainer' : 'Add New Trainer' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>First Name</strong></label>
                  <input v-model.trim="form.firstName" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.firstName }" @blur="validateField('firstName')" required
                    :disabled="isSubmitting" />
                  <div v-if="errors.firstName" class="invalid-feedback">{{ errors.firstName }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Last Name</strong></label>
                  <input v-model.trim="form.lastName" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.lastName }" @blur="validateField('lastName')" required
                    :disabled="isSubmitting" />
                  <div v-if="errors.lastName" class="invalid-feedback">{{ errors.lastName }}</div>
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label"><strong>Email</strong></label>
                  <input v-model.trim="form.email" type="email" class="form-control"
                    :class="{ 'is-invalid': errors.email }" @blur="validateField('email')" required
                    :disabled="isSubmitting" />
                  <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Phone</strong></label>
                  <input v-model.trim="form.phone" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.phone }" @blur="validateField('phone')" required
                    :disabled="isSubmitting" />
                  <div v-if="errors.phone" class="invalid-feedback">{{ errors.phone }}</div>
                </div>
              </div>

              <div class="mt-3">
                <label class="form-label">Speciality (Optional)</label>
                <input v-model.trim="form.speciality" type="text" class="form-control"
                  placeholder="e.g., Yoga, Zumba, Strength Training" :disabled="isSubmitting" />
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="saveTrainer"
                  :disabled="!isFormValid || isSubmitting">
                  <span v-if="isSubmitting" class="d-flex align-items-center justify-content-center">
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                    {{ editingTrainer ? 'Updating...' : 'Adding...' }}
                  </span>
                  <span v-else>
                    {{ editingTrainer ? 'Update Trainer' : 'Add Trainer' }}
                  </span>
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
          <div class="modal-body pt-2 pb-3">
            Delete <strong>{{ trainerToDelete?.firstName }} {{ trainerToDelete?.lastName }}</strong> permanently?
            <br><small class="text-muted">This action cannot be undone.</small>
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

// ──────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────
interface GymClass {
  id: number
  name: string
  startTime: string
  endTime: string
}

interface Trainer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  speciality?: string
  classes?: GymClass[]
}

// ──────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────
const trainers = ref<Trainer[]>([])
const searchTerm = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)

const modalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)

let modal: Modal
let toastInstance: Toast

const editingTrainer = ref<Trainer | null>(null)
const trainerToDelete = ref<Trainer | null>(null)
const openDropdownId = ref<number | null>(null)

const form = ref<Partial<Trainer>>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  speciality: '',
})
const errors = ref<Record<string, string>>({})
const toastMessage = ref('')

// ──────────────────────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────────────────────
const filteredTrainers = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  if (!term) return trainers.value
  return trainers.value.filter(t =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(term) ||
    t.email.toLowerCase().includes(term)
  )
})

const isFormValid = computed(() => {
  ;['firstName', 'lastName', 'email', 'phone'].forEach(validateField)
  return (
    !!form.value.firstName?.trim() &&
    !!form.value.lastName?.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email || '') &&
    /^[0-9]{10}$/.test(form.value.phone || '') &&
    !Object.values(errors.value).some(e => e)
  )
})

// ──────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────
const validateField = (field: string) => {
  const value = form.value[field as keyof Trainer]
  switch (field) {
    case 'firstName':
      errors.value.firstName = value ? '' : 'First name is required.'
      break
    case 'lastName':
      errors.value.lastName = value ? '' : 'Last name is required.'
      break
    case 'email':
      if (!value) errors.value.email = 'Email is required.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
        errors.value.email = 'Enter a valid email.'
      else errors.value.email = ''
      break
    case 'phone':
      if (!value) errors.value.phone = 'Phone number is required.'
      else if (!/^[0-9]{10}$/.test(String(value)))
        errors.value.phone = 'Enter a valid 10-digit phone number.'
      else errors.value.phone = ''
      break
  }
}

// ──────────────────────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────────────────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

// ──────────────────────────────────────────────────────────────
// API
// ──────────────────────────────────────────────────────────────
const fetchTrainers = async () => {
  try {
    const res: AxiosResponse<any> = await api.get('/trainers')
    const payload = Array.isArray(res.data)
      ? res.data
      : (res.data && Array.isArray(res.data.data) ? res.data.data : [])
    trainers.value = payload as Trainer[]
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load trainers.', false)
  }
}

const createTrainer = async () => {
  const payload = {
    firstName: form.value.firstName!.trim(),
    lastName: form.value.lastName!.trim(),
    email: form.value.email!.trim(),
    phone: form.value.phone!.trim(),
    speciality: form.value.speciality?.trim() || null,
  }

  const res = await api.post('/trainers', payload)
  trainers.value.push(res.data)
  showToast('Trainer added successfully!')
}

const updateTrainer = async (id: number) => {
  const payload = {
    firstName: form.value.firstName!.trim(),
    lastName: form.value.lastName!.trim(),
    email: form.value.email!.trim(),
    phone: form.value.phone!.trim(),
    speciality: form.value.speciality?.trim() || null,
  }

  const res = await api.put(`/trainers/${id}`, payload)
  const index = trainers.value.findIndex(t => t.id === id)
  if (index !== -1) trainers.value[index] = res.data
  showToast('Trainer updated successfully!')
}

// ──────────────────────────────────────────────────────────────
// Modals
// ──────────────────────────────────────────────────────────────
const openAddModal = () => {
  editingTrainer.value = null
  form.value = { firstName: '', lastName: '', email: '', phone: '', speciality: '' }
  errors.value = {}
  modal?.show()
}

const editTrainer = (trainer: Trainer) => {
  editingTrainer.value = trainer
  form.value = { ...trainer }
  errors.value = {}
  modal?.show()
}

const closeModal = () => {
  modal?.hide()
  editingTrainer.value = null
  form.value = {}
  errors.value = {}
}

const saveTrainer = async () => {
  if (!isFormValid.value) {
    showToast('Please fill all required fields correctly.', false)
    return
  }
  isSubmitting.value = true

  try {
    if (editingTrainer.value) {
      await updateTrainer(editingTrainer.value.id)
    } else {
      await createTrainer()
    }
    closeModal()
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Save failed.', false)
  } finally {
    isSubmitting.value = false
  }
}

// ──────────────────────────────────────────────────────────────
// Dropdown
// ──────────────────────────────────────────────────────────────
const toggleDropdown = (id: number) => {
  openDropdownId.value = openDropdownId.value === id ? null : id
}
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null
}

// ──────────────────────────────────────────────────────────────
// Confirm Delete
// ──────────────────────────────────────────────────────────────
const isConfirmOpen = ref(false)
let resolveConfirm: (v: boolean) => void = () => { }

const showConfirm = (msg: string): Promise<boolean> => {
  return new Promise<boolean>(resolve => {
    isConfirmOpen.value = true
    resolveConfirm = v => {
      isConfirmOpen.value = false
      resolve(v)
    }
  })
}

const confirmDelete = async (trainer: Trainer) => {
  trainerToDelete.value = trainer
  const ok = await showConfirm(`Delete ${trainer.firstName} ${trainer.lastName} permanently?`)
  if (!ok) return

  try {
    await api.delete(`/trainers/${trainer.id}`)
    trainers.value = trainers.value.filter(t => t.id !== trainer.id)
    showToast('Trainer deleted successfully!')
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to delete trainer.', false)
  }
}

// ──────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────
onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)

  document.addEventListener('click', handleClickOutside)

  await fetchTrainers()
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

.table-active {
  background-color: #f8f9fa !important;
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

.badge {
  font-size: .75rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.card-body {
  overflow: visible !important;
}
</style>