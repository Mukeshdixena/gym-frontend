<template>
  <div class="container mt-4">
    <h3 class="mb-4">Assign Membership Plans</h3>

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

    <!-- ✅ Assign Plan Modal -->
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
                    <!-- Left Column -->
                    <div class="col-md-6">
                      <p><strong>Description:</strong> {{ selectedPlan.description }}</p>
                      <p><strong>Duration:</strong> {{ selectedPlan.durationDays }} days</p>
                    </div>

                    <!-- Right Column -->
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
import { ref, computed, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import axios from 'axios';

const membersApi = 'http://localhost:3000/members';
const plansApi = 'http://localhost:3000/plans';
const membershipsApi = 'http://localhost:3000/memberships';

interface Plan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  description: string;
}
interface Membership {
  id: number;
  planId: number;
  memberId: number;
  startDate: string;
  endDate: string;
  status: string;
}
interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  memberships: Membership[];
}

// State
const members = ref<Member[]>([]);
const plans = ref<Plan[]>([]);
const assignModalRef = ref<HTMLElement | null>(null);
const selectedMember = ref<Member | null>(null);

// Form
const enrollmentForm = ref({
  memberId: 0,
  planId: 0,
  startDate: '',
  endDate: '',
  paid: 0,
  discount: 0,
});

const selectedPlan = computed(() =>
  plans.value.find((p) => p.id === enrollmentForm.value.planId)
);

const formattedEndDate = computed(() =>
  enrollmentForm.value.endDate
    ? new Date(enrollmentForm.value.endDate).toLocaleDateString()
    : ''
);

// Derived lists
const inactiveMembers = computed(() =>
  members.value.filter((m) => !m.memberships.length || m.memberships[0].status !== 'ACTIVE')
);

const expiringMembers = computed(() => {
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 7);
  return members.value.filter((m) => {
    const end = m.memberships[0]?.endDate ? new Date(m.memberships[0].endDate) : null;
    return end && end <= soon && end >= now;
  });
});

const pendingAmount = computed(() => {
  if (!selectedPlan.value) return 0;
  return selectedPlan.value.price - (enrollmentForm.value.discount + enrollmentForm.value.paid);
});

// Methods
function formatDate(dateStr?: string) {
  return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
}

function getPlanName(id?: number) {
  return plans.value.find((p) => p.id === id)?.name ?? 'N/A';
}

function updatePlanDates() {
  const plan = selectedPlan.value;
  if (plan && enrollmentForm.value.startDate) {
    const start = new Date(enrollmentForm.value.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + plan.durationDays);
    enrollmentForm.value.endDate = end.toISOString().split('T')[0];
  }
}

function updatePendingAmount() {
  // Re-compute automatically via computed property
}

function openAssignModal(member: Member) {
  selectedMember.value = member;
  enrollmentForm.value = {
    memberId: member.id,
    planId: 0,
    startDate: '',
    endDate: '',
    paid: 0,
    discount: 0,
  };
  if (assignModalRef.value) new Modal(assignModalRef.value).show();
}

function closeAssignModal() {
  if (assignModalRef.value) Modal.getInstance(assignModalRef.value)?.hide();
}

async function assignPlan() {
  if (!enrollmentForm.value.planId || !enrollmentForm.value.startDate) {
    alert('Please select plan and start date.');
    return;
  }

  try {
    console.log('Assigning plan with data:', enrollmentForm.value);
    await axios.post(membershipsApi, enrollmentForm.value);
    alert('Plan assigned successfully!');
    closeAssignModal();
    loadMembers();
  } catch (err) {
    console.error(err);
    alert('Failed to assign plan.');
  }
}
async function loadMembers() {
  try {
    const resMembers = await axios.get(membersApi);
    members.value = Array.isArray(resMembers.data.data) ? resMembers.data.data : [];
  } catch (err) {
    console.error(err);
  }
}

onMounted(async () => {
  const [resMembers, resPlans] = await Promise.all([
    axios.get(membersApi),
    axios.get(plansApi),
  ]);
  members.value = Array.isArray(resMembers.data.data) ? resMembers.data.data : [];
  plans.value = resPlans.data;
});
</script>

<style scoped>
.table {
  vertical-align: middle;
}
</style>
