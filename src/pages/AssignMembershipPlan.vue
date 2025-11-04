<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Assign Membership Plans</h2>

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
              {{selectedMember?.memberships.some(ms => ms.status === 'ACTIVE') ? 'Renew' : 'Assign'}}
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

              <!-- Plan Selection -->
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

              <!-- Addon Selection -->
              <div class="mt-4 border-top pt-3">
                <h5>Select Addon (Optional)</h5>

                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label">Addon</label>
                    <select v-model="selectedAddonId" class="form-select" @change="onAddonSelect">
                      <option value="">-- Select Addon --</option>
                      <option v-for="a in addons" :key="a.id" :value="a.id">
                        {{ a.name }} - ₹{{ a.price }} ({{ a.durationDays }} days)
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Addon Details (Only shown after selection) -->
                <div v-if="selectedAddon" class="mt-4">
                  <div class="row">
                    <div class="col-md-6">
                      <p><strong>Description:</strong> {{ selectedAddon.description }}</p>
                      <p><strong>Duration:</strong> {{ selectedAddon.durationDays }} days</p>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label"><strong>Start Date:</strong></label>
                      <input type="date" v-model="addonStartDate" class="form-control" @change="updateAddonEndDate"
                        :min="enrollmentForm.startDate" required />
                      <p class="mt-2"><strong>End Date:</strong> {{ formattedAddonEndDate }}</p>
                    </div>
                  </div>

                  <div class="row mt-3 g-3">
                    <div class="col-md-4">
                      <label class="form-label"><strong>Price (₹)</strong></label>
                      <input type="number" class="form-control" :value="selectedAddon.price" readonly />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Trainer ID</label>
                      <input v-model.number="addonTrainerId" type="number" class="form-control"
                        placeholder="Optional" />
                    </div>
                    <div class="col-md-4">
                      <!-- Empty for symmetry -->
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
import { ref, computed, onMounted, watch } from 'vue'
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
const addons = ref<Plan[]>([])
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

// Addon fields
const selectedAddonId = ref<number | null>(null)
const addonTrainerId = ref<number | null>(null)
const addonStartDate = ref('')
const addonEndDate = ref('')

const toastMessage = ref('')

// Toast helpers
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.classList.remove('bg-success', 'bg-danger')
    toastRef.value.classList.add(success ? 'bg-success' : 'bg-danger')
    toastInstance.show()
  }
}
const hideToast = () => toastInstance.hide()

// Computed
const selectedPlan = computed(() => plans.value.find(p => p.id === enrollmentForm.value.planId))
const selectedAddon = computed(() => addons.value.find(a => a.id === selectedAddonId.value))

const formattedEndDate = computed(() =>
  enrollmentForm.value.endDate ? new Date(enrollmentForm.value.endDate).toLocaleDateString('en-IN') : ''
)

const formattedAddonEndDate = computed(() =>
  addonEndDate.value ? new Date(addonEndDate.value).toLocaleDateString('en-IN') : ''
)

const pendingAmount = computed(() => {
  if (!selectedPlan.value) return 0
  const total = selectedPlan.value.price
  const paid = enrollmentForm.value.paid || 0
  const discount = enrollmentForm.value.discount || 0
  return Math.max(total - paid - discount, 0)
})

// Members
const inactiveMembers = computed(() =>
  members.value.filter(m =>
    !m.memberships.length ||
    m.memberships.every(ms => ms.status === 'EXPIRED' || ms.status === 'CANCELLED')
  )
)

const activeMembers = computed(() =>
  members.value
    .map(m => ({
      ...m,
      memberships: m.memberships
        .filter(ms => ms.status === 'ACTIVE')
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    }))
    .filter(m => m.memberships.length > 0)
    .sort((a, b) => new Date(a.memberships[0].endDate).getTime() - new Date(b.memberships[0].endDate).getTime())
)

// Helpers
const getPlanName = (id?: number) => plans.value.find(p => p.id === id)?.name ?? 'N/A'
const formatDate = (dateStr?: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : 'N/A'

const getLastActiveEndDate = (list: Membership[]) => {
  const active = list.filter(m => m.status === 'ACTIVE')
  if (!active.length) return null
  return active.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0].endDate
}

// Update plan end date
const updatePlanDates = () => {
  const plan = selectedPlan.value
  if (!plan || !enrollmentForm.value.startDate) {
    enrollmentForm.value.endDate = ''
    return
  }
  const start = new Date(enrollmentForm.value.startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + plan.durationDays - 1)
  enrollmentForm.value.endDate = end.toISOString().split('T')[0]

  // Auto-sync addon start date if not manually changed
  if (selectedAddon.value && !addonStartDate.value) {
    addonStartDate.value = enrollmentForm.value.startDate
    updateAddonEndDate()
  }
}

// Update addon end date
const updateAddonEndDate = () => {
  const addon = selectedAddon.value
  if (!addon || !addonStartDate.value) {
    addonEndDate.value = ''
    return
  }
  const start = new Date(addonStartDate.value)
  const end = new Date(start)
  end.setDate(start.getDate() + addon.durationDays - 1)
  addonEndDate.value = end.toISOString().split('T')[0]
}

// On addon select
const onAddonSelect = () => {
  const addon = selectedAddon.value
  if (addon) {
    // Set start date = plan start date (or today if no plan)
    addonStartDate.value = enrollmentForm.value.startDate || new Date().toISOString().split('T')[0]
    updateAddonEndDate()
  } else {
    addonStartDate.value = ''
    addonEndDate.value = ''
    addonTrainerId.value = null
  }
}

// Reset addon fields
const resetAddonFields = () => {
  selectedAddonId.value = null
  addonTrainerId.value = null
  addonStartDate.value = ''
  addonEndDate.value = ''
}

// Open Modal
const openAssignModal = (member: Member) => {
  selectedMember.value = member

  const lastActive = member.memberships
    .filter(m => m.status === 'ACTIVE')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]

  const today = new Date().toISOString().split('T')[0]
  const nextDay = lastActive?.endDate
    ? (() => {
      const d = new Date(lastActive.endDate)
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0]
    })()
    : today

  enrollmentForm.value = {
    memberId: member.id,
    planId: 0,
    startDate: nextDay,
    endDate: '',
    paid: 0,
    discount: 0,
    method: 'CASH'
  }

  resetAddonFields()
  assignModal.show()
}

// Close Modal
const closeAssignModal = () => {
  assignModal.hide()
  selectedMember.value = null
  enrollmentForm.value = {
    memberId: 0,
    planId: 0,
    startDate: '',
    endDate: '',
    paid: 0,
    discount: 0,
    method: 'CASH'
  }
  resetAddonFields()
}

// API Calls
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
    const res: AxiosResponse<Plan[]> = await api.get('/plans/list-all?isActive=true&sortBy=createdAt&order=desc')
    plans.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('loadPlans error:', e)
    showToast('Failed to load plans.', false)
  }
}

const loadAddons = async () => {
  try {
    const res: AxiosResponse<Plan[]> = await api.get('/addons/list-all?isActive=true&sortBy=createdAt&order=desc')
    addons.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('loadAddons error:', e)
    showToast('Failed to load addons.', false)
  }
}

// Assign Plan + Addon
const assignPlan = async () => {
  const { planId, startDate, endDate } = enrollmentForm.value
  if (!planId || !startDate || !endDate) {
    showToast('Please select a plan and valid start date.', false)
    return
  }

  isSubmitting.value = true
  try {
    await api.post('/memberships', enrollmentForm.value)

    if (selectedAddonId.value && addonStartDate.value && addonEndDate.value) {
      try {
        await api.post('/addons/assign', {
          memberId: enrollmentForm.value.memberId,
          addonId: selectedAddonId.value,
          trainerId: addonTrainerId.value || undefined,
          startDate: addonStartDate.value,
          endDate: addonEndDate.value,
          price: selectedAddon.value?.price
        })
        showToast('Membership and addon assigned successfully!')
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Addon assignment failed.'
        showToast(`Membership assigned, but addon failed: ${msg}`, false)
      }
    } else if (selectedAddonId.value) {
      showToast('Addon selected but start date is missing.', false)
    } else {
      showToast('Membership assigned successfully!')
    }

    await loadMembers()
    closeAssignModal()
  } catch (e: any) {
    console.error('Assign plan error →', e)
    let message = e?.response?.data?.message || e?.message || 'Failed to assign plan.'
    if (message.toLowerCase().includes('overlap')) {
      message = 'Membership dates overlap with an existing plan.'
    }
    showToast(message, false)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  if (assignModalRef.value) {
    assignModal = new bootstrap.Modal(assignModalRef.value, { backdrop: 'static' })
  }
  if (toastRef.value) {
    toastInstance = new bootstrap.Toast(toastRef.value, { delay: 4000 })
  }
  await Promise.all([loadMembers(), loadPlans(), loadAddons()])
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