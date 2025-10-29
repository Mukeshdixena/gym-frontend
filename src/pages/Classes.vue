<template>
  <div class="container-fluid mt-4">
    <h3 class="mb-4">Classes Management</h3>

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

    <!-- Search & Add -->
    <div class="d-flex justify-content-between mb-3">
      <input
        type="text"
        class="form-control w-25"
        placeholder="Search by class name or trainer"
        v-model="searchTerm"
      />
      <button class="btn btn-primary" @click="openAddModal" :disabled="isLoading">
        Add Class
      </button>
    </div>

    <!-- Classes Table -->
    <div class="card shadow-sm">
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-dark">
            <tr>
              <th>Class Name</th>
              <th>Trainer</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cls in filteredClasses" :key="cls.id">
              <td>{{ cls.name }}</td>
              <td>
                {{ cls.trainer?.firstName }} {{ cls.trainer?.lastName }}
              </td>
              <td>{{ formatDateTime(cls.startTime) }}</td>
              <td>{{ formatDateTime(cls.endTime) }}</td>
              <td>
                <button
                  class="btn btn-sm btn-info me-2"
                  @click="editClass(cls)"
                  :disabled="isLoading"
                >
                  Edit
                </button>
                <button
                  class="btn btn-sm btn-danger"
                  @click="deleteClass(cls.id)"
                  :disabled="isLoading"
                >
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="filteredClasses.length === 0">
              <td colspan="5" class="text-center text-muted py-4">
                No classes found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div
      class="modal fade"
      ref="modalRef"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingClass ? 'Edit Class' : 'Add New Class' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveClass">
              <div class="mb-3">
                <label class="form-label">Class Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  required
                  placeholder="e.g., Yoga Flow"
                  :disabled="isSubmitting"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Trainer</label>
                <select
                  v-model="form.trainerId"
                  class="form-select"
                  required
                  :disabled="isSubmitting"
                >
                  <option :value="null" disabled>Select Trainer</option>
                  <option v-for="t in trainers" :key="t.id" :value="t.id">
                    {{ t.firstName }} {{ t.lastName }}
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Start Time</label>
                <input
                  v-model="form.startTime"
                  type="datetime-local"
                  class="form-control"
                  required
                  :disabled="isSubmitting"
                  :min="minDateTime"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">End Time</label>
                <input
                  v-model="form.endTime"
                  type="datetime-local"
                  class="form-control"
                  required
                  :disabled="isSubmitting"
                  :min="form.startTime || minDateTime"
                />
                <small v-if="form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)" class="text-danger">
                  End time must be after start time
                </small>
              </div>

              <div class="d-grid">
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="isSubmitting || !isFormValid"
                >
                  <span v-if="isSubmitting" class="d-flex align-items-center justify-content-center">
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                    {{ editingClass ? 'Updating...' : 'Adding...' }}
                  </span>
                  <span v-else>
                    {{ editingClass ? 'Update Class' : 'Add Class' }}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// --- Interfaces ---
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

// --- State ---
const classes = ref<GymClass[]>([])
const trainers = ref<Trainer[]>([])
const searchTerm = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)

const toastRef = ref<HTMLElement | null>(null)
const modalRef = ref<HTMLElement | null>(null)

let toastInstance: Toast
let modal: Modal

const editingClass = ref<GymClass | null>(null)

const form = ref({
  id: 0,
  name: '',
  startTime: '',
  endTime: '',
  trainerId: null as number | null,
})

// --- Computed ---
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

// --- Toast ---
const showToast = (message: string, isSuccess = true) => {
  toastMessage.value = message
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${
      isSuccess ? 'bg-success' : 'bg-danger'
    } border-0`
    toastInstance?.show()
  }
  setTimeout(() => {
    if (toastMessage.value === message) hideToast()
  }, 4000)
}
const hideToast = () => toastInstance?.hide()
const toastMessage = ref('')

// --- API ---
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

const deleteClass = async (id: number) => {
  if (!confirm('Are you sure you want to delete this class?')) return

  try {
    await api.delete(`/classes/${id}`)
    await fetchClasses()
    showToast('Class deleted.')
  } catch (err: any) {
    showToast('Failed to delete class.', false)
  }
}

// --- Modal ---
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

// --- Helpers ---
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

// --- Lifecycle ---
onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)

  isLoading.value = true
  await Promise.all([fetchTrainers(), fetchClasses()])
  isLoading.value = false
})

// Optional: Debounce search
watch(searchTerm, () => {
  // Future: add debounce if performance needed
})
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

input[type="datetime-local"] {
  font-size: 0.9rem;
}
</style>