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
              <th class="text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="p in displayPayments" :key="p.id">
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

                    <!-- MEMBERSHIP -->
                    <div v-if="p.type === 'membership'" class="row g-4">
                      <div class="col-md-6">
                        <div class="bg-white rounded-3 shadow-sm p-3 border-start border-primary border-4">
                          <h6 class="fw-bold text-primary mb-2">Member</h6>
                          <div class="d-flex align-items-center">
                            <div
                              class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                              style="width: 40px; height: 40px;">
                              <i class="bi bi-person-fill"></i>
                            </div>
                            <div>
                              <div class="fw-semibold">{{ p.member?.name }}</div>
                              <div class="text-muted small">{{ p.member?.email }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="bg-white rounded-3 shadow-sm p-3 border-start border-success border-4">
                          <h6 class="fw-bold text-success mb-2">Plan</h6>
                          <div class="d-flex align-items-center">
                            <div
                              class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                              style="width: 40px; height: 40px;">
                              <i class="bi bi-calendar-check"></i>
                            </div>
                            <div>
                              <div class="fw-semibold">{{ p.plan }}</div>
                              <div class="text-muted small">Membership Active</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- ADDON -->
                    <div v-else-if="p.type === 'addon'" class="row g-4">
                      <div class="col-md-4">
                        <div class="bg-white rounded-3 shadow-sm p-3 border-start border-info border-4">
                          <h6 class="fw-bold text-info mb-2">Member</h6>
                          <div class="d-flex align-items-center">
                            <div
                              class="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                              style="width: 38px; height: 38px;">
                              <i class="bi bi-person-fill"></i>
                            </div>
                            <div>
                              <div class="fw-semibold">{{ p.member?.name }}</div>
                              <div class="text-muted small">{{ p.member?.email }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="bg-white rounded-3 shadow-sm p-3 border-start border-warning border-4">
                          <h6 class="fw-bold text-warning mb-2">Program</h6>
                          <div class="d-flex align-items-center">
                            <div
                              class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3"
                              style="width: 38px; height: 38px;">
                              <i class="bi bi-star-fill"></i>
                            </div>
                            <div>
                              <div class="fw-semibold">{{ p.addonName }}</div>
                              <div class="text-muted small">Personalized Session</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="bg-white rounded-3 shadow-sm p-3 border-start border-success border-4">
                          <h6 class="fw-bold text-success mb-2">Trainer</h6>
                          <div class="d-flex align-items-center">
                            <div
                              class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                              style="width: 38px; height: 38px;">
                              <i class="bi bi-person-badge-fill"></i>
                            </div>
                            <div>
                              <div class="fw-semibold">{{ p.trainer?.name || '—' }}</div>
                              <div class="text-muted small">{{ p.trainer ? 'Assigned' : 'Not Assigned' }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- EXPENSE -->
                    <div v-else-if="p.type === 'expense'" class="row g-4">
                      <div class="col-md-6">
                        <div class="bg-white rounded-3 shadow-sm p-3 border-start border-danger border-4">
                          <h6 class="fw-bold text-danger mb-2">Expense</h6>
                          <div class="d-flex align-items-center">
                            <div
                              class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                              style="width: 40px; height: 40px;">
                              <i class="bi bi-receipt"></i>
                            </div>
                            <div>
                              <div class="fw-semibold">{{ p.expenseTitle }}</div>
                              <div class="text-muted small">{{ p.category }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="bg-white rounded-3 shadow-sm p-3 border-start border-dark border-4">
                          <h6 class="fw-bold text-dark mb-2">Payment Status</h6>
                          <div class="row g-3">
                            <div class="col-4">
                              <div class="text-center">
                                <div class="fw-bold text-success">₹{{ p.paid.toLocaleString('en-IN') }}</div>
                                <div class="text-muted small">Paid</div>
                              </div>
                            </div>
                            <div class="col-4">
                              <div class="text-center">
                                <div class="fw-bold text-warning">₹{{ p.pending.toLocaleString('en-IN') }}</div>
                                <div class="text-muted small">Pending</div>
                              </div>
                            </div>
                            <div class="col-4">
                              <div class="text-center border-start">
                                <div class="fw-bold text-dark">₹{{ p.expenseAmount?.toLocaleString('en-IN') }}</div>
                                <div class="text-muted small">Total</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Payment ID -->
                    <div class="mt-3 text-end text-muted small">
                      Payment ID: #{{ p.id }}
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- No Data -->
            <tr v-if="displayPayments.length === 0">
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
            <li class="page-item" v-for="pg in visiblePages" :key="pg" :class="{ active: pg === meta.page }">
              <a class="page-link" @click="typeof pg === 'number' && goToPage(pg)" href="javascript:void(0)">{{ pg
                }}</a>
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

// ────────────────────── Types (from real API) ──────────────────────
interface RawMember {
  id: number
  firstName: string
  lastName: string
  email: string
}
interface RawPlan { name: string; price: number }
interface RawAddon { name: string; price: number }
interface RawTrainer { id: number; firstName: string; lastName: string }
interface RawExpense {
  id: number
  title: string
  category: string
  amount: number
  paid: number | null
  pending: number | null
}
interface RawPayment {
  id: number
  amount: number
  paymentDate: string
  method: string
  membershipId: number | null
  memberAddonId: number | null
  expenseId: number | null
  membership: { member: RawMember; plan: RawPlan } | null
  memberAddon: { member: RawMember; addon: RawAddon; trainer: RawTrainer | null } | null
  expense: RawExpense | null
}
interface PaginationMeta { total: number; page: number; limit: number; totalPages: number }

// ────────────────────── State ──────────────────────
const payments = ref<RawPayment[]>([])
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)
const toastMessage = ref('')
const expanded = ref<Set<number>>(new Set())

const filters = ref({
  search: '',
  startDate: '',
  endDate: '',
  method: '',
  type: ''
})
const pagination = ref({ page: 1, limit: 10 })

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast | null = null

// ────────────────────── Display-ready Payment ──────────────────────
interface DisplayPayment {
  id: number
  amount: number
  paymentDate: string
  method: string
  type: 'membership' | 'addon' | 'expense' | 'unknown'
  member: { id: number; name: string; email: string } | null
  plan: string | null
  addonName: string | null
  trainer: { id: number; name: string } | null
  expenseTitle: string | null
  category: string | null
  expenseAmount: number | null
  paid: number
  pending: number
}
const displayPayments = computed<DisplayPayment[]>(() => {
  return payments.value.map(p => {
    const base: DisplayPayment = {
      id: p.id,
      amount: p.amount,
      paymentDate: p.paymentDate,
      method: p.method,
      type: 'unknown',
      member: null,
      plan: null,
      addonName: null,
      trainer: null,
      expenseTitle: null,
      category: null,
      expenseAmount: null,
      paid: 0,
      pending: 0,
    }

    if (p.membership) {
      const m = p.membership.member
      return {
        ...base,
        type: 'membership',
        member: { id: m.id, name: `${m.firstName} ${m.lastName}`, email: m.email },
        plan: p.membership.plan.name,
      }
    }

    if (p.memberAddon) {
      const m = p.memberAddon.member
      const t = p.memberAddon.trainer
      return {
        ...base,
        type: 'addon',
        member: { id: m.id, name: `${m.firstName} ${m.lastName}`, email: m.email },
        addonName: p.memberAddon.addon.name,
        trainer: t ? { id: t.id, name: `${t.firstName} ${t.lastName}` } : null,
      }
    }

    if (p.expense) {
      return {
        ...base,
        type: 'expense',
        expenseTitle: p.expense.title,
        category: p.expense.category,
        expenseAmount: p.expense.amount,
        paid: p.expense.paid ?? 0,
        pending: p.expense.pending ?? 0,
      }
    }

    return base
  })
})

// ────────────────────── Helpers ──────────────────────
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
const formatType = (t: string) => t === 'membership' ? 'Membership' : t === 'addon' ? 'Program' : t === 'expense' ? 'Expense' : 'Unknown'
const getTypeBadgeClass = (t: string) => {
  switch (t) {
    case 'membership': return 'bg-primary'
    case 'addon': return 'bg-info text-dark'
    case 'expense': return 'bg-danger'
    default: return 'bg-secondary'
  }
}
const toggleExpand = (id: number) => expanded.value.has(id) ? expanded.value.delete(id) : expanded.value.add(id)

// ────────────────────── Toast ──────────────────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

// ────────────────────── API & Pagination ──────────────────────
const buildQuery = () => ({ ...filters.value, ...pagination.value })
const loadPayments = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/payments/history', { params: buildQuery() }) as AxiosResponse<{
      data: RawPayment[]
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
const clearFilters = () => {
  filters.value = { search: '', startDate: '', endDate: '', method: '', type: '' }
  resetPageAndLoad()
}
const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadPayments()
}
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

// ────────────────────── Lifecycle ──────────────────────
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
  font-size: .9rem;
  transition: transform .2s ease;
}

.table td,
.table th {
  vertical-align: middle;
}

.badge {
  font-size: .75rem;
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

/* Card-like sections */
.border-start {
  border-left-width: 4px !important;
}

.rounded-3 {
  border-radius: .75rem !important;
}

.shadow-sm {
  box-shadow: 0 .125rem .25rem rgba(0, 0, 0, .075) !important;
}
</style>