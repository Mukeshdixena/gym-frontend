<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Dashboard</h2>

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

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading dashboard data...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Cards Row -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3" v-for="card in cards" :key="card.title">
          <div class="card text-white" :class="card.bg">
            <div class="card-body">
              <h5 class="card-title">{{ card.title }}</h5>
              <p class="card-text display-6">{{ card.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Members Table -->
      <h4>Recent Members</h4>
      <div v-if="recentMembers.length === 0" class="text-muted py-4">
        No recent members found.
      </div>
      <table v-else class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Membership</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in recentMembers" :key="member.id">
            <td>{{ member.firstName }} {{ member.lastName }}</td>
            <td>{{ member.email }}</td>
            <td>{{ member.phone }}</td>
            <td>{{ member.planName || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

interface Card {
  title: string
  value: number | string
  bg: string
}

interface Member {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  planName?: string
}

const isLoading = ref(true)
const cards = ref<Card[]>([])
const recentMembers = ref<Member[]>([])

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast
const toastMessage = ref('')

// Toast Functions
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

// --- Load Dashboard Data ---
const loadDashboard = async () => {
  try {
    const res: AxiosResponse<any> = await api.get('/dashboard')
    const data = res.data.data

    cards.value = [
      { title: 'Total Members', value: data.members, bg: 'bg-primary' },
      { title: 'Trainers', value: data.trainers, bg: 'bg-success' },
      { title: 'Active Plans', value: data.activeMemberships, bg: 'bg-warning' },
      { title: 'Total Revenue', value: `₹${data.totalRevenue}`, bg: 'bg-danger' },
    ]

    await loadRecentMembers()
  } catch (err: any) {
    console.error('Dashboard load error:', err)
    showToast('Failed to load dashboard data.', false)
  } finally {
    isLoading.value = false
  }
}

// --- Load Recent Members ---
const loadRecentMembers = async () => {
  try {
    const res: AxiosResponse<any[]> = await api.get('/members/recent')
    recentMembers.value = res.data ?? []
  } catch (err: any) {
    console.error('Recent members error:', err)
  }
}

onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await loadDashboard()
})
</script>

<style scoped>
.card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}
</style>
