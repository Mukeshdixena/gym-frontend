<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Members Management</h2>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 2000">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert"
        aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Search & Add -->
    <div class="d-flex justify-content-between mb-3">
      <input type="text" class="form-control w-25" placeholder="Search by name or email" v-model="searchTerm" />
      <button class="btn btn-primary" @click="openAddModal">
        New Enrollment
      </button>
    </div>

    <!-- Members Table -->
    <table class="table table-striped table-hover align-middle">
      <thead class="table-dark">
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>DOB</th>
          <th>Membership Status</th>
          <th>Plan</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="member in filteredMembers" :key="member.id">
          <!-- Main Row -->
          <tr @click="toggleExpand(member.id)" style="cursor: pointer"
            :class="{ 'table-active': expandedMemberId === member.id }">
            <td>{{ member.firstName }} {{ member.lastName }}</td>
            <td>{{ member.email }}</td>
            <td>{{ member.phone }}</td>
            <td>
              {{
                member.dateOfBirth
                  ? new Date(member.dateOfBirth).toLocaleDateString()
                  : 'N/A'
              }}
            </td>
            <td>{{ member.memberships[0]?.status ?? 'N/A' }}</td>
            <td>
              {{
                plans.find((p) => p.id === member.memberships[0]?.planId)?.name ??
                'N/A'
              }}
            </td>
            <td>
              <button class="btn btn-sm btn-info me-2" @click.stop="editMember(member)">
                Edit
              </button>
              <button class="btn btn-sm btn-danger" @click.stop="deleteMember(member.id)">
                Delete
              </button>
            </td>
          </tr>

          <!-- Expandable Membership Row -->
          <tr v-if="expandedMemberId === member.id">
            <td colspan="7" class="bg-light">
              <div v-if="member.memberships.length">
                <table class="table table-bordered table-sm mb-0">
                  <thead class="table-secondary">
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
                      <td>
                        {{plans.find((p) => p.id === ms.planId)?.name ?? 'N/A'}}
                      </td>
                      <td>{{ ms.status }}</td>
                      <td>{{ new Date(ms.startDate).toLocaleDateString() }}</td>
                      <td>{{ new Date(ms.endDate).toLocaleDateString() }}</td>
                      <td>{{ ms.paid }}</td>
                      <td>{{ ms.pending }}</td>
                      <td>{{ ms.discount ?? 0 }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-muted p-2">No memberships</div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- Add/Edit Member Modal -->
    <div class="modal fade" tabindex="-1" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingMember ? 'Edit Member' : 'Add Member' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="saveMember">
              <!-- First Name -->
              <div class="mb-3">
                <label class="form-label">First Name</label>
                <input v-model.trim="form.firstName" type="text" class="form-control"
                  :class="{ 'is-invalid': errors.firstName }" @blur="validateField('firstName')" />
                <div v-if="errors.firstName" class="invalid-feedback">
                  {{ errors.firstName }}
                </div>
              </div>

              <!-- Last Name -->
              <div class="mb-3">
                <label class="form-label">Last Name</label>
                <input v-model.trim="form.lastName" type="text" class="form-control"
                  :class="{ 'is-invalid': errors.lastName }" @blur="validateField('lastName')" />
                <div v-if="errors.lastName" class="invalid-feedback">
                  {{ errors.lastName }}
                </div>
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model.trim="form.email" type="email" class="form-control"
                  :class="{ 'is-invalid': errors.email }" @blur="validateField('email')" />
                <div v-if="errors.email" class="invalid-feedback">
                  {{ errors.email }}
                </div>
              </div>

              <!-- Phone -->
              <div class="mb-3">
                <label class="form-label">Phone</label>
                <input v-model.trim="form.phone" type="text" class="form-control"
                  :class="{ 'is-invalid': errors.phone }" @blur="validateField('phone')" />
                <div v-if="errors.phone" class="invalid-feedback">
                  {{ errors.phone }}
                </div>
              </div>

              <!-- Address -->
              <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea v-model.trim="form.address" class="form-control" rows="2"></textarea>
              </div>

              <!-- DOB -->
              <div class="mb-3">
                <label class="form-label">Date of Birth</label>
                <input v-model="form.dateOfBirth" type="date" class="form-control"
                  :class="{ 'is-invalid': errors.dateOfBirth }" @blur="validateField('dateOfBirth')" />
                <div v-if="errors.dateOfBirth" class="invalid-feedback">
                  {{ errors.dateOfBirth }}
                </div>
              </div>

              <!-- Submit Button -->
              <button class="btn btn-primary w-100" type="submit"
                :disabled="!isFormValid || (!!editingMember && !isFormDirty)">
                {{ editingMember ? 'Update' : 'Add' }}
              </button>
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

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────
interface Membership {
  id: number
  planId: number
  memberId: number
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

// ──────────────────────────────────────
// State
// ──────────────────────────────────────
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])
const searchTerm = ref('')
const modalRef = ref<HTMLElement | null>(null)
let modalInstance!: Modal
let editingMember: Member | null = null
const toastRef = ref<HTMLElement | null>(null)
let toastInstance!: Toast
const toastMessage = ref('')
const expandedMemberId = ref<number | null>(null)

const form = ref<Partial<Member>>({
  id: 0,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  memberships: [],
})
const originalForm = ref<Partial<Member>>({})

// ──────────────────────────────────────
// Expand / Collapse Memberships
// ──────────────────────────────────────
const toggleExpand = (id: number) => {
  expandedMemberId.value = expandedMemberId.value === id ? null : id
}

// ──────────────────────────────────────
// Validation
// ──────────────────────────────────────
const errors = ref<Record<string, string>>({})
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

const isFormValid = computed(() => {
  ;['firstName', 'lastName', 'email', 'phone', 'dateOfBirth'].forEach(validateField)
  return (
    form.value.firstName &&
    form.value.lastName &&
    form.value.email &&
    form.value.phone &&
    form.value.dateOfBirth &&
    !Object.values(errors.value).some((err) => err)
  )
})

// ──────────────────────────────────────
// Dirty Check
// ──────────────────────────────────────
const isFormDirty = computed(() => {
  if (!editingMember) return true
  const keys: (keyof Member)[] = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'address',
    'dateOfBirth',
  ]
  return keys.some((key) => {
    const current = (form.value[key] ?? '').toString().trim()
    const original = (originalForm.value[key] ?? '').toString().trim()
    return current !== original
  })
})

// ──────────────────────────────────────
// Toast
// ──────────────────────────────────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'
      } border-0`
    toastInstance.show()
  }
}
const hideToast = () => toastInstance.hide()

// ──────────────────────────────────────
// Computed
// ──────────────────────────────────────
const filteredMembers = computed(() =>
  members.value.filter(
    (m) =>
      `${m.firstName} ${m.lastName}`
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
)

// ──────────────────────────────────────
// Modal Actions
// ──────────────────────────────────────
const openAddModal = () => {
  editingMember = null
  form.value = {
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    memberships: [],
  }
  originalForm.value = {}
  modalInstance.show()
}

const closeModal = () => {
  modalInstance.hide()
  originalForm.value = {}
}

const editMember = (member: Member) => {
  editingMember = member
  form.value = { ...member }
  originalForm.value = { ...member }
  modalInstance.show()
}

// ──────────────────────────────────────
// API Calls
// ──────────────────────────────────────
const loadMembers = async () => {
  try {
    const res = await api.get('/members')
    members.value = Array.isArray(res.data) ? res.data : res.data.data || []
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load members.', false)
  }
}

const loadPlans = async () => {
  try {
    const res = await api.get('/plans')
    plans.value = Array.isArray(res.data) ? res.data : res.data.data || []
  } catch (err) {
    console.error(err)
  }
}

const getErrorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message
  if (Array.isArray(msg)) return msg.join(', ')
  if (typeof msg === 'string') return msg
  return fallback
}

const saveMember = async () => {
  if (!isFormValid.value) {
    ;['firstName', 'lastName', 'email', 'phone', 'dateOfBirth'].forEach(validateField)
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
    if (editingMember) {
      await api.put(`/members/${editingMember.id}`, payload)
      showToast('Member updated successfully!')
    } else {
      await api.post('/members', payload)
      showToast('Member added successfully!')
    }
    await loadMembers()
    closeModal()
  } catch (err: any) {
    console.error(err)
    showToast(getErrorMessage(err, 'Failed to save member.'), false)
  }
}

const deleteMember = async (id: number) => {
  if (!confirm('Delete this member permanently?')) return
  try {
    await api.delete(`/members/${id}`)
    members.value = members.value.filter((m) => m.id !== id)
    showToast('Member deleted successfully!')
  } catch (err: any) {
    console.error(err)
    showToast(getErrorMessage(err, 'Failed to delete member.'), false)
  }
}

// ──────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────
onMounted(async () => {
  if (modalRef.value)
    modalInstance = new Modal(modalRef.value, { backdrop: 'static' })
  if (toastRef.value)
    toastInstance = new Toast(toastRef.value, { delay: 3000, autohide: true })
  await Promise.all([loadMembers(), loadPlans()])
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

.bg-light {
  background-color: #f9f9f9 !important;
}

.table-sm th,
.table-sm td {
  padding: 0.3rem 0.5rem;
}

.invalid-feedback {
  display: block;
  font-size: 0.875rem;
}
</style>
