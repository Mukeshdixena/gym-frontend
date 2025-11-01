<template>
  <div class="container mt-4">
    <h3 class="mb-4">Payment History</h3>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert"
        aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card shadow-sm mb-3">
      <div class="card-header bg-primary text-white fw-bold">Filters</div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <input type="text" class="form-control form-control-sm" placeholder="Search by name or email"
              v-model="searchTerm" />
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control form-control-sm" v-model="startDate" />
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control form-control-sm" v-model="endDate" />
          </div>
          <div class="col-md-2">
            <select class="form-select form-select-sm" v-model="method">
              <option :value="null">All Methods</option>
              <option v-for="m in paymentMethods" :key="m" :value="m">
                {{ formatMethod(m) }}
              </option>
            </select>
          </div>
          <div class="col-md-3 d-flex gap-2 align-items-center">
            <button class="btn btn-outline-primary btn-sm" @click="loadPayments(1)">
              Refresh
            </button>
            <button class="btn btn-outline-secondary btn-sm" @click="resetFilters">
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading payments...</p>
    </div>

    <!-- Payments Table -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Payments</div>
      <div class="card-body table-responsive p-0">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Member</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(payment, i) in filteredPayments" :key="payment.id">
              <!-- Main Row -->
              <tr @click="toggleExpand(payment.id)" style="cursor: pointer"
                :class="{ 'table-active': expandedId === payment.id }">
                <td>{{ i + 1 + (pagination.page - 1) * pagination.limit }}</td>
                <td>{{ formatDate(payment.paymentDate) }}</td>
                <td>{{ payment.member.name }}</td>
                <td>{{ payment.plan }}</td>
                <td>₹{{ payment.amount.toFixed(2) }}</td>
                <td>
                  <span class="badge" :class="getMethodBadge(payment.method)">
                    {{ formatMethod(payment.method) }}
                  </span>
                </td>
                <td>
                  <span class="badge bg-success">Paid</span>
                </td>
                <td class="text-center" @click.stop>
                  <div class="dropdown" @click.stop="toggleDropdown(payment.id)">
                    <button class="btn btn-light btn-sm border-0">...</button>
                    <div v-if="openDropdownId === payment.id" class="dropdown-menu-custom shadow-sm">
                      <a href="javascript:void(0)" @click="downloadBill(payment.membershipId)"
                        class="dropdown-item-custom">Download Bill</a>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Expanded Row -->
              <tr v-if="expandedId === payment.id">
                <td colspan="8" class="p-0 bg-light">
                  <div class="p-3">
                    <div class="row g-3">
                      <div class="col-md-6"><strong>Membership ID:</strong> {{ payment.membershipId }}</div>
                      <div class="col-md-6"><strong>Email:</strong> {{ payment.member.email }}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="filteredPayments.length === 0">
              <td colspan="8" class="text-center text-muted py-4">No payments found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <nav v-if="pagination.totalPages > 1" aria-label="Payment pagination" class="mt-4">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: pagination.page === 1 }">
          <button class="page-link" @click="loadPayments(pagination.page - 1)"
            :disabled="pagination.page === 1">Previous</button>
        </li>
        <li class="page-item" v-for="p in visiblePages" :key="p" :class="{ active: p === pagination.page }">
          <template v-if="p === '...'">
            <span class="page-link">...</span>
          </template>
          <template v-else>
            <button class="page-link" @click="loadPayments(Number(p))">{{ p }}</button>
          </template>
        </li>
        <li class="page-item" :class="{ disabled: pagination.page === pagination.totalPages }">
          <button class="page-link" @click="loadPayments(pagination.page + 1)"
            :disabled="pagination.page === pagination.totalPages">Next</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// ──────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────
interface MemberInfo {
  id: number
  name: string
  email: string
}

interface Payment {
  id: number
  amount: number
  paymentDate: string
  method: string
  membershipId: number
  member: MemberInfo
  plan: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ──────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────
const payments = ref<Payment[]>([])
const isLoading = ref(true)
const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast

const searchTerm = ref('')
const startDate = ref('')
const endDate = ref('')
const method = ref<string | null>(null)
const expandedId = ref<number | null>(null)
const openDropdownId = ref<number | null>(null)

const pagination = ref<Pagination>({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const paymentMethods = ['CASH', 'CARD', 'UPI', 'ONLINE'] as const
const toastMessage = ref('')

// ──────────────────────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────────────────────
const filteredPayments = computed(() => {
  return payments.value.filter(p => {
    const matchesSearch = p.member.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      p.member.email.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesDate = (!startDate.value || p.paymentDate >= `${startDate.value}T00:00:00.000Z`) &&
      (!endDate.value || p.paymentDate <= `${endDate.value}T23:59:59.999Z`)
    const matchesMethod = !method.value || p.method === method.value
    return matchesSearch && matchesDate && matchesMethod
  })
})

const visiblePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  for (let i = Math.max(2, pagination.value.page - delta); i <= Math.min(pagination.value.totalPages - 1, pagination.value.page + delta); i++) {
    range.push(i)
  }
  if (pagination.value.page - delta > 2) range.unshift('...')
  if (pagination.value.page + delta < pagination.value.totalPages - 1) range.push('...')
  range.unshift(1)
  if (pagination.value.totalPages > 1) range.push(pagination.value.totalPages)
  return range.filter((v, i, a) => a.indexOf(v) === i)
})

// ──────────────────────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────────────────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN')
const formatMethod = (m: string) => m.charAt(0) + m.slice(1).toLowerCase()
const getMethodBadge = (m: string) => {
  const map: Record<string, string> = {
    CASH: 'bg-secondary',
    CARD: 'bg-primary',
    UPI: 'bg-info',
    ONLINE: 'bg-success'
  }
  return map[m] || 'bg-dark'
}
const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}
const resetFilters = () => {
  searchTerm.value = ''
  startDate.value = ''
  endDate.value = ''
  method.value = null
}

// ──────────────────────────────────────────────────────────────
// API
// ──────────────────────────────────────────────────────────────
const loadPayments = async (page: number = 1) => {
  isLoading.value = true
  try {
    const params: Record<string, any> = {
      page,
      limit: pagination.value.limit,
    }
    if (searchTerm.value) params.search = searchTerm.value
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    if (method.value) params.method = method.value

    const res: AxiosResponse<{
      data: Payment[]
      pagination: Pagination
    }> = await api.get('/payments/history', { params })

    payments.value = res.data.data || []
    pagination.value = { ...res.data.pagination, page }
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load payments.', false)
  } finally {
    isLoading.value = false
  }
}

// ──────────────────────────────────────────────────────────────
// Download Bill
// ──────────────────────────────────────────────────────────────
const downloadBill = async (membershipId: number) => {
  try {
    const res = await api.get(`/memberships/download-bill/${membershipId}`, {
      responseType: 'blob',
    })

    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bill_${membershipId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showToast('Bill downloaded successfully!')
  } catch (err: any) {
    console.error(err)
    showToast(err.response?.status === 401
      ? 'Unauthorized: Please log in again.'
      : 'Failed to download bill.', false)
  }
}

// ──────────────────────────────────────────────────────────────
// Dropdown
// ──────────────────────────────────────────────────────────────
const toggleDropdown = (id: number) => {
  openDropdownId.value = openDropdownId.value === id ? null : id
}
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null
}

// ──────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────
onMounted(() => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  document.addEventListener('click', handleClickOutside)
  loadPayments()
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

.table-active {
  background-color: #f8f9fa !important;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, .1);
  z-index: 2000;
  min-width: 160px;
}

.dropdown-item-custom {
  display: block;
  padding: 8px 12px;
  color: #333;
  text-decoration: none;
  font-size: .9rem;
}

.dropdown-item-custom:hover {
  background: #f8f9fa;
}

.btn-sm.border-0 {
  font-size: 1.3rem;
  line-height: 1;
  padding: 0 .4rem;
}

.toast {
  min-width: 280px;
}

.page-link {
  color: #495057;
}

.page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.badge {
  font-size: .75rem;
}
</style>