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
                <button class="btn btn-success btn-sm" @click="openAssignModal(bill)">
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
            <h5 class="modal-title">Collect Payment / Apply Discount</h5>
            <button type="button" class="btn-close" @click="closeAssignModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="assignPlan">
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
                    <input type="number" class="form-control" v-model.number="enrollmentForm.discount"
                      @input="updatePendingAmount" placeholder="Enter discount" />
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
                    <input type="number" class="form-control" v-model.number="newPaidNow" @input="updatePendingAmount"
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

              <button type="submit" class="btn btn-success w-100 mt-4">
                {{ pendingAmount === 0 ? 'Mark as Fully Paid' : 'Update Payment' }}
              </button>
              <button type="submit" class="btn btn-success w-100 mt-4">
                {{ pendingAmount === 0 ? 'Mark as Fully Paid' : 'Update Payment' }}
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

interface Member { id: number; firstName: string; lastName: string }
interface Plan { id: number; name: string; price: number; durationDays: number }
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
  approvedBills.value = res.data.filter(m => m.status === 'ACTIVE')
  pendingBills.value = res.data.filter(m => m.status !== 'ACTIVE')
}

function openAssignModal(bill: Membership) {
  selectedMembership.value = bill
  selectedMember.value = bill.member
  enrollmentForm.value.planId = bill.plan.id
  enrollmentForm.value.discount = bill.discount
  oldPaid.value = bill.paid
  oldPending.value = bill.pending
  newPaidNow.value = 0
  paymentMethod.value = 'CASH'
  assignModal.show()
}

function closeAssignModal() { assignModal.hide() }
function updatePendingAmount() { } // auto via computed

async function assignPlan() {
  if (!selectedMembership.value || !selectedPlan.value) return
  if (newPaidNow.value <= 0 && enrollmentForm.value.discount <= 0) {
    showToast('Enter some payment or discount to apply.', false)
    return
  }
  try {
    await axios.patch(`${API_BASE_URL}/memberships/payment/${selectedMembership.value.id}`, {
      amount: newPaidNow.value,
      discount: enrollmentForm.value.discount,
      method: paymentMethod.value
    })
    await loadMemberships()
    closeAssignModal()
    showToast('Payment updated successfully!')
  } catch (err) {
    console.error(err)
    showToast('Error updating payment. Please try again.', false)
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
