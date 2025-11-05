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
      <p class="mt-2">Loading members, plans, special programs, and trainers...</p>
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
                  Assign Plan / Special Program
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
                  Renew / Assign New
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
              {{
                selectedMember?.memberships.some(ms => ms.status === 'ACTIVE')
                  ? 'Renew / Update'
                  : 'Assign'
              }}
              Membership / Special Program
            </h5>
            <button type="button" class="btn-close" @click="closeAssignModal"></button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="assignPlan">
              <div class="mb-3">
                <strong>Member:</strong>
                {{ selectedMember?.firstName }} {{ selectedMember?.lastName }} ({{ selectedMember?.email }})
              </div>

              <div class="row g-3">
                <!-- PLAN -->
                <div class="col-md-6">
                  <label class="form-label"><strong>Select Plan </strong></label>
                  <select v-model="enrollmentForm.planId" class="form-select" @change="updatePlanDates"
                    :disabled="plans.length === 0">
                    <option :value="0">-- Select Plan --</option>
                    <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                      {{ plan.name }} - ₹{{ plan.price }} ({{ plan.durationDays }} days)
                    </option>
                    <option v-if="plans.length === 0" value="" disabled style="color: #999; font-style: italic;">
                      No plans available
                    </option>
                  </select>
                </div>

                <!-- SPECIAL PROGRAM -->
                <div class="col-md-6">
                  <label class="form-label"><strong>Select Special Program </strong></label>
                  <select v-model="selectedAddonId" class="form-select" @change="onAddonSelect"
                    :disabled="addons.length === 0">
                    <option :value="0">-- Select Special Program --</option>
                    <option v-for="a in addons" :key="a.id" :value="a.id">
                      {{ a.name }} - ₹{{ a.price }} ({{ a.durationDays }} days)
                    </option>
                    <option v-if="addons.length === 0" value="" disabled style="color: #999; font-style: italic;">
                      No special programs available
                    </option>
                  </select>
                </div>
              </div>

              <!-- PLAN DETAILS -->
              <div v-if="selectedPlan" class="mt-4 p-3 border rounded bg-light">
                <h6 class="mb-3 text-primary">Plan Details</h6>
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Description:</strong> {{ selectedPlan.description }}</p>
                    <p><strong>Duration:</strong> {{ selectedPlan.durationDays }} days</p>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label"><strong>Start Date:</strong></label>
                    <input type="date" v-model="enrollmentForm.startDate" class="form-control"
                      @change="updatePlanDates" />
                    <p class="mt-2"><strong>End Date:</strong> {{ formattedEndDate }}</p>
                  </div>
                </div>

                <div class="row mt-3 g-3">
                  <div class="col-md-4">
                    <label class="form-label"><strong>Price (₹)</strong></label>
                    <input type="number" class="form-control" :value="selectedPlan.price" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Discount (₹)</label>
                    <input type="number" v-model.number="enrollmentForm.discount" class="form-control" min="0"
                      :max="selectedPlan?.price || 0" @input="clampDiscount" placeholder="0" />
                    <small v-if="discountExceedsPrice" class="text-danger">
                      Discount cannot exceed plan price (₹{{ selectedPlan?.price }})
                    </small>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Pending (₹)</label>
                    <input type="number" class="form-control" :value="pendingAmount" readonly />
                  </div>
                </div>
              </div>

              <!-- SPECIAL PROGRAM DETAILS -->
              <div v-if="selectedAddon" class="mt-4 p-3 border rounded bg-light">
                <h6 class="mb-3 text-success">Special Program Details</h6>
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Description:</strong> {{ selectedAddon.description }}</p>
                    <p><strong>Duration:</strong> {{ selectedAddon.durationDays }} days</p>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label"><strong>Start Date:</strong></label>
                    <input type="date" v-model="addonStartDate" class="form-control" @change="updateAddonEndDate"
                      :min="minAddonStartDate" />
                    <p class="mt-2"><strong>End Date:</strong> {{ formattedAddonEndDate }}</p>
                  </div>
                </div>

                <div class="row mt-3 g-3">
                  <div class="col-md-4">
                    <label class="form-label"><strong>Price (₹)</strong></label>
                    <input type="number" class="form-control" :value="selectedAddon.price" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Trainer</label>
                    <select v-model="addonTrainerId" class="form-select">
                      <option :value="null">-- Select Trainer (Optional) --</option>
                      <option v-for="trainer in trainers" :key="trainer.id" :value="trainer.id">
                        {{ trainer.firstName }} {{ trainer.lastName }} ({{ trainer.speciality }})
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Validation Alert -->
              <div v-if="!isFormValid" class="alert alert-warning mt-3">
                <small><strong>Please select at least one:</strong> Plan or Special Program</small>
              </div>

              <button type="submit" class="btn btn-success w-100 mt-4" :disabled="isSubmitting || !isFormValid">
                {{ isSubmitting ? 'Saving...' : 'Save' }}
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

// Updated Trainer interface to match actual response
interface Trainer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  speciality: string
  createdAt: string
  updatedAt: string
  classes: any[]
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
const trainers = ref<Trainer[]>([])
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

const selectedAddonId = ref<number>(0)
const addonTrainerId = ref<number | null>(null)
const addonStartDate = ref('')
const addonEndDate = ref('')

const toastMessage = ref('')

// Toast
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

const minAddonStartDate = computed(() => enrollmentForm.value.startDate || new Date().toISOString().split('T')[0])

const isFormValid = computed(() => {
  const hasPlan = enrollmentForm.value.planId > 0 && enrollmentForm.value.startDate && enrollmentForm.value.endDate
  const hasAddon = selectedAddonId.value && addonStartDate.value && addonEndDate.value
  return hasPlan || hasAddon
})

// Members
const inactiveMembers = computed(() =>
  members.value.filter(m =>
    !m.memberships.length ||
    m.memberships.every(ms => ms.status === 'EXPIRED' || ms.status === 'CANCELLED')
  )
)
// Add this computed property
const discountExceedsPrice = computed(() => {
  return selectedPlan.value && enrollmentForm.value.discount > selectedPlan.value.price
})

// Add this method
const clampDiscount = () => {
  if (!selectedPlan.value) {
    enrollmentForm.value.discount = 0
    return
  }
  if (enrollmentForm.value.discount > selectedPlan.value.price) {
    enrollmentForm.value.discount = selectedPlan.value.price
  }
  if (enrollmentForm.value.discount < 0) {
    enrollmentForm.value.discount = 0
  }
}
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

// Date Calculations
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

  if (selectedAddon.value && !addonStartDate.value) {
    addonStartDate.value = enrollmentForm.value.startDate
    updateAddonEndDate()
  }
}

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

const onAddonSelect = () => {
  const addon = selectedAddon.value
  if (addon) {
    addonStartDate.value = enrollmentForm.value.startDate || new Date().toISOString().split('T')[0]
    updateAddonEndDate()
  } else {
    addonStartDate.value = ''
    addonEndDate.value = ''
    addonTrainerId.value = null
  }
}

const resetAddonFields = () => {
  selectedAddonId.value = 0
  addonTrainerId.value = null
  addonStartDate.value = ''
  addonEndDate.value = ''
}

// Modal
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

// Updated to handle { data: [...] } wrapper
const loadTrainers = async () => {
  try {
    const res: AxiosResponse<{ data: Trainer[] }> = await api.get('/trainers')
    trainers.value = Array.isArray(res.data.data) ? res.data.data : []
  } catch (e) {
    console.error('loadTrainers error:', e)
    showToast('Failed to load trainers.', false)
  }
}

const assignPlan = async () => {
  if (!isFormValid.value) {
    showToast('Please select at least a plan or addon with valid dates.', false)
    return
  }

  isSubmitting.value = true
  let successCount = 0
  let errors: string[] = []

  try {
    if (enrollmentForm.value.planId > 0) {
      try {
        await api.post('/memberships', enrollmentForm.value)
        successCount++
      } catch (err: any) {
        errors.push(`Plan: ${err?.response?.data?.message || 'Failed'}`)
      }
    }

    if (selectedAddonId.value && addonStartDate.value && addonEndDate.value) {
      const payload = {
        memberId: enrollmentForm.value.memberId,
        addonId: selectedAddonId.value,
        trainerId: addonTrainerId.value ?? undefined, // sends null if not selected
        startDate: addonStartDate.value,
        endDate: addonEndDate.value,
        paid: 0,
        discount: 0,
      }
      try {
        await api.post('/member-addons', payload)
        successCount++
      } catch (err: any) {
        errors.push(`Addon: ${err?.response?.data?.message || 'Failed'}`)
      }
    }

    const msg = successCount === 2
      ? 'Plan and addon assigned!'
      : successCount === 1
        ? (enrollmentForm.value.planId > 0 ? 'Plan' : 'Addon') + ' assigned!'
        : ''
    showToast(msg || 'Saved.', true)

    if (errors.length) showToast(errors.join(' | '), false)

    await loadMembers()
    closeAssignModal()
  } catch (e: any) {
    showToast(e?.response?.data?.message || 'Error.', false)
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
  await Promise.all([loadMembers(), loadPlans(), loadAddons(), loadTrainers()])
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

.bg-light {
  background-color: #f8f9fa !important;
}

small.text-muted {
  font-size: 0.7em;
  margin-left: 4px;
}
</style>