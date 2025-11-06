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
          placeholder="Search member, plan, addon, or expense" />
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
      <div class="col-md-2">
        <label class="form-label"><strong>Type</strong></label>
        <select v-model="filters.type" @change="resetPageAndLoad" class="form-select form-select-sm">
          <option value="">All</option>
          <option value="membership">Membership</option>
          <option value="addon">Program</option>
          <option value="expense">Expense</option>
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
      <div class="card-header bg-primary text-white fw-bold">
        All Payments
      </div>
      <div class="card-body p-0">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-4">Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Type</th>
              <th class="text-center">+</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="p in payments" :key="p.id">
              <!-- Compact Row -->
              <tr class="cursor-pointer" @click="toggleExpand(p.id)" :class="{ 'table-active': expanded.has(p.id) }">
                <td class="ps-4 fw-semibold">
                  <span :class="p.amount > 0 ? 'text-success' : 'text-danger'">
                    {{ p.amount > 0 ? '+ ' : '- ' }}₹{{ Math.abs(p.amount).toLocaleString('en-IN') }}
                  </span>
                </td>
                <td>
                  <span class="badge bg-light text-dark">{{ p.method }}</span>
                </td>
                <td>
                  <div class="small">{{ formatDate(p.paymentDate) }}</div>
                  <div class="text-muted small">{{ formatTime(p.paymentDate) }}</div>
                </td>
                <td>
                  <span class="badge small" :class="getTypeBadgeClass(p.type)">
                    {{ formatType(p.type) }}
                  </span>
                </td>
                <td class="text-center">
                  <i :class="expanded.has(p.id) ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
                </td>
              </tr>

              <!-- Expanded Details Row -->
              <tr v-if="expanded.has(p.id)">
                <td colspan="5" class="p-0 border-0">
                  <div class="bg-light p-4 border-top">
                    <div class="row g-4">
                      <!-- Member / Expense Info -->
                      <div class="col-md-4">
                        <h6 class="fw-bold text-primary mb-2">
                          {{ p.member ? 'Member' : p.type === 'expense' ? 'Expense' : 'Details' }}
                        </h6>
                        <div v-if="p.member" class="ms-2">
                          <div><strong>{{ p.member.name }}</strong></div>
                          <div class="text-muted small">{{ p.member.email }}</div>
                        </div>
                        <div v-else-if="p.type === 'expense'" class="ms-2">
                          <div><strong>{{ p.expenseTitle }}</strong></div>
                          <div class="text-muted small">{{ p.category }}</div>
                          <div class="mt-2">
                            <span class="badge bg-success small">Paid: ₹{{ p.paid }}</span>
                            <span class="badge bg-warning text-dark small ms-1">Pending: ₹{{ p.pending }}</span>
                          </div>
                        </div>
                        <div v-else class="text-muted small">—</div>
                      </div>

                      <!-- Payment Details -->
                      <div class="col-md-4">
                        <h6 class="fw-bold text-primary mb-2">Payment Details</h6>
                        <div class="ms-2">
                          <template v-if="p.type === 'membership'">
                            <div><strong>Plan:</strong> {{ p.plan }}</div>
                          </template>
                          <template v-else-if="p.type === 'addon'">
                            <div><strong>Program:</strong> {{ p.addonName }}</div>
                          </template>
                          <template v-else-if="p.type === 'expense'">
                            <div><strong>Total Amount:</strong> ₹{{ p.expenseAmount?.toLocaleString('en-IN') }}</div>
                          </template>
                        </div>
                      </div>

                      <!-- Trainer -->
                      <div class="col-md-4">
                        <h6 class="fw-bold text-primary mb-2">Trainer</h6>
                        <div class="ms-2">
                          <span v-if="p.trainer" class="text-success fw-semibold">{{ p.trainer.name }}</span>
                          <span v-else class="text-muted">—</span>
                        </div>
                      </div>
                    </div>

                    <!-- ID at bottom -->
                    <div class="mt-3 text-end text-muted small">
                      Payment ID: #{{ p.id }}
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- No Data -->
            <tr v-if="payments.length === 0">
              <td colspan="5" class="text-center text-muted py-5">
                No payments found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="card-footer d-flex justify-content-between align-items-center">
        <div class="text-muted small">
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

// ─────────────── Types ───────────────
interface Member { id: number; name: string; email: string }
interface Trainer { id: number; name: string }
interface Payment {
  id: number
  amount: number
  paymentDate: string
  method: string
  type: 'membership' | 'addon' | 'expense' | 'unknown'
  member: Member | null
  plan: string | null
  addonName: string | null
  trainer: Trainer | null
  // expense-related fields
  expenseTitle?: string | null
  category?: string | null
  paid?: number | null
  pending?: number | null
  expenseAmount?: number | null
}
interface PaginationMeta { total: number; page: number; limit: number; totalPages: number }

// ─────────────── State ───────────────
const payments = ref<Payment[]>([])
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)
const toastMessage = ref('')
const expanded = ref<Set<number>>(new Set())

const filters = ref({ search: '', startDate: '', endDate: '', method: '', type: '' })
const pagination = ref({ page: 1, limit: 10 })

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast | null = null

// ─────────────── Computed ───────────────
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

// ─────────────── Helpers ───────────────
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

const formatType = (type: string) => {
  return type === 'membership' ? 'Membership'
    : type === 'addon' ? 'Program'
      : type === 'expense' ? 'Expense'
        : 'Unknown'
}

const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'membership': return 'bg-primary'
    case 'addon': return 'bg-info text-dark'
    case 'expense': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

const toggleExpand = (id: number) => {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}

// ─────────────── Toast ───────────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

// ─────────────── API ───────────────
const buildQuery = () => ({ ...filters.value, ...pagination.value })
const loadPayments = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/payments/history', { params: buildQuery() }) as AxiosResponse<{
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

const resetPageAndLoad = () => { pagination.value.page = 1; loadPayments() }
const clearFilters = () => { filters.value = { search: '', startDate: '', endDate: '', method: '', type: '' }; resetPageAndLoad() }
const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadPayments()
}

// ─────────────── Lifecycle ───────────────
onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await loadPayments()
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.table tbody tr:hover {
  background-color: #f8f9fa !important;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.bi {
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.table td,
.table th {
  vertical-align: middle;
}

.badge {
  font-size: 0.75rem;
}

.toast {
  min-width: 280px;
}

.card-body {
  overflow: visible !important;
}

.spinner-border {
  width: 2.5rem;
  height: 2.5rem;
}
</style>