<template>
  <div class="container mt-4">
    <!-- ✅ New Enrollment Button -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3>Billing</h3>
      <button class="btn btn-primary" @click="openEnrollmentModal">
        + New Enrollment
      </button>
    </div>

    <!-- ✅ Pending Bills Table -->
    <div class="card mb-4">
      <div class="card-header bg-warning">Pending Bills</div>
      <div class="card-body p-0">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bill in pendingBills" :key="bill.id">
              <td>{{ bill.id }}</td>
              <td>{{ bill.name }}</td>
              <td>{{ bill.plan }}</td>
              <td>₹{{ bill.amount }}</td>
              <td>₹{{ bill.paid || 0 }}</td>
              <td>₹{{ (bill.amount - (bill.paid || 0)).toFixed(2) }}</td>
              <td>
                <button class="btn btn-success btn-sm" @click="openApprovePopup(bill)">Approve</button>
                <button class="btn btn-danger btn-sm ms-2" @click="rejectBill(bill.id)">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ✅ Approved Bills Table -->
    <div class="card">
      <div class="card-header bg-success text-white">Approved Bills</div>
      <div class="card-body p-0">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bill in approvedBills" :key="bill.id">
              <td>{{ bill.id }}</td>
              <td>{{ bill.name }}</td>
              <td>{{ bill.plan }}</td>
              <td>₹{{ bill.amount }}</td>
              <td>₹{{ bill.paid || 0 }}</td>
              <td>₹{{ (bill.amount - (bill.paid || 0)).toFixed(2) }}</td>
              <td>{{ bill.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ✅ Enrollment Modal -->
    <div class="modal fade" ref="enrollmentModalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">New Enrollment</h5>
            <button type="button" class="btn-close" @click="closeEnrollmentModal"></button>
          </div>

          <div class="modal-body">
            <!-- Existing Member Dropdown -->
            <div class="mb-3">
              <label class="form-label">Select Existing Member (Optional)</label>
              <select v-model="enrollmentForm.selectedMember" class="form-select">
                <option value="">-- None (New Member) --</option>
                <option v-for="member in members" :key="member.id" :value="member.id">
                  {{ member.firstName }} {{ member.lastName }} ({{ member.email }})
                </option>
              </select>
            </div>

            <!-- New Member Details -->
            <div v-if="!enrollmentForm.selectedMember">
              <h6 class="mt-3">New Member Details</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">First Name</label>
                  <input v-model="enrollmentForm.firstName" class="form-control" type="text" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Last Name</label>
                  <input v-model="enrollmentForm.lastName" class="form-control" type="text" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input v-model="enrollmentForm.email" class="form-control" type="email" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input v-model="enrollmentForm.phone" class="form-control" type="text" />
                </div>
                <div class="col-md-12">
                  <label class="form-label">Address</label>
                  <input v-model="enrollmentForm.address" class="form-control" type="text" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Date of Birth</label>
                  <input v-model="enrollmentForm.dateOfBirth" class="form-control" type="date" />
                </div>
              </div>
            </div>

            <!-- Plan Selection -->
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
                  <!-- Left Column -->
                  <div class="col-md-6">
                    <p><strong>Description:</strong> {{ selectedPlan.description }}</p>
                    <p><strong>Duration:</strong> {{ selectedPlan.durationDays }} days</p>
                    <!-- <p><strong>Price:</strong> ₹{{ selectedPlan.price }}</p> -->

                  </div>

                  <!-- Right Column -->
                  <div class="col-md-6">
                    <p><strong>Start Date:</strong> {{ formattedStartDate }}</p>
                    <p><strong>End Date:</strong> {{ formattedEndDate }}</p>

                  </div>
                </div>

                <!-- ✅ Payment & Discount Section -->
                <div class="col-md-4">
                  <label class="form-label"><strong> Amount (₹) </strong></label>
                  <input type="number" class="form-control" :value="selectedPlan.price" readonly />
                </div>
              </div>
            </div>

            <div class="mt-4">
              <h6>Payment Details</h6>
              <div class="row g-3">
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
                  <label class="form-label">Pending Amount (₹)</label>
                  <input type="number" class="form-control" :value="pendingAmount" readonly />
                </div>
              </div>
            </div>

            <div class="modal-footer mt-4">
              <button class="btn btn-secondary" @click="closeEnrollmentModal">Cancel</button>
              <button class="btn btn-primary" @click="addNewEnrollment">Add Enrollment</button>
            </div>
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

// ✅ Interfaces
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

interface Bill {
  id: number
  name: string
  plan: string
  amount: number
  paid?: number
  discount?: number
  date?: string
}

// ✅ API URLs
const MEMBERS_API = 'http://localhost:3000/members'
const PLANS_API = 'http://localhost:3000/plans'

// ✅ State
const pendingBills = ref<Bill[]>([])
const approvedBills = ref<Bill[]>([])
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])

// ✅ Modals
const approveModalRef = ref<HTMLElement | null>(null)
const enrollmentModalRef = ref<HTMLElement | null>(null)
let approveModal: Modal
let enrollmentModal: Modal

// ✅ Approve form
const approveForm = ref<Bill>({
  id: 0,
  name: '',
  plan: '',
  amount: 0,
  date: ''
})

// ✅ Enrollment form
const enrollmentForm = ref({
  selectedMember: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  planId: 0,
  startDate: '',
  endDate: '',
  discount: 0,
  paid: 0
})

// ✅ Computed plan details
const selectedPlan = computed(() => plans.value.find((p) => p.id === enrollmentForm.value.planId))

// ✅ Computed formatted dates
const formattedStartDate = computed(() =>
  enrollmentForm.value.startDate ? new Date(enrollmentForm.value.startDate).toLocaleDateString() : ''
)
const formattedEndDate = computed(() =>
  enrollmentForm.value.endDate ? new Date(enrollmentForm.value.endDate).toLocaleDateString() : ''
)

// ✅ Pending Amount Computed
const pendingAmount = computed(() => {
  const planPrice = selectedPlan.value?.price || 0
  const discount = enrollmentForm.value.discount || 0
  const paid = enrollmentForm.value.paid || 0
  return Math.max(planPrice - discount - paid, 0)
})

onMounted(async () => {
  if (approveModalRef.value) approveModal = new Modal(approveModalRef.value)
  if (enrollmentModalRef.value) enrollmentModal = new Modal(enrollmentModalRef.value)
  await loadMembers()
  await loadPlans()
  await loadPendingBills()
  await loadApprovedBills()
})


async function loadMembers() {
  const res = await axios.get<Member[]>(MEMBERS_API)
  members.value = res.data
}

async function loadPlans() {
  const res = await axios.get<Plan[]>(PLANS_API)
  plans.value = res.data
}

function updatePlanDates() {
  const plan = selectedPlan.value
  if (!plan) return

  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() + plan.durationDays)

  enrollmentForm.value.startDate = today.toISOString().split('T')[0]
  enrollmentForm.value.endDate = end.toISOString().split('T')[0]
}

async function approveBill(membershipId: number) {
  try {
    await axios.patch(`http://localhost:3000/enrollments/approve/${membershipId}`);
    await loadPendingBills();
    await loadApprovedBills();
  } catch (err) {
    console.error(err);
    alert('Failed to approve bill.');
  }
}

async function rejectBill(membershipId: number) {
  try {
    await axios.delete(`http://localhost:3000/enrollments/reject/${membershipId}`);
    await loadPendingBills();
  } catch (err) {
    console.error(err);
    alert('Failed to reject bill.');
  }
}

async function loadApprovedBills() {
  try {
    const res = await axios.get('http://localhost:3000/enrollments/approved-bills');
    approvedBills.value = res.data;
  } catch (err) {
    console.error('Failed to load approved bills:', err);
  }
}


function updatePendingAmount() {
}

function openApprovePopup(bill: Bill) {
  approveForm.value = { ...bill }
  approveModal.show()
}

function closeApproveModal() {
  approveModal.hide()
}



// ✅ Enrollment Modal
function openEnrollmentModal() {
  enrollmentModal.show()
}

function closeEnrollmentModal() {
  enrollmentModal.hide()
}

async function addNewEnrollment() {
  console.log('Enrollment Form Values:', enrollmentForm.value);

  try {
    await axios.post('http://localhost:3000/enrollments', {
      selectedMember: enrollmentForm.value.selectedMember || undefined,
      firstName: enrollmentForm.value.firstName || undefined,
      lastName: enrollmentForm.value.lastName || undefined,
      email: enrollmentForm.value.email || undefined,
      phone: enrollmentForm.value.phone || undefined,
      address: enrollmentForm.value.address || undefined,
      dateOfBirth: enrollmentForm.value.dateOfBirth || undefined,
      planId: enrollmentForm.value.planId,
      startDate: enrollmentForm.value.startDate,
      endDate: enrollmentForm.value.endDate,
      discount: enrollmentForm.value.discount,
      paid: enrollmentForm.value.paid,
    });

    await loadPendingBills();

    enrollmentForm.value = {
      selectedMember: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      planId: 0,
      startDate: '',
      endDate: '',
      discount: 0,
      paid: 0,
    };

    closeEnrollmentModal();
  } catch (err) {
    console.error('Failed to create enrollment:', err);
    alert('Failed to create enrollment. Check console.');
  }
}


async function loadPendingBills() {
  try {
    const res = await axios.get('http://localhost:3000/enrollments/pending-bills');
    pendingBills.value = res.data;
  } catch (err) {
    console.error('Failed to load pending bills:', err);
  }
}



</script>
