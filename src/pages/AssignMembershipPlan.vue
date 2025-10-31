<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Assign Membership Plans</h2>

    <!-- Toast (same as PlansManagement) -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 2000">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert"
        aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading members and plans...</p>
    </div>

    <div v-else>
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

      <!-- Active Members -->
      <div>
        <h5>Active Members (Sorted by Expiry Date)</h5>
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
            <tr v-for="m in activeMembers" :key="m.id">
              <td>{{ m.firstName }} {{ m.lastName }}</td>
              <td>{{ m.email }}</td>
              <td>{{ getPlanName(m.memberships[0]?.planId) }}</td>
              <td>{{ formatDate(getLastActiveEndDate(m.memberships)) }}</td>
              <td>
                <span class="badge bg-success">{{ m.memberships[0]?.status }}</span>
              </td>
              <td>
                <button class="btn btn-sm btn-warning" @click="openAssignModal(m)">
                  Renew / Assign New Plan
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Assign / Renew Modal -->
    <div class="modal fade" ref="assignModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ selectedMember?.memberships.some(ms => ms.status === 'ACTIVE') ? 'Renew' : 'Assign' }}
              Membership Plan
            </h5>
            <button type="button" class="btn-close" @click="closeAssignModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="assignPlan">
              <div class="mb-3">
                <strong>Member:</strong>
                {{ selectedMember?.firstName }} {{ selectedMember?.lastName }} ({{ selectedMember?.email }})
              </div>

              <div class="mt-3">
                <label class="form-label"><strong>Select Plan</strong></label>
                <select v-model="enrollmentForm.planId" class="form-select" @change="updatePlanDates" required>
                  <option :value="0" disabled>-- Select Plan --</option>
                  <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                    {{ plan.name }} - ₹{{ plan.price }} ({{ plan.durationDays }} days)
                  </option>
                </select>

                <div v-if="selectedPlan" class="mt-4">
                  <div class="row">
                    <div class="col-md-6">
                      <p><strong>Description:</strong> {{ selectedPlan.description }}</p>
                      <p><strong>Duration:</strong> {{ selectedPlan.durationDays }} days</p>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label"><strong>Start Date:</strong></label>
                      <input type="date" v-model="enrollmentForm.startDate" class="form-control"
                        @change="updatePlanDates" required />
                      <p class="mt-2"><strong>End Date:</strong> {{ formattedEndDate }}</p>
                    </div>
                  </div>

                  <div class="row mt-3 g-3">
                    <div class="col-md-4">
                      <label class="form-label"><strong>Plan Price (₹)</strong></label>
                      <input type="number" class="form-control" :value="selectedPlan.price" readonly />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Discount / Coupon (₹)</label>
                      <input type="number" v-model.number="enrollmentForm.discount" class="form-control" min="0" />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Pending (₹)</label>
                      <input type="number" class="form-control" :value="pendingAmount" readonly />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" class="btn btn-success w-100 mt-4"
                :disabled="isSubmitting || !enrollmentForm.planId || !enrollmentForm.startDate">
                {{ isSubmitting ? 'Saving...' : 'Save Plan' }}
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
import * as bootstrap from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

interface Plan {
  id: number
  name: string
  price: number
  durationDays: number
  description: string
}

interface Membership {
  id: number
  planId: number
  startDate: string
  endDate: string
  status: string
  paid?: number
  discount?: number
}

interface Member {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  memberships: Membership[]
}

const members = ref<Member[]>([])
const plans = ref<Plan[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)

const assignModalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)
let assignModal!: bootstrap.Modal
let toastInstance!: bootstrap.Toast

const selectedMember = ref<Member | null>(null)

const enrollmentForm = ref({
  memberId: 0,
  planId: 0,
  startDate: '',
  endDate: '',
  paid: 0,
  discount: 0,
  method: 'CASH' as 'CASH' | 'CARD' | 'UPI' | 'ONLINE'
})

const toastMessage = ref('')

// ──────────────────────────────
// Toast Helper (same as PlansManagement)
// ──────────────────────────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance.show()
  }
}
const hideToast = () => toastInstance.hide()

// ──────────────────────────────
// Computed
// ──────────────────────────────
const selectedPlan = computed(() => plans.value.find(p => p.id === enrollmentForm.value.planId))
const formattedEndDate = computed(() =>
  enrollmentForm.value.endDate ? new Date(enrollmentForm.value.endDate).toLocaleDateString('en-IN') : ''
)
const pendingAmount = computed(() => {
  if (!selectedPlan.value) return 0
  const balance = selectedPlan.value.price - (enrollmentForm.value.paid + enrollmentForm.value.discount)
  return balance > 0 ? balance : 0
})

const inactiveMembers = computed(() =>
  members.value.filter(
    m => !m.memberships.length || m.memberships.every(ms => ms.status === 'EXPIRED' || ms.status === 'CANCELLED')
  )
)

const activeMembers = computed(() =>
  members.value
    .map(m => {
      const active = m.memberships
        .filter(ms => ms.status === 'ACTIVE')
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      return { ...m, memberships: active }
    })
    .filter(m => m.memberships.length > 0)
    .sort((a, b) => new Date(a.memberships[0].endDate).getTime() - new Date(b.memberships[0].endDate).getTime())
)

const getPlanName = (id?: number) => plans.value.find(p => p.id === id)?.name ?? 'N/A'
const formatDate = (dateStr?: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : 'N/A'

const getLastActiveEndDate = (list: Membership[]) => {
  const active = list.filter(m => m.status === 'ACTIVE')
  if (!active.length) return null
  return active.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0].endDate
}

const updatePlanDates = () => {
  const plan = selectedPlan.value
  if (!plan || !enrollmentForm.value.startDate) return
  const start = new Date(enrollmentForm.value.startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + plan.durationDays - 1)
  enrollmentForm.value.endDate = end.toISOString().split('T')[0]
}

const openAssignModal = (member: Member) => {
  selectedMember.value = member
  const lastActive = member.memberships
    .filter(m => m.status === 'ACTIVE')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]

  let startDate: string
  if (lastActive?.endDate) {
    const nextDay = new Date(lastActive.endDate)
    nextDay.setDate(nextDay.getDate() + 1)
    startDate = nextDay.toISOString().split('T')[0]
  } else {
    startDate = new Date().toISOString().split('T')[0]
  }

  enrollmentForm.value = {
    memberId: member.id,
    planId: 0,
    startDate,
    endDate: '',
    paid: 0,
    discount: 0,
    method: 'CASH'
  }

  updatePlanDates()
  assignModal.show()
}

const closeAssignModal = () => {
  assignModal.hide()
  selectedMember.value = null
  enrollmentForm.value = { memberId: 0, planId: 0, startDate: '', endDate: '', paid: 0, discount: 0, method: 'CASH' }
}

const loadMembers = async () => {
  try {
    const res: AxiosResponse<{ data: Member[] }> = await api.get('/members')
    members.value = Array.isArray(res.data.data) ? res.data.data : []
  } catch (e) {
    console.error('loadMembers error:', e)
    showToast('Failed to load members.', false)
  }
}

const loadPlans = async () => {
  try {
    const res: AxiosResponse<Plan[]> = await api.get('/plans')
    plans.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('loadPlans error:', e)
    showToast('Failed to load plans.', false)
  }
}

const assignPlan = async () => {
  const { planId, startDate, endDate } = enrollmentForm.value
  if (!planId || !startDate || !endDate) {
    showToast('Please select a plan and valid start date.', false)
    return
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (end <= start) {
    showToast('End date must be after start date.', false)
    return
  }

  if (end < today) {
    showToast('End date cannot be in the past.', false)
    return
  }

  isSubmitting.value = true
  try {
    await api.post('/memberships', enrollmentForm.value)
    await loadMembers()
    closeAssignModal()
    showToast('Membership assigned successfully!')
  } catch (e: any) {
    console.error('Assign plan error →', e)

    let message = 'Failed to assign plan.'

    if (e?.response?.status === 400 && e?.response?.data) {
      const apiMsg = e.response.data.message || e.response.data.error || ''
      if (apiMsg.includes('Membership dates overlap')) {
        message = 'Membership dates overlap with an existing membership for this member'
      } else if (apiMsg) {
        message = apiMsg
      }
    } else if (e?.response?.data?.message) {
      message = e.response.data.message
    } else if (e?.message) {
      message = e.message
    }

    showToast(message, false)
  } finally {
    isSubmitting.value = false
  }
}

// ──────────────────────────────
// Lifecycle
// ──────────────────────────────
onMounted(async () => {
  if (assignModalRef.value)
    assignModal = new bootstrap.Modal(assignModalRef.value, { backdrop: 'static' })

  if (toastRef.value)
    toastInstance = new bootstrap.Toast(toastRef.value, {
      delay: 3000,
      autohide: true
    })

  await Promise.all([loadMembers(), loadPlans()])
  isLoading.value = false
})
</script>

<style scoped>
.table {
  vertical-align: middle;
}

.badge {
  font-size: 0.75rem;
}
</style>