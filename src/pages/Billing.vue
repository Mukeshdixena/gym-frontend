<template>
  <div class="container mt-4">
    <h3 class="mb-4">Membership Billing Management</h3>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
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
            <tr v-for="bill in pendingBills" :key="bill.id">
              <td>{{ bill.id }}</td>
              <td>{{ bill.member.firstName }} {{ bill.member.lastName }}</td>
              <td>{{ bill.plan.name }}</td>
              <td>₹{{ bill.plan.price }}</td>
              <td>₹{{ totalPaid(bill) }}</td>
              <td>₹{{ pendingForBill(bill) }}</td>
              <td>
                <span class="badge bg-secondary">{{ bill.status }}</span>
              </td>
              <td>
                <button class="btn btn-primary btn-sm" @click="openAssignModal(bill)">
                  Approve
                </button>
                <button class="btn btn-danger btn-sm ms-2" @click="rejectBill(bill.id)">
                  Reject
                </button>
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
            <tr v-for="bill in approvedBills" :key="bill.id">
              <td>{{ bill.id }}</td>
              <td>{{ bill.member.firstName }} {{ bill.member.lastName }}</td>
              <td>{{ bill.plan.name }}</td>
              <td>₹{{ bill.plan.price }}</td>
              <td>₹{{ totalPaid(bill) }}</td>
              <td>₹{{ pendingForBill(bill) }}</td>
              <td>{{ formatDate(bill.startDate) }}</td>
              <td>{{ formatDate(bill.endDate) }}</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'bg-success': bill.status === 'ACTIVE',
                    'bg-warning text-dark': bill.status === 'PARTIAL_PAID'
                  }"
                >
                  {{ bill.status }}
                </span>
              </td>
              <td class="text-center">
                <div class="dropdown" @click.stop="toggleDropdown(bill.id)">
                  <button class="btn btn-light btn-sm border-0">⋮</button>
                  <div
                    v-if="openDropdownId === bill.id"
                    class="dropdown-menu-custom shadow-sm"
                  >
                    <a
                      v-if="bill.status === 'PARTIAL_PAID'"
                      href="javascript:void(0)"
                      @click="openCollectModal(bill)"
                      class="dropdown-item-custom"
                    >
                      Payment
                    </a>
                    <a
                      href="javascript:void(0)"
                      @click="openHistoryModal(bill)"
                      class="dropdown-item-custom"
                    >
                      Payment History
                    </a>
                    <a
                      href="javascript:void(0)"
                      @click="downloadBill(bill.id)"
                      class="dropdown-item-custom"
                    >
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
    <div
      class="modal fade"
      ref="collectModalRef"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Collect Payment</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeCollectModal"
              aria-label="Close"
            ></button>
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
                  {{ selectedPlan?.name }} - ₹{{ selectedPlan?.price }} ({{
                    selectedPlan?.durationDays
                  }}
                  days)
                </div>

                <div class="mt-3 row g-3">
                  <div class="col-md-4">
                    <label class="form-label"><strong>Plan Price (₹)</strong></label>
                    <input
                      type="number"
                      class="form-control"
                      :value="selectedPlan?.price"
                      readonly
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-primary"
                      ><strong>Discount (₹)</strong></label
                    >
                    <input
                      type="number"
                      class="form-control"
                      :value="enrollmentForm.discount"
                      readonly
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label"><strong>Already Paid (₹)</strong></label>
                    <input
                      type="number"
                      class="form-control"
                      :value="oldPaid"
                      readonly
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label"
                      ><strong>Pending (Before) (₹)</strong></label
                    >
                    <input
                      type="number"
                      class="form-control"
                      :value="oldPending"
                      readonly
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-success"
                      ><strong>Paying Now (₹)</strong></label
                    >
                    <input
                      type="number"
                      class="form-control"
                      v-model.number="newPaidNow"
                      min="0"
                      :max="oldPending"
                      placeholder="Enter amount"
                      @input="validatePayment"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-danger"
                      ><strong>Pending (After) (₹)</strong></label
                    >
                    <input
                      type="number"
                      class="form-control"
                      :value="pendingAfterPayment"
                      readonly
                    />
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
                      <tr
                        v-for="(p, i) in selectedMembership.payments"
                        :key="p.id"
                      >
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
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="updatePayment"
                  :disabled="isSubmitting || newPaidNow <= 0"
                >
                  {{ isSubmitting ? 'Updating...' : 'Update Payment' }}
                </button>
                <button
                  v-if="!isPartialPayment"
                  type="button"
                  class="btn btn-success"
                  @click="approvePayment"
                  :disabled="isSubmitting || pendingAfterPayment > 0"
                >
                  {{ isSubmitting ? 'Approving...' : 'Approve Full Payment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment History Modal -->
    <div
      class="modal fade"
      ref="historyModalRef"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Payment History</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeHistoryModal"
              aria-label="Close"
            ></button>
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
            <button class="btn btn-secondary" @click="closeHistoryModal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// --- Interfaces ---
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
  plan: Plan
  member: Member
  payments: Payment[]
}

// --- State ---
const pendingBills = ref<Membership[]>([])
const approvedBills = ref<Membership[]>([])

const collectModalRef = ref<HTMLElement | null>(null)
const historyModalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)

let collectModal: Modal
let historyModal: Modal
let toastInstance: Toast

const selectedMember = ref<Member | null>(null)
const selectedMembership = ref<Membership | null>(null)
const selectedPlan = ref<Plan | null>(null)

const enrollmentForm = ref({ planId: 0, discount: 0 })

const oldPaid = ref(0)
const oldPending = ref(0)
const newPaidNow = ref(0)
const paymentMethod = ref<'CASH' | 'CARD' | 'UPI' | 'ONLINE'>('CASH')
const isPartialPayment = ref(false)
const isSubmitting = ref(false)

const toastMessage = ref('')

// --- Computed ---
const pendingAfterPayment = computed(() => {
  if (!selectedPlan.value) return 0
  const totalPaid = oldPaid.value + newPaidNow.value
  const netPrice = selectedPlan.value.price - enrollmentForm.value.discount
  return Math.max(netPrice - totalPaid, 0)
})

// --- Helpers ---
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-IN')

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('en-IN')

const totalPaid = (bill: Membership) =>
  bill.payments.reduce((sum, p) => sum + p.amount, 0)

const pendingForBill = (bill: Membership) => {
  const net = bill.plan.price - bill.discount
  return Math.max(net - totalPaid(bill), 0)
}

const validatePayment = () => {
  if (newPaidNow.value > oldPending.value) {
    newPaidNow.value = oldPending.value
  }
  if (newPaidNow.value < 0) newPaidNow.value = 0
}

// --- Toast ---
const showToast = (message: string, isSuccess = true) => {
  toastMessage.value = message
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${
      isSuccess ? 'bg-success' : 'bg-danger'
    } border-0`
    toastInstance?.show()
  }
  setTimeout(() => {
    if (toastMessage.value === message) hideToast()
  }, 4000)
}
const hideToast = () => toastInstance?.hide()

// --- API ---
const loadMemberships = async () => {
  try {
    const res: AxiosResponse<Membership[]> = await api.get('/memberships')
    const data = Array.isArray(res.data) ? res.data : []
    approvedBills.value = data.filter(
      (m) => m.status === 'ACTIVE' || m.status === 'PARTIAL_PAID'
    )
    pendingBills.value = data.filter(
      (m) => !['ACTIVE', 'PARTIAL_PAID'].includes(m.status)
    )
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load memberships.', false)
  }
}

// --- Modals ---
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
  enrollmentForm.value = {
    planId: bill.plan.id,
    discount: bill.discount,
  }
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

const closeHistoryModal = () => {
  historyModal?.hide()
}

const resetForm = () => {
  selectedMembership.value = null
  selectedMember.value = null
  selectedPlan.value = null
  newPaidNow.value = 0
  isSubmitting.value = false
}

// --- Actions ---
const updatePayment = async () => {
  if (newPaidNow.value <= 0) {
    showToast('Enter a valid payment amount.', false)
    return
  }

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
    console.error(err)
    showToast(err.response?.data?.message || 'Payment update failed.', false)
  } finally {
    isSubmitting.value = false
  }
}

const approvePayment = async () => {
  if (pendingAfterPayment.value > 0) {
    showToast('Full amount not paid.', false)
    return
  }
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
  if (!confirm('Reject this bill?')) return
  try {
    await api.patch(`/memberships/${id}`, { status: 'INACTIVE' })
    await loadMemberships()
    showToast('Bill rejected.')
  } catch (err: any) {
    showToast('Rejection failed.', false)
  }
}

const downloadBill = async (id: number) => {
  try {
    const res = await api.get(`/memberships/download-bill/${id}`, {
      responseType: 'blob',
    })
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

// --- Dropdown ---
const openDropdownId = ref<number | null>(null)
const toggleDropdown = (id: number) => {
  openDropdownId.value = openDropdownId.value === id ? null : id
}
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) {
    openDropdownId.value = null
  }
}

// --- Lifecycle ---
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 160px;
}

.dropdown-item-custom {
  display: block;
  padding: 8px 12px;
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
}

.dropdown-item-custom:hover {
  background: #f8f9fa;
}

.btn-sm.border-0 {
  font-size: 1.3rem;
  line-height: 1;
  padding: 0 0.4rem;
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
</style>