<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Members Management</h2>

    <!-- ✅ Toast Container -->
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
    <div class="d-flex justify-content-between mb-3">
      <input type="text" class="form-control w-25" placeholder="Search by name or email" v-model="searchTerm" />
      <button class="btn btn-primary" @click="openAddModal">New Enrollment</button>
    </div>

    <!-- Members Table -->
    <table class="table table-striped table-hover">
      <thead class="table-dark">
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Membership</th>
          <th>Plan</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in filteredMembers" :key="member.id">
          <td>{{ member.firstName }} {{ member.lastName }}</td>
          <td>{{ member.email }}</td>
          <td>{{ member.phone }}</td>
          <td>{{ member.memberships[0]?.status ?? 'N/A' }}</td>
          <td>{{plans.find(p => p.id === member.memberships[0]?.planId)?.name ?? 'N/A'}}</td>
          <td>
            <button class="btn btn-sm btn-info me-2" @click="editMember(member)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteMember(member.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add/Edit Modal -->
    <div class="modal fade" id="memberModal" tabindex="-1" aria-hidden="true" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingMember ? 'Edit Member' : 'New Enrollment' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="saveMember">
              <div class="mb-3">
                <label class="form-label">First Name</label>
                <input v-model="form.firstName" type="text" class="form-control" required />
              </div>

              <div class="mb-3">
                <label class="form-label">Last Name</label>
                <input v-model="form.lastName" type="text" class="form-control" required />
              </div>

              <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="form-control" required />
              </div>

              <div class="mb-3">
                <label class="form-label">Phone</label>
                <input v-model="form.phone" type="text" class="form-control" required />
              </div>

              <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea v-model="form.address" class="form-control" rows="2"></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">Date of Birth</label>
                <input v-model="form.dateOfBirth" type="date" class="form-control" />
              </div>

              <button class="btn btn-primary w-100" type="submit">
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
import axios from 'axios'
import { Modal, Toast } from 'bootstrap'
import { API_BASE_URL } from '@/config'

// ✅ API endpoints from config file
const apiUrl = `${API_BASE_URL}/members`
const plansApiUrl = `${API_BASE_URL}/plans`

// Types
interface Membership {
  id: number
  planId: number
  memberId: number
  startDate: string
  endDate: string
  status: string
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

// State
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])
const searchTerm = ref('')

// Modal handling
const modalRef = ref<HTMLElement | null>(null)
let modalInstance: Modal
let editingMember: Member | null = null

// Toast handling
const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast
const toastMessage = ref('')

function showToast(message: string, isSuccess = true) {
  toastMessage.value = message
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${isSuccess ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance.show()
  }
}
function hideToast() {
  toastInstance.hide()
}

// Form data
const form = ref<Member>({
  id: 0,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  memberships: []
})

// Filtered list
const filteredMembers = computed(() =>
  members.value.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
)

// Modal actions
function openAddModal() {
  editingMember = null
  form.value = { id: 0, firstName: '', lastName: '', email: '', phone: '', memberships: [] }
  modalInstance.show()
}

function closeModal() {
  modalInstance.hide()
}

function editMember(member: Member) {
  editingMember = member
  form.value = { ...member }
  modalInstance.show()
}

// CRUD Actions
async function saveMember() {
  try {
    const payload = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      phone: form.value.phone,
      address: form.value.address,
      dateOfBirth: form.value.dateOfBirth
    }

    if (editingMember) {
      await axios.put(`${apiUrl}/${editingMember.id}`, payload)
      showToast('Member updated successfully!')
    } else {
      await axios.post(apiUrl, payload)
      showToast('Member added successfully!')
    }

    await loadMembers()
    closeModal()
  } catch (err) {
    console.error(err)
    showToast('Failed to save member.', false)
  }
}

async function deleteMember(id: number) {
  if (!confirm('Are you sure you want to delete this member?')) return
  try {
    await axios.delete(`${apiUrl}/${id}`)
    members.value = members.value.filter(m => m.id !== id)
    showToast('Member deleted successfully!')
  } catch (err) {
    console.error(err)
    showToast('Failed to delete member.', false)
  }
}

async function loadMembers() {
  try {
    const res = await axios.get(apiUrl)
    members.value = res.data.data || res.data
  } catch (err) {
    console.error(err)
    showToast('Failed to load members.', false)
  }
}

async function loadPlans() {
  try {
    const res = await axios.get(plansApiUrl)
    plans.value = res.data.data || res.data
  } catch (err) {
    console.error(err)
  }
}

// Lifecycle
onMounted(async () => {
  if (modalRef.value) modalInstance = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await Promise.all([loadMembers(), loadPlans()])
})
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
