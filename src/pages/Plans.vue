<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Plans Management</h2>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 2000">
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

    <!-- Add Button -->
    <div class="d-flex justify-content-between mb-3">
      <h5 class="m-0">Available Plans</h5>
      <button class="btn btn-primary" @click="openAddModal">New Plan</button>
    </div>

    <!-- Plans Table -->
    <table class="table table-striped table-hover">
      <thead class="table-dark">
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Price</th>
          <th>Duration (Days)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="plan in plans" :key="plan.id">
          <td>{{ plan.name }}</td>
          <td>{{ plan.description }}</td>
          <td>₹{{ plan.price }}</td>
          <td>{{ plan.durationDays }}</td>
          <td>
            <button class="btn btn-sm btn-info me-2" @click="editPlan(plan)">
              Edit
            </button>
            <button
              class="btn btn-sm btn-danger"
              @click="confirmDelete(plan.id!)"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add/Edit Modal -->
    <div class="modal fade" tabindex="-1" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingPlan ? 'Edit Plan' : 'Add Plan' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="savePlan">
              <!-- Name -->
              <div class="mb-3">
                <label class="form-label">Plan Name</label>
                <input
                  v-model.trim="form.name"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.name }"
                  @blur="validateField('name')"
                />
                <div v-if="errors.name" class="invalid-feedback">
                  {{ errors.name }}
                </div>
              </div>

              <!-- Description -->
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea
                  v-model.trim="form.description"
                  class="form-control"
                  rows="2"
                  :class="{ 'is-invalid': errors.description }"
                  @blur="validateField('description')"
                ></textarea>
                <div v-if="errors.description" class="invalid-feedback">
                  {{ errors.description }}
                </div>
              </div>

              <!-- Price -->
              <div class="mb-3">
                <label class="form-label">Price (₹)</label>
                <input
                  v-model.number="form.price"
                  type="number"
                  class="form-control"
                  :class="{ 'is-invalid': errors.price }"
                  @blur="validateField('price')"
                  min="1"
                />
                <div v-if="errors.price" class="invalid-feedback">
                  {{ errors.price }}
                </div>
              </div>

              <!-- Duration -->
              <div class="mb-3">
                <label class="form-label">Duration (Days)</label>
                <input
                  v-model.number="form.durationDays"
                  type="number"
                  class="form-control"
                  :class="{ 'is-invalid': errors.durationDays }"
                  @blur="validateField('durationDays')"
                  min="1"
                />
                <div v-if="errors.durationDays" class="invalid-feedback">
                  {{ errors.durationDays }}
                </div>
              </div>

              <!-- Submit -->
              <button
                class="btn btn-primary w-100"
                type="submit"
                :disabled="!isFormValid || isUnchanged"
              >
                {{ editingPlan ? 'Update' : 'Add' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div class="modal fade" tabindex="-1" ref="deleteModalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="hideDeleteModal"></button>
          </div>
          <div class="modal-body">
            Are you sure you want to delete this plan?
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="hideDeleteModal">Cancel</button>
            <button class="btn btn-danger" @click="deletePlanConfirmed">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as bootstrap from 'bootstrap'
import api from '@/api/axios'

interface Plan {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
}

const plans = ref<Plan[]>([])
const modalRef = ref<HTMLElement | null>(null)
const deleteModalRef = ref<HTMLElement | null>(null)
let modalInstance!: bootstrap.Modal
let deleteModalInstance!: bootstrap.Modal

const editingPlan = ref<Plan | null>(null)
const deleteId = ref<number | null>(null)
const toastRef = ref<HTMLElement | null>(null)
let toastInstance!: bootstrap.Toast
const toastMessage = ref('')

// ──────────────────────────────
// Form + Validation
// ──────────────────────────────
const form = ref<Partial<Plan>>({
  id: 0,
  name: '',
  description: '',
  price: 0,
  durationDays: 0
})

const originalForm = ref<Partial<Plan>>({})
const errors = ref<Record<string, string>>({})

const validateField = (field: string) => {
  const value = form.value[field as keyof Plan]
  switch (field) {
    case 'name':
      errors.value.name = value ? '' : 'Plan name is required.'
      break
    case 'description':
      errors.value.description = value ? '' : 'Description is required.'
      break
    case 'price':
      errors.value.price =
        !value || Number(value) <= 0 ? 'Enter a valid positive price.' : ''
      break
    case 'durationDays':
      errors.value.durationDays =
        !value || Number(value) <= 0 ? 'Enter a valid duration (days).' : ''
      break
  }
}

const isFormValid = computed(() => {
  ;['name', 'description', 'price', 'durationDays'].forEach(validateField)
  return !Object.values(errors.value).some((err) => err)
})

const isUnchanged = computed(() => {
  return JSON.stringify(form.value) === JSON.stringify(originalForm.value)
})

// ──────────────────────────────
// Toast Helper
// ──────────────────────────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${
      success ? 'bg-success' : 'bg-danger'
    } border-0`
    toastInstance.show()
  }
}
const hideToast = () => toastInstance.hide()

// ──────────────────────────────
// Modal Actions
// ──────────────────────────────
const openAddModal = () => {
  editingPlan.value = null
  form.value = { id: 0, name: '', description: '', price: 0, durationDays: 0 }
  originalForm.value = { ...form.value }
  modalInstance.show()
}
const closeModal = () => modalInstance.hide()

const editPlan = (plan: Plan) => {
  editingPlan.value = plan
  form.value = { ...plan }
  originalForm.value = { ...plan }
  modalInstance.show()
}

const confirmDelete = (id?: number) => {
  if (!id) return
  deleteId.value = id
  deleteModalInstance.show()
}
const hideDeleteModal = () => deleteModalInstance.hide()

// ──────────────────────────────
// API Calls
// ──────────────────────────────
const loadPlans = async () => {
  try {
    const res = await api.get('/plans')
    plans.value = Array.isArray(res.data) ? res.data : res.data.data || []
  } catch (err) {
    console.error(err)
    showToast('Failed to load plans.', false)
  }
}

const savePlan = async () => {
  if (!isFormValid.value) {
    showToast('Please fill all required fields correctly.', false)
    return
  }

  const payload = {
    name: form.value.name!.trim(),
    description: form.value.description!.trim(),
    price: form.value.price!,
    durationDays: form.value.durationDays!
  }

  try {
    if (editingPlan.value) {
      await api.put(`/plans/${editingPlan.value.id}`, payload)
      showToast('Plan updated successfully!')
    } else {
      await api.post('/plans', payload)
      showToast('Plan added successfully!')
    }
    await loadPlans()
    closeModal()
  } catch (err) {
    console.error(err)
    showToast('Failed to save plan.', false)
  }
}

const deletePlanConfirmed = async () => {
  if (!deleteId.value) return
  try {
    await api.delete(`/plans/${deleteId.value}`)
    plans.value = plans.value.filter((p) => p.id !== deleteId.value)
    hideDeleteModal()
    showToast('Plan deleted successfully!')
  } catch (err) {
    console.error(err)
    showToast('Failed to delete plan.', false)
  }
}

// ──────────────────────────────
// Lifecycle
// ──────────────────────────────
onMounted(async () => {
  if (modalRef.value)
    modalInstance = new bootstrap.Modal(modalRef.value, { backdrop: 'static' })
  if (deleteModalRef.value)
    deleteModalInstance = new bootstrap.Modal(deleteModalRef.value, {
      backdrop: 'static'
    })
  if (toastRef.value)
    toastInstance = new bootstrap.Toast(toastRef.value, {
      delay: 3000,
      autohide: true
    })
  await loadPlans()
})
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

.invalid-feedback {
  display: block;
  font-size: 0.875rem;
}
</style>
