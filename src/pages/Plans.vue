<template>
  <div class="container mt-4">
    <h3 class="mb-4">Plans Management</h3>

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

    <!-- Filters + Add Button -->
    <div class="card shadow-sm mb-3">
      <div class="card-header bg-primary text-white fw-bold">Filters</div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label"><strong>Search</strong></label>
            <input v-model.trim="filters.search" type="text" class="form-control form-control-sm"
              placeholder="Name or description" @input="loadPlans" />
          </div>
          <div class="col-md-2">
            <label class="form-label"><strong>Status</strong></label>
            <select v-model="filters.isActive" class="form-select form-select-sm" @change="loadPlans">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label"><strong>Min Price</strong></label>
            <input v-model.number="filters.minPrice" type="number" class="form-control form-control-sm"
              placeholder="Min ₹" @change="loadPlans" />
          </div>
          <div class="col-md-2">
            <label class="form-label"><strong>Max Price</strong></label>
            <input v-model.number="filters.maxPrice" type="number" class="form-control form-control-sm"
              placeholder="Max ₹" @change="loadPlans" />
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-primary btn-sm w-100" @click="openAddModal">
              New Plan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading plans...</p>
    </div>

    <!-- Plans Table -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Plans</div>
      <div class="card-body table-responsive p-0">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(plan, i) in plans" :key="plan.id">
              <td>{{ i + 1 }}</td>
              <td>{{ plan.name }}</td>
              <td>{{ plan.description }}</td>
              <td>₹{{ plan.price }}</td>
              <td>{{ plan.durationDays }} days</td>
              <td>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" :id="'switch-' + plan.id" :checked="plan.isActive"
                    @change="togglePlanStatus(plan.id, $event)" :disabled="isToggling" />
                  <label class="form-check-label" :for="'switch-' + plan.id"
                    :class="{ 'text-success': plan.isActive, 'text-muted': !plan.isActive }">
                    {{ plan.isActive ? 'Active' : 'Inactive' }}
                  </label>
                </div>
              </td>
              <td class="text-center" @click.stop>
                <div class="dropdown" @click.stop="toggleDropdown(plan.id)">
                  <button class="btn btn-light btn-sm border-0">...</button>
                  <div v-if="openDropdownId === plan.id" class="dropdown-menu-custom shadow-sm">
                    <a href="javascript:void(0)" @click="editPlan(plan)" class="dropdown-item-custom">Edit</a>
                    <a href="javascript:void(0)" @click="confirmDelete(plan.id)"
                      class="dropdown-item-custom text-danger">
                      Delete
                    </a>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="plans.length === 0">
              <td colspan="7" class="text-center text-muted py-4">No plans found</td>
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
            <h5 class="modal-title">{{ editingPlan ? 'Edit Plan' : 'Add Plan' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>Plan Name</strong></label>
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
                  <div v-if="editingPlan" class="form-control-plaintext">
                    ₹{{ form.price }}
                  </div>
                  <input v-else v-model.number="form.price" type="number" class="form-control"
                    :class="{ 'is-invalid': errors.price }" @blur="validateField('price')" min="1" required />
                  <div v-if="errors.price" class="invalid-feedback">{{ errors.price }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Duration (Days)</strong></label>
                  <div v-if="editingPlan" class="form-control-plaintext">
                    {{ form.durationDays }} days
                  </div>
                  <input v-else v-model.number="form.durationDays" type="number" class="form-control"
                    :class="{ 'is-invalid': errors.durationDays }" @blur="validateField('durationDays')" min="1"
                    required />
                  <div v-if="errors.durationDays" class="invalid-feedback">{{ errors.durationDays }}</div>
                </div>
              </div>

              <div class="mt-3">
                <label class="form-label"><strong>Status</strong></label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="activeSwitch" v-model="form.isActive" />
                  <label class="form-check-label" for="activeSwitch">
                    {{ form.isActive ? 'Active' : 'Inactive' }}
                  </label>
                </div>
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="savePlan" :disabled="!isFormValid || isUnchanged">
                  {{ editingPlan ? 'Update Plan' : 'Add Plan' }}
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
            Are you sure you want to delete this plan?
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
interface Plan {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
  isActive: boolean
}

// ──────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────
const plans = ref<Plan[]>([])
const isLoading = ref(true)
const isToggling = ref(false)

const modalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)

let modal: Modal
let toastInstance: Toast

const editingPlan = ref<Plan | null>(null)
const openDropdownId = ref<number | null>(null)

const form = ref<Partial<Plan>>({
  name: '',
  description: '',
  price: 0,
  durationDays: 0,
  isActive: true,
})
const originalForm = ref<Partial<Plan>>({})
const errors = ref<Record<string, string>>({})
const toastMessage = ref('')

// Filters
const filters = ref({
  search: '',
  isActive: '',
  minPrice: null as number | null,
  maxPrice: null as number | null,
})

// ──────────────────────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────────────────────
const isFormValid = computed(() => {
  ;['name', 'description', 'price', 'durationDays'].forEach(validateField)
  return (
    !!form.value.name &&
    !!form.value.description &&
    (form.value.price ?? 0) > 0 &&
    (form.value.durationDays ?? 0) > 0 &&
    !Object.values(errors.value).some(e => e)
  )
})

const isUnchanged = computed(() => {
  return JSON.stringify(form.value) === JSON.stringify(originalForm.value)
})

// ──────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────
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
      errors.value.price = !value || Number(value) <= 0 ? 'Enter a valid positive price.' : ''
      break
    case 'durationDays':
      errors.value.durationDays = !value || Number(value) <= 0 ? 'Enter a valid duration (days).' : ''
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
const loadPlans = async () => {
  isLoading.value = true
  try {
    const params: Record<string, any> = {}
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.isActive !== '') params.isActive = filters.value.isActive
    if (filters.value.minPrice !== null) params.minPrice = filters.value.minPrice
    if (filters.value.maxPrice !== null) params.maxPrice = filters.value.maxPrice

    const res = await api.get('/plans', { params }) as AxiosResponse<Plan[] | { data: Plan[] }>
    const payload = Array.isArray(res.data) ? res.data : (res.data && (res.data as any).data) || []
    plans.value = payload
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load plans.', false)
  } finally {
    isLoading.value = false
  }
}

// ──────────────────────────────────────────────────────────────
// Modals
// ──────────────────────────────────────────────────────────────
const openAddModal = () => {
  editingPlan.value = null
  form.value = { name: '', description: '', price: 0, durationDays: 0, isActive: true }
  originalForm.value = { ...form.value }
  errors.value = {}
  modal?.show()
}

const editPlan = (plan: Plan) => {
  editingPlan.value = plan
  form.value = { ...plan }
  originalForm.value = { ...plan }
  errors.value = {}
  modal?.show()
}

const closeModal = () => {
  modal?.hide()
  editingPlan.value = null
  form.value = {}
  originalForm.value = {}
  errors.value = {}
}

// ──────────────────────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────────────────────
const savePlan = async () => {
  if (!isFormValid.value) {
    showToast('Please fill all required fields correctly.', false)
    return
  }

  const payload: any = {
    name: form.value.name!.trim(),
    description: form.value.description!.trim(),
    isActive: form.value.isActive ?? true,
  }

  if (!editingPlan.value) {
    payload.price = form.value.price!
    payload.durationDays = form.value.durationDays!
  }

  try {
    if (editingPlan.value) {
      await api.put(`/plans/${editingPlan.value.id}`, payload)
      showToast('Plan updated successfully!')
    } else {
      const res = await api.post('/plans', payload)
      plans.value.push(res.data)
      showToast('Plan added successfully!')
    }
    await loadPlans()
    closeModal()
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to save plan.', false)
  }
}

const togglePlanStatus = async (id: number, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  isToggling.value = true

  try {
    await api.patch(`/plans/${id}/status`, { isActive: checked })
    const plan = plans.value.find(p => p.id === id)
    if (plan) plan.isActive = checked
    showToast(`Plan marked as ${checked ? 'Active' : 'Inactive'}`)
  } catch (err: any) {
    console.error(err)
    showToast('Failed to update status.', false)
    if (event.target) (event.target as HTMLInputElement).checked = !checked
  } finally {
    isToggling.value = false
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

const showConfirm = (): Promise<boolean> => {
  return new Promise<boolean>(resolve => {
    isConfirmOpen.value = true
    resolveConfirm = v => {
      isConfirmOpen.value = false
      resolve(v)
    }
  })
}

const confirmDelete = async (id: number) => {
  const ok = await showConfirm()
  if (!ok) return

  try {
    await api.delete(`/plans/${id}`)
    plans.value = plans.value.filter(p => p.id !== id)
    showToast('Plan deleted successfully!')
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to delete plan.', false)
  }
}

// ──────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────
onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)

  document.addEventListener('click', handleClickOutside)

  await loadPlans()
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

.form-switch .form-check-input {
  cursor: pointer;
}

.card-body {
  overflow: visible !important;
}
</style>