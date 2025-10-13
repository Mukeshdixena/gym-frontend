<template>
  <div class="container mt-4">
    <h3 class="mb-4">Assign Membership Plans</h3>

    <!-- Toast Container -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert"
        aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Members Without Active Plan -->
    <div class="mb-5">
      <h5>Members Without Active Plan</h5>
      <table class="table table-hover mt-3">
        <thead class="table-dark">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in inactiveMembers" :key="m.id">
            <td>{{ m.firstName }} {{ m.lastName }}</td>
            <td>{{ m.email }}</td>
            <td>{{ m.phone }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="openAssignModal(m)">
                Assign Plan
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Members with Expiring Plans -->
    <div>
      <h5>Plans Expiring Soon</h5>
      <table class="table table-hover mt-3">
        <thead class="table-dark">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Plan</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in expiringMembers" :key="m.id">
            <td>{{ m.firstName }} {{ m.lastName }}</td>
            <td>{{ m.email }}</td>
            <td>{{ getPlanName(m.memberships[0]?.planId) }}</td>
            <td>{{ formatDate(m.memberships[0]?.endDate) }}</td>
            <td>{{ m.memberships[0]?.status }}</td>
            <td>
              <button class="btn btn-sm btn-warning" @click="openAssignModal(m)">
                Renew / Assign New Plan
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Assign / Renew Modal -->
    <div class="modal fade" ref="assignModalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Assign Membership Plan</h5>
            <button type="button" class="btn-close" @click="closeAssignModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="assignPlan">
              <div class="mb-3">
                <strong>Member:</strong>
                <span>{{ selectedMember?.firstName }} {{ selectedMember?.lastName }}</span>
              </div>

              <div class="mt-4">
                <h6>Select Plan</h6>
                <select v-model="enrollmentForm.planId" class="form-select" @change="updatePlanDates">
                  <option disabled value="0">-- Select Plan --</option>
                  <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                    {{ plan.name }} - ₹{{ plan.price }} ({{ plan.durationDays }} days)
                  </option>
                </select>

                <div v-if="selectedPlan" class="mt-3">
                  <div class="row">
                    <div class="col-md-6">
                      <p><strong>Description:</strong> {{ selectedPlan.description }}</p>
                      <p><strong>Duration:</strong> {{ selectedPlan.durationDays }} days</p>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-2">
                        <label><strong>Start Date:</strong></label>
                        <input type="date" v-model="enrollmentForm.startDate" class="form-control"
                          @change="updatePlanDates" />
                      </div>
                      <p><strong>End Date:</strong> {{ formattedEndDate }}</p>
                    </div>
                  </div>

                  <div class="row mt-3 g-3">
                    <div class="col-md-4">
                      <label class="form-label"><strong>Plan Price (₹)</strong></label>
                      <input type="number" class="form-control" :value="selectedPlan.price" readonly />
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Discount / Coupon (₹)</label>
                      <input type="number" v-model.number="enrollmentForm.discount" class="form-control"
                        @input="updatePendingAmount" />
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Paying Amount (₹)</label>
                      <input type="number" v-model.number="enrollmentForm.paid" class="form-control"
                        @input="updatePendingAmount" />
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Payment Method</label>
                      <select v-model="enrollmentForm.method" class="form-select">
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="ONLINE">Online</option>
                      </select>
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Pending Amount (₹)</label>
                      <input type="number" class="form-control" :value="pendingAmount" readonly />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" class="btn btn-success w-100 mt-4">Assign Plan</button>
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

// Interfaces
interface Plan { id: number; name: string; price: number; durationDays: number; description: string }
interface Membership { id: number; planId: number; memberId: number; startDate: string; endDate: string; status: string; paid?: number; discount?: number }
interface Member { id: number; firstName: string; lastName: string; email: string; phone: string; memberships: Membership[] }

// State
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])
const assignModalRef = ref<HTMLElement | null>(null)
let assignModal: Modal
const selectedMember = ref<Member | null>(null)

// Form
const enrollmentForm = ref({
  memberId: 0,
  planId: 0,
  startDate: '',
  endDate: '',
  paid: 0,
  discount: 0,
  method: 'CASH'
})

// Toast
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
function hideToast() { toastInstance.hide() }

// Computed
const selectedPlan = computed(() => plans.value.find(p => p.id === enrollmentForm.value.planId))
const formattedEndDate = computed(() =>
  enrollmentForm.value.endDate ? new Date(enrollmentForm.value.endDate).toLocaleDateString() : ''
)
const inactiveMembers = computed(() => members.value.filter(m => !m.memberships.length || m.memberships[0].status === 'EXPIRED'))
const expiringMembers = computed(() => {
  const now = new Date()
  const soon = new Date()
  soon.setDate(now.getDate() + 7)
  return members.value.filter(m => {
    const end = m.memberships[0]?.endDate ? new Date(m.memberships[0].endDate) : null
    return end && end <= soon && end >= now
  })
})
const pendingAmount = computed(() => {
  if (!selectedPlan.value) return 0
  const pending = selectedPlan.value.price - (enrollmentForm.value.discount + enrollmentForm.value.paid)
  return pending > 0 ? pending : 0
})

// Helpers
function formatDate(dateStr?: string) { return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A' }
function getPlanName(id?: number) { return plans.value.find(p => p.id === id)?.name ?? 'N/A' }
function updatePlanDates() {
  const plan = selectedPlan.value
  if (plan && enrollmentForm.value.startDate) {
    const start = new Date(enrollmentForm.value.startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + plan.durationDays)
    enrollmentForm.value.endDate = end.toISOString().split('T')[0]
  }
}
function updatePendingAmount() { /* handled by computed */ }

function openAssignModal(member: Member) {
  selectedMember.value = member
  const activeMembership = member.memberships.find(m => m.status === 'ACTIVE')
  enrollmentForm.value = {
    memberId: member.id,
    planId: activeMembership?.planId ?? 0,
    startDate: activeMembership?.startDate?.split('T')[0] ?? '',
    endDate: activeMembership?.endDate?.split('T')[0] ?? '',
    paid: activeMembership?.paid ?? 0,
    discount: activeMembership?.discount ?? 0,
    method: 'CASH'
  }
  assignModal.show()
}
function closeAssignModal() { assignModal.hide() }

async function assignPlan() {
  if (!enrollmentForm.value.planId || !enrollmentForm.value.startDate) {
    showToast('Please select plan and start date.', false)
    return
  }
  try {
    const payload = { ...enrollmentForm.value }
    await axios.post(`${API_BASE_URL}/memberships`, payload)
    await loadMembers()
    showToast('Plan assigned successfully!')
    closeAssignModal()
  } catch (err) {
    console.error(err)
    showToast('Failed to assign plan.', false)
  }
}

async function loadMembers() {
  try {
    const res = await axios.get(`${API_BASE_URL}/members`)
    members.value = Array.isArray(res.data.data) ? res.data.data : []
  } catch (err) {
    console.error(err)
    showToast('Error loading members.', false)
  }
}

onMounted(async () => {
  if (assignModalRef.value) assignModal = new Modal(assignModalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  const [resMembers, resPlans] = await Promise.all([
    axios.get(`${API_BASE_URL}/members`),
    axios.get(`${API_BASE_URL}/plans`)
  ])
  members.value = Array.isArray(resMembers.data.data) ? resMembers.data.data : []
  plans.value = resPlans.data
})
</script>

<style scoped>
.table {
  vertical-align: middle;
}
</style>
