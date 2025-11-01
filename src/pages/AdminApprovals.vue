<template>
  <div class="container mt-4">
    <h3 class="mb-4">Pending User Approvals</h3>

    <!-- Loading Spinner -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2">Loading pending users...</p>
    </div>

    <!-- No Data -->
    <div v-else-if="users.length === 0" class="alert alert-info text-center">
      No pending user approvals found.
    </div>

    <!-- Table -->
    <table v-else class="table table-bordered align-middle shadow-sm">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Role</th>
          <th>Registered</th>
          <th style="width: 160px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(u, i) in users" :key="u.id">
          <td>{{ i + 1 }}</td>
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td>
            <span
              :class="{
                'badge bg-warning text-dark': u.status === 'PENDING',
                'badge bg-success': u.status === 'APPROVED',
                'badge bg-danger': u.status === 'REJECTED'
              }"
            >
              {{ u.status }}
            </span>
          </td>
          <td>{{ u.role }}</td>
          <td>{{ new Date(u.createdAt).toLocaleDateString() }}</td>
          <td>
            <button
              class="btn btn-success btn-sm me-2"
              @click="approveUser(u.id)"
              :disabled="u.status === 'APPROVED'"
            >
              Approve
            </button>
            <button
              class="btn btn-danger btn-sm"
              @click="rejectUser(u.id)"
              :disabled="u.status === 'REJECTED'"
            >
              Reject
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/axios'
import { Toast } from 'bootstrap'

const users = ref<any[]>([])
const loading = ref(true)
let toastInstance: Toast | null = null

const showToast = (msg: string, success = true) => {
  const toastEl = document.createElement('div')
  toastEl.className = `toast align-items-center text-white ${
    success ? 'bg-success' : 'bg-danger'
  } border-0 position-fixed top-0 end-0 m-3`
  toastEl.style.zIndex = '2000'
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${msg}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `
  document.body.appendChild(toastEl)
  toastInstance = new Toast(toastEl)
  toastInstance.show()
  setTimeout(() => toastEl.remove(), 3000)
}

const fetchPending = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/admin-users/pending')
    users.value = data
  } catch (err) {
    console.error(err)
    showToast('Failed to load users.', false)
  } finally {
    loading.value = false
  }
}

const approveUser = async (id: number) => {
  try {
    await api.patch(`/admin-users/approve/${id}`)
    showToast('User approved successfully!')
    await fetchPending()
  } catch (err) {
    console.error(err)
    showToast('Failed to approve user.', false)
  }
}

const rejectUser = async (id: number) => {
  try {
    await api.patch(`/admin-users/reject/${id}`)
    showToast('User rejected successfully.')
    await fetchPending()
  } catch (err) {
    console.error(err)
    showToast('Failed to reject user.', false)
  }
}

onMounted(fetchPending)
</script>

<style scoped>
.table {
  background: #fff;
}
</style>
