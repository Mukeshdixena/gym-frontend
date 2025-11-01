<template>
  <div class="container mt-4">
    <h3 class="mb-4">Pending User Approvals</h3>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border"></div>
      <p class="mt-2">Loading...</p>
    </div>

    <div v-else-if="users.length === 0" class="alert alert-info">
      No pending approvals.
    </div>

    <table v-else class="table table-bordered align-middle">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Email</th>
          <th>Registered</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(u, i) in users" :key="u.id">
          <td>{{ i + 1 }}</td>
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td>{{ new Date(u.createdAt).toLocaleDateString() }}</td>
          <td>
            <button class="btn btn-success btn-sm me-2" @click="approveUser(u.id)">Approve</button>
            <button class="btn btn-danger btn-sm" @click="rejectUser(u.id)">Reject</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const users = ref<any[]>([])
const loading = ref(true)

const fetchPending = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/admin-users/pending')
    users.value = data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const approveUser = async (id: number) => {
  await api.patch(`/admin-users/approve/${id}`)
  await fetchPending()
}

const rejectUser = async (id: number) => {
  await api.patch(`/admin-users/reject/${id}`)
  await fetchPending()
}

onMounted(fetchPending)
</script>
