<template>
  <div class="container mt-4">
    <h3 class="mb-4">Members Management</h3>

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
          v-model="searchTerm" />
      </div>
      <div class="col-md-7 text-end">
        <button class="btn btn-primary btn-sm" @click="openAddModal">
          New Enrollment
        </button>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading members and plans...</p>
    </div>

    <!-- Members Table -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Members</div>
      <div class="card-body table-responsive p-0">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>DOB</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(member, i) in filteredMembers" :key="member.id">
              <!-- Main Row -->
              <tr @click="toggleExpand(member.id)" style="cursor: pointer"
                :class="{ 'table-active': expandedMemberId === member.id }">
                <td>{{ i + 1 }}</td>
                <td>{{ member.firstName }} {{ member.lastName }}</td>
                <td>{{ member.email }}</td>
                <td>{{ member.phone }}</td>
                <td>
                  {{ member.dateOfBirth ? formatDate(member.dateOfBirth) : 'N/A' }}
                </td>
                <td>
                  <span class="badge"
                    :class="getStatusClass(member.memberships[0]?.status)">
                    {{ member.memberships[0]?.status ?? 'N/A' }}
                  </span>
                </td>
                <td>
                  {{ getPlanName(member.memberships[0]?.planId) }}
                </td>
                <td class="text-center" @click.stop>
                  <div class="dropdown" @click.stop="toggleDropdown(member.id)">
                    <button class="btn btn-light btn-sm border-0">...</button>
                    <div v-if="openDropdownId === member.id" class="dropdown-menu-custom shadow-sm">
                      <a href="javascript:void(0)" @click="editMember(member)" class="dropdown-item-custom">Edit</a>
                      <a href="javascript:void(0)" @click="confirmDelete(member)" class="dropdown-item-custom text-danger">
                        Delete
                      </a>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Expandable Membership Row -->
              <tr v-if="expandedMemberId === member.id">
                <td colspan="8" class="p-0 bg-light">
                  <div v-if="member.memberships.length" class="p-3">
                    <table class="table table-sm table-bordered mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Plan</th>
                          <th>Status</th>
                          <th>Start</th>
                          <th>End</th>
                          <th>Paid</th>
                          <th>Pending</th>
                          <th>Discount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="ms in member.memberships" :key="ms.id">
                          <td>{{ getPlanName(ms.planId) }}</td>
                          <td>
                            <span class="badge" :class="getStatusClass(ms.status)">
                              {{ ms.status }}
                            </span>
                          </td>
                          <td>{{ formatDate(ms.startDate) }}</td>
                          <td>{{ formatDate(ms.endDate) }}</td>
                          <td>₹{{ ms.paid }}</td>
                          <td>₹{{ ms.pending }}</td>
                          <td>₹{{ ms.discount ?? 0 }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="text-muted p-3">No memberships</div>
                </td>
              </tr>
            </template>
            <tr v-if="filteredMembers.length === 0">
              <td colspan="8" class="text-center text-muted py-4">No members found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Member Modal -->
    <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingMember ? 'Edit Member' : 'Add Member' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>First Name</strong></label>
                  <input v-model.trim="form.firstName" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.firstName }" @blur="validateField('firstName')" required />
                  <div v-if="errors.firstName" class="invalid-feedback">{{ errors.firstName }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Last Name</strong></label>
                  <input v-model.trim="form.lastName" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.lastName }" @blur="validateField('lastName')" required />
                  <div v-if="errors.lastName" class="invalid-feedback">{{ errors.lastName }}</div>
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label"><strong>Email</strong></label>
                  <input v-model.trim="form.email" type="email" class="form-control"
                    :class="{ 'is-invalid': errors.email }" @blur="validateField('email')" required />
                  <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Phone</strong></label>
                  <input v-model.trim="form.phone" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.phone }" @blur="validateField('phone')" required />
                  <div v-if="errors.phone" class="invalid-feedback">{{ errors.phone }}</div>
                </div>
              </div>

              <div class="mt-3">
                <label class="form-label">Address</label>
                <textarea v-model.trim="form.address" class="form-control" rows="2"></textarea>
              </div>

              <div class="mt-3">
                <label class="form-label"><strong>Date of Birth</strong></label>
                <input v-model="form.dateOfBirth" type="date" class="form-control"
                  :class="{ 'is-invalid': errors.dateOfBirth }" @blur="validateField('dateOfBirth')" required />
                <div v-if="errors.dateOfBirth" class="invalid-feedback">{{ errors.dateOfBirth }}</div>
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="saveMember"
                  :disabled="!isFormValid || (!!editingMember && !isFormDirty)">
                  {{ editingMember ? 'Update Member' : 'Add Member' }}
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
            Delete <strong>{{ memberToDelete?.firstName }} {{ memberToDelete?.lastName }}</strong> permanently?
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
interface Membership {
  id: number
  planId: number
  startDate: string
  endDate: string
  status: string
  paid: number
  pending: number
  discount?: number
}

interface Member {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  dateOfBirth?: string
  memberships: Membership[]
}

interface Plan {
  id: number
  name: string
}

// ──────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])
const searchTerm = ref('')
const isLoading = ref(true)

const modalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)

let modal: Modal
let toastInstance: Toast

const editingMember = ref<Member | null>(null)
const memberToDelete = ref<Member | null>(null)
const expandedMemberId = ref<number | null>(null)
const openDropdownId = ref<number | null>(null)

const form = ref<Partial<Member>>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
})
const originalForm = ref<Partial<Member>>({})

const errors = ref<Record<string, string>>({})
const toastMessage = ref('')

// ──────────────────────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────────────────────
const filteredMembers = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  if (!term) return members.value
  return members.value.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(term) ||
    m.email.toLowerCase().includes(term)
  )
})

const isFormValid = computed(() => {
  ;['firstName', 'lastName', 'email', 'phone', 'dateOfBirth'].forEach(validateField)
  return (
    form.value.firstName &&
    form.value.lastName &&
    form.value.email &&
    form.value.phone &&
    form.value.dateOfBirth &&
    !Object.values(errors.value).some(err => err)
  )
})

const isFormDirty = computed(() => {
  if (!editingMember.value) return true
  const keys: (keyof Member)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'dateOfBirth']
  return keys.some(key => {
    const current = (form.value[key] ?? '').toString().trim()
    const original = (originalForm.value[key] ?? '').toString().trim()
    return current !== original
  })
})

const getPlanName = (id?: number) => plans.value.find(p => p.id === id)?.name ?? 'N/A'
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN')

const getStatusClass = (status?: string) => {
  if (!status) return 'bg-secondary'
  return {
    'ACTIVE': 'bg-success',
    'PARTIAL_PAID': 'bg-warning text-dark',
    'EXPIRED': 'bg-danger',
    'CANCELLED': 'bg-dark'
  }[status] || 'bg-secondary'
}

// ──────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────
const validateField = (field: string) => {
  const value = form.value[field as keyof Member]
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
    case 'dateOfBirth':
      errors.value.dateOfBirth = value ? '' : 'Date of birth is required.'
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
const loadMembers = async () => {
  try {
    const res: AxiosResponse<any> = await api.get('/members')
    members.value = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load members.', false)
  }
}

const loadPlans = async () => {
  try {
    const res: AxiosResponse<any> = await api.get('/plans')
    plans.value = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  } catch (err) {
    console.error(err)
  }
}

// ──────────────────────────────────────────────────────────────
// Modals
// ──────────────────────────────────────────────────────────────
const openAddModal = () => {
  editingMember.value = null
  form.value = { firstName: '', lastName: '', email: '', phone: '', address: '', dateOfBirth: '' }
  originalForm.value = {}
  errors.value = {}
  modal?.show()
}

const editMember = (member: Member) => {
  editingMember.value = member
  form.value = { ...member }
  originalForm.value = { ...member }
  errors.value = {}
  modal?.show()
}

const closeModal = () => {
  modal?.hide()
  editingMember.value = null
  form.value = {}
  originalForm.value = {}
  errors.value = {}
}

// ──────────────────────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────────────────────
const saveMember = async () => {
  if (!isFormValid.value) {
    showToast('Please fill all required fields correctly.', false)
    return
  }

  const payload = {
    firstName: form.value.firstName!.trim(),
    lastName: form.value.lastName!.trim(),
    email: form.value.email!.trim(),
    phone: form.value.phone!.trim(),
    address: form.value.address?.trim(),
    dateOfBirth: form.value.dateOfBirth,
  }

  try {
    if (editingMember.value) {
      await api.put(`/members/${editingMember.value.id}`, payload)
      showToast('Member updated successfully!')
    } else {
      await api.post('/members', payload)
      showToast('Member added successfully!')
    }
    await loadMembers()
    closeModal()
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'Failed to save member.'
    showToast(Array.isArray(msg) ? msg.join(', ') : msg, false)
  }
}

// ──────────────────────────────────────────────────────────────
// Expand / Collapse
// ──────────────────────────────────────────────────────────────
const toggleExpand = (id: number) => {
  expandedMemberId.value = expandedMemberId.value === id ? null : id
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

const confirmDelete = async (member: Member) => {
  const ok = await showConfirm(`Delete ${member.firstName} ${member.lastName} permanently?`)
  if (!ok) return

  try {
    await api.delete(`/members/${member.id}`)
    members.value = members.value.filter(m => m.id !== member.id)
    showToast('Member deleted successfully!')
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to delete member.', false)
  }
}

// ──────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────
onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)

  document.addEventListener('click', handleClickOutside)

  await Promise.all([loadMembers(), loadPlans()])
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

input[readonly],
.form-control-plaintext {
  background-color: #f8f9fa !important;
}
</style>