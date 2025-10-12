<template>
  <div class="container mt-4">
    <h3 class="mb-4">Membership Billing Management</h3>

    <!-- ✅ Pending Bills Section -->
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
                  Collect Payment
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

    <!-- ✅ Approved Bills Section -->
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

    <!-- ✅ Payment Collection Modal -->
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
                    <input
                      type="number"
                      class="form-control"
                      v-model.number="enrollmentForm.discount"
                      @input="updatePendingAmount"
                      placeholder="Enter discount"
                    />
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
                    <input
                      type="number"
                      class="form-control"
                      v-model.number="newPaidNow"
                      @input="updatePendingAmount"
                      placeholder="Enter payment amount"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label text-danger"><strong>Pending (After Payment) (₹)</strong></label>
                    <input type="number" class="form-control" :value="pendingAmount" readonly />
                  </div>
                </div>
              </div>

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
import { Modal } from 'bootstrap'

interface Member {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  dateOfBirth?: string
}

interface Plan {
  id: number
  name: string
  description?: string
  price: number
  durationDays: number
}

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

const MEMBERS_API = 'http://localhost:3000/members'
const PLANS_API = 'http://localhost:3000/plans'
const MEMBERSHIPS_API = 'http://localhost:3000/memberships'

const pendingBills = ref<Membership[]>([])
const approvedBills = ref<Membership[]>([])
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])

const assignModalRef = ref<HTMLElement | null>(null)
let assignModal: Modal

const selectedMember = ref<Member | null>(null)
const selectedMembership = ref<Membership | null>(null)

const enrollmentForm = ref({
  planId: 0,
  discount: 0
})

const oldPaid = ref(0)
const oldPending = ref(0)
const newPaidNow = ref(0)

const selectedPlan = computed(() =>
  plans.value.find(p => p.id === enrollmentForm.value.planId)
)

const pendingAmount = computed(() => {
  const planPrice = selectedPlan.value?.price || 0
  const discount = enrollmentForm.value.discount || 0
  const totalPaid = oldPaid.value + newPaidNow.value
  return Math.max(planPrice - discount - totalPaid, 0)
})

onMounted(async () => {
  if (assignModalRef.value) assignModal = new Modal(assignModalRef.value)
  await Promise.all([loadMembers(), loadPlans(), loadMemberships()])
})

async function loadMembers() {
  const res = await axios.get<Member[]>(MEMBERS_API)
  members.value = res.data
}

async function loadPlans() {
  const res = await axios.get<Plan[]>(PLANS_API)
  plans.value = res.data
}

async function loadMemberships() {
  const res = await axios.get<Membership[]>(MEMBERSHIPS_API)
  const data = res.data
  approvedBills.value = data.filter(m => m.status === 'ACTIVE')
  pendingBills.value = data.filter(m => m.status !== 'ACTIVE')
}

function openAssignModal(bill: Membership) {
  selectedMembership.value = bill
  selectedMember.value = bill.member

  enrollmentForm.value.planId = bill.plan.id
  enrollmentForm.value.discount = bill.discount
  oldPaid.value = bill.paid
  oldPending.value = bill.pending
  newPaidNow.value = 0

  assignModal.show()
}

function closeAssignModal() {
  assignModal.hide()
}

function updatePendingAmount() {
  // Computed auto recalculates pending
}

async function assignPlan() {
  if (!selectedMembership.value || !selectedPlan.value) return

  const plan = selectedPlan.value
  const totalPaid = oldPaid.value + newPaidNow.value
  const discount = enrollmentForm.value.discount
  const remaining = Math.max(plan.price - discount - totalPaid, 0)
  const status = remaining === 0 ? 'ACTIVE' : 'PENDING'

  try {
    await axios.patch(`${MEMBERSHIPS_API}/${selectedMembership.value.id}`, {
      paid: totalPaid,
      pending: remaining,
      discount,
      status
    })
    await loadMemberships()
    closeAssignModal()
  } catch (err) {
    console.error('Failed to update payment:', err)
    alert('Error updating payment. Please try again.')
  }
}

async function rejectBill(id: number) {
  await axios.patch(`${MEMBERSHIPS_API}/${id}`, { status: 'INACTIVE' })
  await loadMemberships()
}
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
