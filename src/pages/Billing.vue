<template>
  <div class="container mt-4">
    <h3 class="mb-4">Membership Billing Management</h3>

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

    <!-- ==== FILTERS ==== -->
    <div class="row g-3 mb-3">
      <div class="col-md-4">
        <input type="text" class="form-control form-control-sm" placeholder="Member name / email"
          v-model="filterMember" />
      </div>
      <div class="col-md-3">
        <select class="form-select form-select-sm" v-model="filterPlan">
          <option :value="null">All Plans</option>
          <option v-for="p in uniquePlans" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <select class="form-select form-select-sm" v-model="filterStatus">
          <option :value="null">All Statuses</option>
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="col-md-2">
        <button class="btn btn-outline-secondary btn-sm w-100" @click="resetFilters">Clear</button>
      </div>
    </div>

    <!-- Pending Bills -->
    <div class="card mb-4 shadow-sm">
      <div class="card-header bg-warning text-dark fw-bold">Pending Bills</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>Plan</th>
              <th>Price</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bill in filteredPendingBills" :key="bill.id">
              <td>{{ bill.id }}</td>
              <td>{{ bill.member.firstName }} {{ bill.member.lastName }}</td>
              <td>{{ bill.plan.name }}</td>
              <td>₹{{ bill.plan.price }}</td>
              <td>₹{{ totalPaid(bill) }}</td>
              <td>₹{{ pendingForBill(bill) }}</td>
              <td><span class="badge bg-secondary">{{ bill.status }}</span></td>
              <td>
                <button class="btn btn-primary btn-sm" @click="openAssignModal(bill)">Approve</button>
                <button class="btn btn-danger btn-sm ms-2" @click="rejectBill(bill.id)">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Approved Bills -->
    <div class="card shadow-sm">
      <div class="card-header bg-success text-white fw-bold">Approved Bills</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>Plan</th>
              <th>Price</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bill in filteredApprovedBills" :key="bill.id">
              <td>{{ bill.id }}</td>
              <td>{{ bill.member.firstName }} {{ bill.member.lastName }}</td>
              <td>{{ bill.plan.name }}</td>
              <td>₹{{ bill.plan.price }}</td>
              <td>₹{{ totalPaid(bill) }}</td>
              <td>₹{{ pendingForBill(bill) }}</td>
              <td>{{ formatDate(bill.startDate) }}</td>
              <td>{{ formatDate(bill.endDate) }}</td>
              <td>
                <span class="badge"
                  :class="{ 'bg-success': bill.status === 'ACTIVE', 'bg-warning text-dark': bill.status === 'PARTIAL_PAID' }">
                  {{ bill.status }}
                </span>
              </td>
              <td class="text-center">
                <div class="dropdown" @click.stop="toggleDropdown(bill.id)">
                  <button class="btn btn-light btn-sm border-0">...</button>
                  <div v-if="openDropdownId === bill.id" class="dropdown-menu-custom shadow-sm">
                    <a v-if="bill.status === 'PARTIAL_PAID'" href="javascript:void(0)" @click="openCollectModal(bill)"
                      class="dropdown-item-custom">Payment</a>
                    <a href="javascript:void(0)" @click="openHistoryModal(bill)" class="dropdown-item-custom">
                      Payment History
                    </a>
                    <a href="javascript:void(0)" @click="downloadBill(bill.id)" class="dropdown-item-custom">
                      Download Bill
                    </a>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Collect Payment Modal -->
    <div class="modal fade" ref="collectModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Collect Payment</h5>
            <button type="button" class="btn-close" @click="closeCollectModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="mb-3">
                <strong>Member:</strong>
                <span>{{ selectedMember?.firstName }} {{ selectedMember?.lastName }}</span>
                ({{ selectedMember?.email }})
              </div>

              <div class="mt-4">
                <h6>Membership Plan</h6>
                <div class="form-control-plaintext p-2 bg-light rounded">
                  {{ selectedPlan?.name }} - ₹{{ selectedPlan?.price }} ({{ selectedPlan?.durationDays }} days)
                </div>

                <div class="mt-3 row g-3">
                  <div class="col-md-4">
                    <label class="form-label"><strong>Plan Price (₹)</strong></label>
                    <input type="number" class="form-control" :value="selectedPlan?.price" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-primary"><strong>Discount (₹)</strong></label>
                    <input type="number" class="form-control" :value="enrollmentForm.discount" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label"><strong>Already Paid (₹)</strong></label>
                    <input type="number" class="form-control" :value="oldPaid" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label"><strong>Pending (Before) (₹)</strong></label>
                    <input type="number" class="form-control" :value="oldPending" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-success"><strong>Paying Now (₹)</strong></label>
                    <input type="number" class="form-control" v-model.number="newPaidNow" min="0" :max="oldPending"
                      placeholder="Enter amount" @input="validatePayment" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-danger"><strong>Pending (After) (₹)</strong></label>
                    <input type="number" class="form-control" :value="pendingAfterPayment" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label"><strong>Payment Method</strong></label>
                    <select v-model="paymentMethod" class="form-select">
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Payment History -->
              <div v-if="selectedMembership?.payments?.length" class="mt-4">
                <h6>Payment History</h6>
                <div class="table-responsive">
                  <table class="table table-sm table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>#</th>
                        <th>Amount (₹)</th>
                        <th>Date</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(p, i) in selectedMembership.payments" :key="p.id">
                        <td>{{ i + 1 }}</td>
                        <td>₹{{ p.amount }}</td>
                        <td>{{ formatDateTime(p.paymentDate) }}</td>
                        <td>{{ p.method }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="mt-3 text-muted">No payments made yet.</div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="updatePayment"
                  :disabled="isSubmitting || newPaidNow <= 0">
                  {{ isSubmitting ? 'Updating...' : 'Update Payment' }}
                </button>
                <button v-if="!isPartialPayment" type="button" class="btn btn-success" @click="approvePayment"
                  :disabled="isSubmitting || pendingAfterPayment > 0">
                  {{ isSubmitting ? 'Approving...' : 'Approve Full Payment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment History Modal -->
    <div class="modal fade" ref="historyModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Payment History</h5>
            <button type="button" class="btn-close" @click="closeHistoryModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedMembership?.payments?.length">
              <table class="table table-sm table-bordered">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Amount (₹)</th>
                    <th>Date</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in selectedMembership.payments" :key="p.id">
                    <td>{{ i + 1 }}</td>
                    <td>₹{{ p.amount }}</td>
                    <td>{{ formatDateTime(p.paymentDate) }}</td>
                    <td>{{ p.method }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-muted">No payments found.</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeHistoryModal">Close</button>
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
            <h5 class="modal-title fs-6">Confirm Action</h5>
            <button type="button" class="btn-close" @click="resolveConfirm(false)"></button>
          </div>
          <div class="modal-body pt-2 pb-3">{{ confirmMessage }}</div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="resolveConfirm(false)">Cancel</button>
            <button type="button" class="btn btn-danger btn-sm" @click="resolveConfirm(true)">OK</button>
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
// Interfaces (match your API response)
// ──────────────────────────────────────────────────────────────
interface Member {
  id: number
  firstName: string
  lastName: string
  email: string
}
interface Plan {
  id: number
  name: string
  price: number
  durationDays: number
}
interface Payment {
  id: number
  amount: number
  paymentDate: string
  method: string
}
interface Membership {
  id: number
  planId: number
  memberId: number
  startDate: string
  endDate: string
  status: string
  discount: number
  paid?: number
  pending?: number
  createdAt: string
  updatedAt: string
  plan: Plan
  member: Member
  payments: Payment[]
}

// ──────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────
const pendingBills = ref<Membership[]>([])
const approvedBills = ref<Membership[]>([])

// Filters
const filterMember = ref('')
const filterPlan = ref<number | null>(null)
const filterStatus = ref<string | null>(null)

// Modal / Toast refs
const collectModalRef = ref<HTMLElement | null>(null)
const historyModalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)

let collectModal: Modal
let historyModal: Modal
let toastInstance: Toast

// Modal data
const selectedMember = ref<Member | null>(null)
const selectedMembership = ref<Membership | null>(null)
const selectedPlan = ref<Plan | null>(null)

const enrollmentForm = ref({ planId: 0, discount: 0 })
const oldPaid = ref(0)
const oldPending = ref(0)
const newPaidNow = ref(0)
const paymentMethod = ref<'CASH' | 'CARD' | 'UPI' | 'ONLINE'>('CASH')
const isPartialPayment = ref(false)          // ← fixed typo
const isSubmitting = ref(false)

const toastMessage = ref('')

// ──────────────────────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────────────────────
const pendingAfterPayment = computed(() => {
  if (!selectedPlan.value) return 0
  const totalPaid = oldPaid.value + newPaidNow.value
  const netPrice = selectedPlan.value.price - enrollmentForm.value.discount
  return Math.max(netPrice - totalPaid, 0)
})

// ── Latest payment date (fallback to updatedAt / createdAt) ──
const latestPaymentDate = (m: Membership): Date => {
  if (m.payments?.length) {
    return new Date(Math.max(...m.payments.map(p => new Date(p.paymentDate).getTime())))
  }
  return new Date(m.updatedAt || m.createdAt)
}

// ── Filtered + sorted lists ──
const filteredPendingBills = computed(() => applyFilters(pendingBills.value))

const filteredApprovedBills = computed(() => {
  const sorted = [...approvedBills.value].sort((a, b) => {
    return latestPaymentDate(b).getTime() - latestPaymentDate(a).getTime()
  })
  return applyFilters(sorted)
})

// ── Filter helpers ──
const uniquePlans = computed(() => {
  const map = new Map<number, Plan>()
    ;[...pendingBills.value, ...approvedBills.value].forEach(m => map.set(m.plan.id, m.plan))
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const statusOptions = computed(() => {
  const set = new Set<string>()
    ;[...pendingBills.value, ...approvedBills.value].forEach(m => set.add(m.status))
  return Array.from(set).sort()
})

// ── Actual filter function (now a normal function) ──
function applyFilters(list: Membership[]) {
  return list.filter(m => {
    const memberMatch = !filterMember.value ||
      `${m.member.firstName} ${m.member.lastName}`.toLowerCase().includes(filterMember.value.toLowerCase()) ||
      m.member.email.toLowerCase().includes(filterMember.value.toLowerCase())

    const planMatch = filterPlan.value === null || m.plan.id === filterPlan.value
    const statusMatch = filterStatus.value === null || m.status === filterStatus.value

    return memberMatch && planMatch && statusMatch
  })
}

// ── Reset filters ──
const resetFilters = () => {
  filterMember.value = ''
  filterPlan.value = null
  filterStatus.value = null
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN')
const formatDateTime = (d: string) => new Date(d).toLocaleString('en-IN')

const totalPaid = (bill: Membership) => bill.payments.reduce((s, p) => s + p.amount, 0)

const pendingForBill = (bill: Membership) => {
  const net = bill.plan.price - bill.discount
  return Math.max(net - totalPaid(bill), 0)
}

const validatePayment = () => {
  if (newPaidNow.value > oldPending.value) newPaidNow.value = oldPending.value
  if (newPaidNow.value < 0) newPaidNow.value = 0
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
const loadMemberships = async () => {
  try {
    const res: AxiosResponse<Membership[]> = await api.get('/memberships')
    const data = Array.isArray(res.data) ? res.data : []
    approvedBills.value = data.filter(m => ['ACTIVE', 'PARTIAL_PAID'].includes(m.status))
    pendingBills.value = data.filter(m => !['ACTIVE', 'PARTIAL_PAID'].includes(m.status))
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load memberships.', false)
  }
}

// ──────────────────────────────────────────────────────────────
// Modals
// ──────────────────────────────────────────────────────────────
const openAssignModal = (bill: Membership) => {
  setupModal(bill, false)
  collectModal?.show()
}
const openCollectModal = (bill: Membership) => {
  setupModal(bill, true)
  collectModal?.show()
}
const setupModal = (bill: Membership, partial: boolean) => {
  selectedMembership.value = bill
  selectedMember.value = bill.member
  selectedPlan.value = bill.plan
  enrollmentForm.value = { planId: bill.plan.id, discount: bill.discount }
  oldPaid.value = totalPaid(bill)
  oldPending.value = pendingForBill(bill)
  newPaidNow.value = 0
  paymentMethod.value = 'CASH'
  isPartialPayment.value = partial
}
const closeCollectModal = () => {
  collectModal?.hide()
  resetForm()
}
const openHistoryModal = (bill: Membership) => {
  selectedMembership.value = bill
  historyModal?.show()
}
const closeHistoryModal = () => historyModal?.hide()
const resetForm = () => {
  selectedMembership.value = null
  selectedMember.value = null
  selectedPlan.value = null
  newPaidNow.value = 0
  isSubmitting.value = false
}

// ──────────────────────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────────────────────
const updatePayment = async () => {
  if (newPaidNow.value <= 0) return showToast('Enter a valid payment amount.', false)
  isSubmitting.value = true
  try {
    const payload = {
      amount: newPaidNow.value,
      method: paymentMethod.value,
      status: pendingAfterPayment.value === 0 ? 'ACTIVE' : 'PARTIAL_PAID',
    }
    await api.patch(`/memberships/payment/${selectedMembership.value!.id}`, payload)
    await loadMemberships()
    showToast('Payment updated successfully!')
    closeCollectModal()
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Payment update failed.', false)
  } finally {
    isSubmitting.value = false
  }
}

const approvePayment = async () => {
  if (pendingAfterPayment.value > 0) return showToast('Full amount not paid.', false)
  const ok = await showConfirm('Approve this payment and activate the membership?')
  if (!ok) return
  isSubmitting.value = true
  try {
    await api.patch(`/memberships/payment/${selectedMembership.value!.id}`, {
      amount: newPaidNow.value,
      method: paymentMethod.value,
      status: 'ACTIVE',
    })
    await loadMemberships()
    showToast('Membership approved!')
    closeCollectModal()
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Approval failed.', false)
  } finally {
    isSubmitting.value = false
  }
}

const rejectBill = async (id: number) => {
  const ok = await showConfirm('Reject this bill?')
  if (!ok) return
  try {
    await api.delete(`/memberships/${id}`)
    await loadMemberships()
    showToast('Bill rejected successfully.')
  } catch (err: any) {
    showToast('Rejection failed. Please try again.', false)
  }
}

const downloadBill = async (id: number) => {
  try {
    const res = await api.get(`/memberships/download-bill/${id}`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bill_${id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    showToast('Download failed.', false)
  }
}

// ──────────────────────────────────────────────────────────────
// Dropdown
// ──────────────────────────────────────────────────────────────
const openDropdownId = ref<number | null>(null)
const toggleDropdown = (id: number) => {
  openDropdownId.value = openDropdownId.value === id ? null : id
}
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null
}

// ──────────────────────────────────────────────────────────────
// Confirm Modal
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

// ──────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────
onMounted(async () => {
  if (collectModalRef.value) collectModal = new Modal(collectModalRef.value)
  if (historyModalRef.value) historyModal = new Modal(historyModalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)

  document.addEventListener('click', handleClickOutside)
  await loadMemberships()
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

.card-body {
  overflow: visible !important;
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

input[readonly],
.form-control-plaintext {
  background-color: #f8f9fa !important;
}

.modal-sm .modal-content {
  border-radius: .5rem;
}
</style>