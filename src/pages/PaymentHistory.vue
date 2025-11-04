<template>
  <div class="container mt-4">
    <h3 class="mb-4">Payment History</h3>

    <!-- Toast Notification -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert"
        aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
            @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="row g-3 mb-4 align-items-end">
      <div class="col-md-3">
        <label class="form-label"><strong>Search Member</strong></label>
        <input v-model.trim="searchTerm" @input="onSearchInput" type="text" class="form-control form-control-sm"
          placeholder="Name, email, or ID" />
      </div>

      <div class="col-md-2">
        <label class="form-label"><strong>Start Date</strong></label>
        <input v-model="startDate" @change="resetPageAndLoad" type="date" class="form-control form-control-sm" />
      </div>

      <div class="col-md-2">
        <label class="form-label"><strong>End Date</strong></label>
        <input v-model="endDate" @change="resetPageAndLoad" type="date" class="form-control form-control-sm" />
      </div>

      <div class="col-md-2">
        <label class="form-label"><strong>Payment Method</strong></label>
        <select v-model="method" @change="resetPageAndLoad" class="form-select form-select-sm">
          <option value="">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="UPI">UPI</option>
          <option value="ONLINE">Online</option>
        </select>
      </div>

      <div class="col-md-3">
        <button @click="resetFilters" class="btn btn-outline-secondary btn-sm w-100">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Loading payment history...</p>
    </div>

    <!-- Table + Pagination -->
    <div v-else-if="filteredPayments.length > 0" class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">
        Payment History
      </div>
      <div class="card-body table-responsive p-0">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-3">#</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Details</th>
              <th>Trainer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in filteredPayments" :key="p.id">
              <td class="ps-3">
                {{ (pagination.page - 1) * pagination.limit + i + 1 }}
              </td>

              <!-- Safe Member Display -->
              <td>
                <div v-if="p.member">
                  <strong>{{ p.member.name }}</strong>
                  <small class="text-muted d-block">{{ p.member.email }}</small>
                </div>
                <em v-else class="text-muted">—</em>
              </td>

              <!-- Amount with Refund -->
              <td>
                <span :class="{
                  'text-danger': p.amount < 0,
                  'text-success': p.amount > 0,
                }">
                  ₹{{ Math.abs(p.amount).toLocaleString('en-IN') }}
                  <small v-if="p.amount < 0">(Refund)</small>
                </span>
              </td>

              <!-- Method Badge -->
              <td>
                <span class="badge bg-light text-dark text-capitalize">
                  {{ p.method.toLowerCase() }}
                </span>
              </td>

              <!-- Date & Time -->
              <td>
                <div>
                  {{ formatDate(p.paymentDate) }}
                  <small class="text-muted d-block">
                    {{ formatTime(p.paymentDate) }}
                  </small>
                </div>
              </td>

              <!-- Type Badge -->
              <td>
                <span class="badge" :class="p.type === 'membership' ? 'bg-primary' : 'bg-info'">
                  {{ p.type === 'membership' ? 'Plan' : 'Addon' }}
                </span>
              </td>

              <!-- Plan or Addon Name -->
              <td>
                <span v-if="p.type === 'membership' && p.plan" class="text-primary fw-semibold">
                  {{ p.plan }}
                </span>
                <span v-else-if="p.type === 'addon' && p.addonName" class="text-info fw-semibold">
                  {{ p.addonName }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>

              <!-- Trainer -->
              <td>
                <span v-if="p.trainer" class="text-success fw-semibold">
                  {{ p.trainer.name }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="card-footer d-flex flex-column flex-md-row justify-content-between align-items-center py-3">
        <div class="text-muted small mb-2 mb-md-0">
          Showing
          {{ (pagination.page - 1) * pagination.limit + 1 }}
          to
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
          of {{ pagination.total }} payments
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
              <a class="page-link" href="javascript:void(0)" @click="goToPage(pagination.page - 1)">Prev</a>
            </li>
            <li v-for="p in visiblePages" :key="p" class="page-item" :class="{ active: p === pagination.page }">
              <a class="page-link" href="javascript:void(0)" @click="typeof p === 'number' && goToPage(p)">{{ p }}</a>
            </li>
            <li class="page-item" :class="{ disabled: pagination.page >= pagination.totalPages }">
              <a class="page-link" href="javascript:void(0)" @click="goToPage(pagination.page + 1)">Next</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-5">
      <p class="text-muted">No payments found matching your filters.</p>
      <button @click="resetFilters" class="btn btn-outline-primary btn-sm">
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// === INTERFACES ===
interface Member {
  id: number
  name: string
  email: string
}

interface Trainer {
  id: number
  name: string
}

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
  membershipId: number | null
  addonId: number | null
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

// === REACTIVE STATE ===
const payments = ref<Payment[]>([])
const pagination = ref<Pagination>({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
})

const searchTerm = ref('')
const startDate = ref('')
const endDate = ref('')
const method = ref('')
const isLoading = ref(true)

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast | null = null
const toastMessage = ref('')

// === DEBOUNCE TIMER (Native) ===
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// === FILTERED PAYMENTS (Client-side search) ===
const filteredPayments = computed(() => {
  let filtered = payments.value

  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter((p) => {
      const memberName = p.member?.name?.toLowerCase() || ''
      const memberEmail = p.member?.email?.toLowerCase() || ''
      const memberId = p.member?.id?.toString() || ''
      const plan = p.plan?.toLowerCase() || ''
      const addon = p.addonName?.toLowerCase() || ''

      return (
        memberName.includes(term) ||
        memberEmail.includes(term) ||
        memberId.includes(term) ||
        plan.includes(term) ||
        addon.includes(term)
      )
    })
  }

  return filtered
})

// === TOAST HELPERS ===
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.classList.remove('bg-success', 'bg-danger')
    toastRef.value.classList.add(success ? 'bg-success' : 'bg-danger')
    toastInstance?.show()
  }
  setTimeout(hideToast, 4000)
}

const hideToast = () => toastInstance?.hide()

// === DATE & TIME FORMATTERS ===
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

// === PAGINATION LOGIC ===
const visiblePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  const { page, totalPages } = pagination.value

  for (
    let i = Math.max(2, page - delta);
    i <= Math.min(totalPages - 1, page + delta);
    i++
  ) {
    range.push(i)
  }

  if (page - delta > 2) range.unshift('...')
  if (page + delta < totalPages - 1) range.push('...')

  range.unshift(1)
  if (totalPages > 1) range.push(totalPages)

  return range
})

const goToPage = (page: number) => {
  if (
    page < 1 ||
    page > pagination.value.totalPages ||
    page === pagination.value.page
  )
    return
  pagination.value.page = page
  loadPayments(page)
}

// === DEBOUNCED SEARCH ===
const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    resetPageAndLoad()
  }, 500)
}

// === API CALL ===
const loadPayments = async (page = 1) => {
  isLoading.value = true
  try {
    const params: Record<string, any> = {
      page,
      limit: pagination.value.limit,
    }

    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    if (method.value) params.method = method.value

    const res: AxiosResponse<{
      success: boolean
      data: Payment[]
      pagination: Pagination
    }> = await api.get('/payments/history', { params })

    if (res.data.success) {
      payments.value = res.data.data
      pagination.value = { ...res.data.pagination, page }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      showToast('Failed to load payments.', false)
    }
  } catch (err: any) {
    console.error('Payment history error:', err)
    showToast('Network error. Please try again.', false)
  } finally {
    isLoading.value = false
  }
}

// === FILTER ACTIONS ===
const resetPageAndLoad = () => {
  pagination.value.page = 1
  loadPayments(1)
}

const resetFilters = () => {
  searchTerm.value = ''
  startDate.value = ''
  endDate.value = ''
  method.value = ''
  if (searchTimeout) clearTimeout(searchTimeout)
  resetPageAndLoad()
}

// === LIFECYCLE ===
onMounted(() => {
  if (toastRef.value) {
    toastInstance = new Toast(toastRef.value, { delay: 4000 })
  }
  loadPayments()
})
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
  font-size: 0.95rem;
}

.text-danger {
  color: #dc3545 !important;
}

.text-success {
  color: #198754 !important;
}

.badge {
  font-size: 0.75rem;
  padding: 0.35em 0.65em;
}

small {
  font-size: 0.8rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

@media (max-width: 768px) {
  .card-footer {
    flex-direction: column;
    text-align: center;
  }

  .pagination {
    margin-top: 0.5rem;
  }
}
</style>