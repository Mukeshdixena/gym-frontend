<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Membership Plans</h2>

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

    <!-- Add Plan Button -->
    <div class="d-flex justify-content-end mb-3">
      <button class="btn btn-primary" @click="openAddModal" :disabled="isLoading">
        Add New Plan
      </button>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading plans...</p>
    </div>

    <!-- Plans Grid -->
    <div v-else class="row g-4">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="col-md-6 col-lg-4"
      >
        <div class="card h-100 shadow-sm border-0">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ plan.name }}</h5>
            <p class="card-text text-muted">{{ plan.description }}</p>
            <div class="mt-auto">
              <p class="h4 text-primary mb-1">₹{{ plan.price }}</p>
              <p class="text-muted small">{{ plan.durationDays }} days</p>
              <div class="d-flex gap-2 mt-3">
                <button
                  class="btn btn-sm btn-outline-primary flex-fill"
                  @click="editPlan(plan)"
                  :disabled="isLoading"
                >
                  Edit
                </button>
                <button
                  class="btn btn-sm btn-outline-danger flex-fill"
                  @click="deletePlan(plan.id)"
                  :disabled="isLoading"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="plans.length === 0" class="col-12 text-center py-5">
        <p class="text-muted">No plans available. Create one!</p>
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
              {{ editingPlan ? 'Edit Plan' : 'Add New Plan' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="savePlan">
              <div class="row g-3">
                <div class="col-md-8">
                  <label class="form-label">Plan Name</label>
                  <input
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    required
                    :disabled="isSubmitting"
                  />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Price (₹)</label>
                  <input
                    v-model.number="form.price"
                    type="number"
                    min="0"
                    class="form-control"
                    required
                    :disabled="isSubmitting"
                  />
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea
                    v-model="form.description"
                    class="form-control"
                    rows="3"
                    required
                    :disabled="isSubmitting"
                  ></textarea>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Duration (days)</label>
                  <input
                    v-model.number="form.durationDays"
                    type="number"
                    min="1"
                    class="form-control"
                    required
                    :disabled="isSubmitting"
                  />
                </div>
              </div>

              <div class="d-grid mt-4">
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="isSubmitting || !isFormValid"
                >
                  <span
                    v-if="isSubmitting"
                    class="d-flex align-items-center justify-content-center"
                  >
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    {{ editingPlan ? 'Updating...' : 'Creating...' }}
                  </span>
                  <span v-else>
                    {{ editingPlan ? 'Update Plan' : 'Create Plan' }}
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
import { ref, computed, onMounted } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// --- Interfaces ---
interface Plan {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
}

// --- State ---
const plans = ref<Plan[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)

const modalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)

let modal: Modal
let toastInstance: Toast

const editingPlan = ref<Plan | null>(null)
const toastMessage = ref('')

// --- Form ---
const form = ref<Partial<Plan>>({
  name: '',
  description: '',
  price: 0,
  durationDays: 0,
})

// --- Computed ---
const isFormValid = computed(() => {
  return (
    form.value.name?.trim() &&
    form.value.description?.trim() &&
    (form.value.price ?? 0) > 0 &&
    (form.value.durationDays ?? 0) > 0
  )
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

// --- API ---
const loadPlans = async () => {
  try {
    const res: AxiosResponse<Plan[]> = await api.get('/plans')
    plans.value = res.data ?? []
  } catch (err: any) {
    console.error('Load plans error:', err)
    showToast('Failed to load plans.', false)
  }
}

const createPlan = async () => {
  const payload = {
    name: form.value.name!.trim(),
    description: form.value.description!.trim(),
    price: form.value.price!,
    durationDays: form.value.durationDays!,
  }

  await api.post('/plans', payload)
  await loadPlans()
  showToast('Plan created successfully!')
}

const updatePlan = async (id: number) => {
  const payload = {
    name: form.value.name!.trim(),
    description: form.value.description!.trim(),
    price: form.value.price!,
    durationDays: form.value.durationDays!,
  }

  await api.put(`/plans/${id}`, payload)
  await loadPlans()
  showToast('Plan updated successfully!')
}

const deletePlan = async (id: number) => {
  if (!confirm('Delete this plan permanently?')) return

  try {
    await api.delete(`/plans/${id}`)
    plans.value = plans.value.filter(p => p.id !== id)
    showToast('Plan deleted.')
  } catch (err: any) {
    showToast('Delete failed.', false)
  }
}

// --- Modal ---
const openAddModal = () => {
  editingPlan.value = null
  form.value = {
    name: '',
    description: '',
    price: 0,
    durationDays: 0,
  }
  modal?.show()
}

const editPlan = (plan: Plan) => {
  editingPlan.value = plan
  form.value = { ...plan }
  modal?.show()
}

const closeModal = () => {
  modal?.hide()
  editingPlan.value = null
}

const savePlan = async () => {
  if (!isFormValid.value) return
  isSubmitting.value = true

  try {
    if (editingPlan.value) {
      await updatePlan(editingPlan.value.id)
    } else {
      await createPlan()
    }
    closeModal()
  } catch (err: any) {
    console.error(err)
    showToast(err.response?.data?.message || 'Save failed.', false)
  } finally {
    isSubmitting.value = false
  }
}

// --- Lifecycle ---
onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)

  isLoading.value = true
  await loadPlans()
  isLoading.value = false
})
</script>

<style scoped>
.card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}
</style>
