<template>
  <div class="container mt-4">
    <h3 class="mb-4">Membership Billing Management</h3>

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

    <!-- Pending Bills Section -->
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
              <td>₹{{ bill.paid || 0 }}</td>
              <td>₹{{ bill.pending || 0 }}</td>
              <td><span class="badge bg-secondary">{{ bill.status }}</span></td>
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

    <!-- Approved Bills Section -->
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
              <td>₹{{ bill.paid || 0 }}</td>
              <td>₹{{ bill.pending || 0 }}</td>
              <td>{{ new Date(bill.startDate).toLocaleDateString() }}</td>
              <td>{{ new Date(bill.endDate).toLocaleDateString() }}</td>
              <td><span class="badge bg-success">{{ bill.status }}</span></td>
              <td>
                <button v-if="bill.status === 'PARTIAL_PAID'" class="btn btn-primary btn-sm"
                  @click="openCollectModal(bill)">
                  Collect Bill
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Payment Collection Modal -->
    <div class="modal fade" ref="assignModalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Collect Payment</h5>
            <button type="button" class="btn-close" @click="closeAssignModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="mb-3">
                <strong>Member:</strong>
                <span>{{ selectedMember?.firstName }} {{ selectedMember?.lastName }}</span>
              </div>

              <div class="mt-4">
                <h6>Membership Plan</h6>
                <div class="form-control-plaintext">
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
                    <label class="form-label"><strong>Pending (Before Payment) (₹)</strong></label>
                    <input type="number" class="form-control" :value="oldPending" readonly />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-success"><strong>Paying Now (₹)</strong></label>
                    <input type="number" class="form-control" v-model.number="newPaidNow"
                      placeholder="Enter payment amount" />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-danger"><strong>Pending (After Payment) (₹)</strong></label>
                    <input type="number" class="form-control" :value="pendingAmount" readonly />
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
                        <th>Payment Date</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(payment, index) in selectedMembership.payments" :key="payment.id">
                        <td>{{ index + 1 }}</td>
                        <td>₹{{ payment.amount }}</td>
                        <td>{{ new Date(payment.paymentDate).toLocaleString() }}</td>
                        <td>{{ payment.method }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="mt-3 text-muted">No payments made yet.</div>

              <!-- Modal Buttons -->
              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="updatePayment">
                  Update Payment
                </button>
                <button v-if="!isPartialPayment" type="button" class="btn btn-success" @click="approvePayment">
                  Approve
                </button>
              </div>
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

interface Member { id: number; firstName: string; lastName: string }
interface Plan { id: number; name: string; price: number; durationDays: number }
interface Payment { id: number; amount: number; paymentDate: string; method: string }
interface Membership {
  id: number
  planId: number
  memberId: number
  startDate: string
  endDate: string
  status: string
  discount: number
  paid: number
  pending: number
  plan: Plan
  member: Member
  payments: Payment[]
}

const pendingBills = ref<Membership[]>([])
const approvedBills = ref<Membership[]>([])
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])

const assignModalRef = ref<HTMLElement | null>(null)
let assignModal: Modal

const selectedMember = ref<Member | null>(null)
const selectedMembership = ref<Membership | null>(null)

const enrollmentForm = ref({ planId: 0, discount: 0 })
const oldPaid = ref(0)
const oldPending = ref(0)
const newPaidNow = ref(0)
const paymentMethod = ref('CASH')
const isPartialPayment = ref(false) // controls modal approve button

const selectedPlan = computed(() => plans.value.find(p => p.id === enrollmentForm.value.planId))
const pendingAmount = computed(() =>
  Math.max((selectedPlan.value?.price || 0) - enrollmentForm.value.discount - (oldPaid.value + newPaidNow.value), 0)
)

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

onMounted(async () => {
  if (assignModalRef.value) assignModal = new Modal(assignModalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await Promise.all([loadMembers(), loadPlans(), loadMemberships()])
})

async function loadMembers() {
  const res = await axios.get<Member[]>(`${API_BASE_URL}/members`)
  members.value = res.data
}

async function loadPlans() {
  const res = await axios.get<Plan[]>(`${API_BASE_URL}/plans`)
  plans.value = res.data
}

async function loadMemberships() {
  const res = await axios.get<Membership[]>(`${API_BASE_URL}/memberships`)
  approvedBills.value = res.data.filter(m => m.status === 'ACTIVE' || m.status === 'PARTIAL_PAID')
  pendingBills.value = res.data.filter(m => m.status !== 'ACTIVE' && m.status !== 'PARTIAL_PAID')
}

function openAssignModal(bill: Membership) {
  selectedMembership.value = bill
  selectedMember.value = bill.member
  enrollmentForm.value.planId = bill.plan.id
  enrollmentForm.value.discount = bill.discount
  oldPaid.value = bill.payments.reduce((sum, p) => sum + p.amount, 0)
  oldPending.value = bill.plan.price - enrollmentForm.value.discount - oldPaid.value
  newPaidNow.value = 0
  paymentMethod.value = 'CASH'
  isPartialPayment.value = false
  assignModal.show()
}

function openCollectModal(bill: Membership) {
  selectedMembership.value = bill
  selectedMember.value = bill.member
  enrollmentForm.value.planId = bill.plan.id
  enrollmentForm.value.discount = bill.discount
  oldPaid.value = bill.payments.reduce((sum, p) => sum + p.amount, 0)
  oldPending.value = bill.plan.price - enrollmentForm.value.discount - oldPaid.value
  newPaidNow.value = 0
  paymentMethod.value = 'CASH'
  isPartialPayment.value = true
  assignModal.show()
}

function closeAssignModal() { assignModal.hide() }

// Only update payment
async function updatePayment() {
  if (!selectedMembership.value || !selectedPlan.value) return
  if (newPaidNow.value <= 0) {
    showToast('Enter some payment to apply.', false)
    return
  }
  try {
    const patchData: any = {
      amount: newPaidNow.value,
      method: paymentMethod.value
    }

    // if (isPartialPayment.value) patchData.status = 'PARTIAL_PAID'
    if (pendingAmount.value === 0) patchData.status = 'ACTIVE'
    else patchData.status = 'PARTIAL_PAID'

    await axios.patch(`${API_BASE_URL}/memberships/payment/${selectedMembership.value.id}`, patchData)
    await loadMemberships()
    closeAssignModal()
    showToast('Payment updated successfully!')
  } catch (err) {
    console.error(err)
    showToast('Error updating payment. Please try again.', false)
  }
}

// Approve payment
async function approvePayment() {
  if (!selectedMembership.value || !selectedPlan.value) return
  try {
    await axios.patch(`${API_BASE_URL}/memberships/payment/${selectedMembership.value.id}`, {
      amount: newPaidNow.value,
      method: paymentMethod.value,
      status: 'PARTIAL_PAID'
    })
    await loadMemberships()
    closeAssignModal()
    showToast('Payment approved and status updated!')
  } catch (err) {
    console.error(err)
    showToast('Error approving payment. Please try again.', false)
  }
}


async function rejectBill(id: number) {
  try {
    await axios.patch(`${API_BASE_URL}/memberships/${id}`, { status: 'INACTIVE' })
    await loadMemberships()
    showToast('Bill rejected successfully.', false)
  } catch (err) {
    console.error(err)
    showToast('Failed to reject bill.', false)
  }
}
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
