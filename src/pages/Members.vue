<template>
  <div class="container-fluid">
    <h2 class="mb-4">Members</h2>

    <!-- Search & Add -->
    <div class="d-flex justify-content-between mb-3">
      <input type="text" class="form-control w-25" placeholder="Search by name or email" v-model="searchTerm" />
      <button class="btn btn-primary" @click="openAddModal">New Enrollment</button>
    </div>

    <!-- Members Table -->
    <table class="table table-striped table-hover">
      <thead class="table-dark">
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Membership</th>
          <th>Plan</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in filteredMembers" :key="member.id">
          <td>{{ member.firstName }} {{ member.lastName }}</td>
          <td>{{ member.email }}</td>
          <td>{{ member.phone }}</td>
          <td>{{ member.memberships[0]?.status ?? 'N/A' }}</td>
          <td>
            {{plans.find(p => p.id === member.memberships[0]?.planId)?.name ?? 'N/A'}}
          </td>
          <td>
            <button class="btn btn-sm btn-info me-2" @click="editMember(member)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteMember(member.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add/Edit Modal -->
    <div class="modal fade" id="memberModal" tabindex="-1" aria-hidden="true" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingMember ? 'Edit Member' : 'New Enrollment' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="saveMember">
              <!-- First Name -->
              <div class="mb-3">
                <label class="form-label">First Name</label>
                <input v-model="form.firstName" type="text" class="form-control" required />
              </div>

              <!-- Last Name -->
              <div class="mb-3">
                <label class="form-label">Last Name</label>
                <input v-model="form.lastName" type="text" class="form-control" required />
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="form-control" required />
              </div>

              <!-- Phone -->
              <div class="mb-3">
                <label class="form-label">Phone</label>
                <input v-model="form.phone" type="text" class="form-control" required />
              </div>

              <!-- ✅ Address -->
              <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea v-model="form.address" class="form-control" rows="2" placeholder="Enter address"></textarea>
              </div>

              <!-- ✅ Date of Birth -->
              <div class="mb-3">
                <label class="form-label">Date of Birth</label>
                <input v-model="form.dateOfBirth" type="date" class="form-control" />
              </div>

              <button class="btn btn-primary w-100" type="submit">
                {{ editingMember ? 'Update' : 'Add' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Modal } from 'bootstrap';

// Backend API URLs
const apiUrl = 'http://localhost:3000/members';
const plansApiUrl = 'http://localhost:3000/plans';

// Types
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
  address?: string;
  dateOfBirth?: string;
  memberships: Membership[];
}

interface Plan {
  id: number;
  name: string;
}

// State
const members = ref<Member[]>([]);
const plans = ref<Plan[]>([]);
const searchTerm = ref('');

// Modal handling
const modalRef = ref<HTMLElement | null>(null);
let editingMember: Member | null = null;

const form = ref<Member & { membershipStatus?: string; planId?: number }>({
  id: 0,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  memberships: [],
  membershipStatus: 'ACTIVE',
  planId: 1, // default
});

// Computed filtered members
const filteredMembers = computed(() =>
  members.value.filter(
    m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
);

// Open modal
function openAddModal() {
  editingMember = null;
  form.value = {
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    memberships: [],
    membershipStatus: 'ACTIVE',
    planId: plans.value[0]?.id,
  };
  if (modalRef.value) new Modal(modalRef.value).show();
}

// Close modal
function closeModal() {
  if (modalRef.value) Modal.getInstance(modalRef.value)?.hide();
}

// Edit member
function editMember(member: Member) {
  editingMember = member;
  form.value = {
    ...member,
    membershipStatus: member.memberships[0]?.status ?? 'ACTIVE',
    planId: member.memberships[0]?.planId ?? plans.value[0]?.id,
  };
  if (modalRef.value) new Modal(modalRef.value).show();
}

// Save member
async function saveMember() {
  try {
    const payload = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      phone: form.value.phone,
      address: form.value.address,
      dateOfBirth: form.value.dateOfBirth,
    };

    if (editingMember) {
      const res = await axios.put(`${apiUrl}/${editingMember.id}`, payload);

    } else {
      const res = await axios.post(apiUrl, payload);
      members.value.push(res.data);
    }

    loadMembers();

    closeModal();
  } catch (err) {
    console.error(err);
    alert('Failed to save member.');
  }
}

// Delete member
async function deleteMember(id: number) {
  if (!confirm('Are you sure to delete this member?')) return;
  try {
    await axios.delete(`${apiUrl}/${id}`);
    members.value = members.value.filter(m => m.id !== id);
  } catch (err) {
    console.error(err);
    alert('Failed to delete member.');
  }
}

async function loadMembers() {
  try {
    const resMembers = await axios.get(apiUrl);
    members.value = Array.isArray(resMembers.data.data) ? resMembers.data.data : [];
  } catch (err) {
    console.error(err);
  }
}


// Fetch members & plans on mount
onMounted(async () => {
  try {
    loadMembers();

    const resPlans = await axios.get(plansApiUrl);
    plans.value = resPlans.data;
  } catch (err) {
    console.error(err);
    alert('Failed to fetch members or plans.');
  }
});
</script>
