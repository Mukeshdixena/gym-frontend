<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Payment History</h2>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 2000">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert"
        aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="row g-3 mb-3">
      <div class="col-md-3">
        <label class="form-label"><strong>Search</strong></label>
        <input v-model.trim="filters.search" @input="resetPageAndLoad" type="text" class="form-control form-control-sm"
          placeholder="Search member, plan, or addon" />
      </div>
      <div class="col-md-2">
        <label class="form-label"><strong>Start Date</strong></label>
        <input v-model="filters.startDate" @change="resetPageAndLoad" type="date"
          class="form-control form-control-sm" />
      </div>
      <div class="col-md-2">
        <label class="form-label"><strong>End Date</strong></label>
        <input v-model="filters.endDate" @change="resetPageAndLoad" type="date" class="form-control form-control-sm" />
      </div>
      <div class="col-md-2">
        <label class="form-label"><strong>Method</strong></label>
        <select v-model="filters.method" @change="resetPageAndLoad" class="form-select form-select-sm">
          <option value="">All</option>
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="UPI">UPI</option>
          <option value="ONLINE">Online</option>
        </select>
      </div>
      <div class="col-md-3 d-flex align-items-end">
        <button class="btn btn-outline-secondary btn-sm w-100" @click="clearFilters">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2">Loading payment history...</p>
    </div>

    <!-- Table + Pagination -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Payments</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Id</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Type</th>
              <th>Details</th>
              <th>Trainer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in payments" :key="p.id">
              <td>{{ p.id }}</td>
              <td>
                <div v-if="p.member">
                  <strong>{{ p.member.name }}</strong>
                  <small class="text-muted d-block">{{ p.member.email }}</small>
                </div>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span :class="{ 'text-success': p.amount > 0, 'text-danger': p.amount < 0 }">
                  ₹{{ Math.abs(p.amount).toLocaleString('en-IN') }}
                  <small v-if="p.amount < 0">(Refund)</small>
                </span>
              </td>
              <td>
                <span class="badge bg-light text-dark">{{ p.method }}</span>
              </td>
              <td>
                <div>{{ formatDate(p.paymentDate) }}</div>
                <small class="text-muted">{{ formatTime(p.paymentDate) }}</small>
              </td>
              <td>
                <span class="badge" :class="p.type === 'membership' ? 'bg-primary' : 'bg-info'">
                  {{ p.type === 'membership' ? 'Plan' : 'Special Program' }}
                </span>
              </td>
              <td>
                <span v-if="p.plan" class="text-primary fw-semibold">{{ p.plan }}</span>
                <span v-else-if="p.addonName" class="text-info fw-semibold">{{ p.addonName }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span v-if="p.trainer" class="text-success fw-semibold">{{ p.trainer.name }}</span>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
            <tr v-if="payments.length === 0">
              <td colspan="8" class="text-center text-muted py-4">No payments found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="card-footer d-flex justify-content-between align-items-center">
        <div>
          Showing {{ (meta.page - 1) * meta.limit + 1 }}
          to {{ Math.min(meta.page * meta.limit, meta.total) }}
          of {{ meta.total }} payments
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: meta.page <= 1 }">
              <a class="page-link" @click="goToPage(meta.page - 1)" href="javascript:void(0)">Prev</a>
            </li>
            <li class="page-item" v-for="p in visiblePages" :key="p" :class="{ active: p === meta.page }">
              <a class="page-link" @click="typeof p === 'number' && goToPage(p)" href="javascript:void(0)">{{ p }}</a>
            </li>
            <li class="page-item" :class="{ disabled: meta.page >= meta.totalPages }">
              <a class="page-link" @click="goToPage(meta.page + 1)" href="javascript:void(0)">Next</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// ──────── Types ────────
interface Member { id: number; name: string; email: string }
interface Trainer { id: number; name: string }
interface Payment {
  id: number
  amount: number
  paymentDate: string
  method: string
  type: 'membership' | 'addon' | 'unknown'
  member: Member | null
  plan: string | null
  addonName: string | null
  trainer: Trainer | null
}
interface PaginationMeta { total: number; page: number; limit: number; totalPages: number }

// ──────── State ────────
const payments = ref<Payment[]>([])
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)
const toastMessage = ref('')

const filters = ref({
  search: '',
  startDate: '',
  endDate: '',
  method: '',
})
const pagination = ref({ page: 1, limit: 10 })

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast | null = null

// ──────── Computed ────────
const visiblePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  const { page, totalPages } = meta.value
  for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i)
  if (page - delta > 2) range.unshift('...')
  if (page + delta < totalPages - 1) range.push('...')
  range.unshift(1)
  if (totalPages > 1) range.push(totalPages)
  return range
})

// ──────── Toast ────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

// ──────── Utils ────────
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

// ──────── API ────────
const buildQuery = () => ({
  ...filters.value,
  ...pagination.value,
  search: filters.value.search || undefined,
  startDate: filters.value.startDate || undefined,
  endDate: filters.value.endDate || undefined,
  method: filters.value.method || undefined,
})

const loadPayments = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/payments/history', { params: buildQuery() }) as AxiosResponse<{
      success: boolean
      data: Payment[]
      meta: PaginationMeta
    }>
    payments.value = res.data.data
    meta.value = res.data.meta
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load payment history', false)
  } finally {
    isLoading.value = false
  }
}

const resetPageAndLoad = () => {
  pagination.value.page = 1
  loadPayments()
}
const clearFilters = () => {
  filters.value = { search: '', startDate: '', endDate: '', method: '' }
  resetPageAndLoad()
}
const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadPayments()
}

// ──────── Lifecycle ────────
onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await loadPayments()
})
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

.toast {
  min-width: 280px;
}

.badge {
  font-size: 0.8rem;
}

.spinner-border {
  width: 2.5rem;
  height: 2.5rem;
}

.card-body {
  overflow: visible !important;
}
</style>
