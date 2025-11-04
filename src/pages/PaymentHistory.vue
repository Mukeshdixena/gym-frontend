<template>
  <div class="container mt-4">
    <h3 class="mb-4">Payment History</h3>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert">
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
        <input v-model.trim="searchTerm" @input="resetPageAndLoad" type="text" class="form-control form-control-sm"
          placeholder="Member name or ID" />
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
        <label class="form-label"><strong>Method</strong></label>
        <select v-model="method" @change="resetPageAndLoad" class="form-select form-select-sm">
          <option value="">All</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <!-- Add more if needed -->
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2">Loading payments...</p>
    </div>

    <!-- Table + Pagination -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Payments</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>Amount (₹)</th>
              <th>Method</th>
              <th>Date</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in payments" :key="p.id">
              <td>{{ (pagination.page - 1) * pagination.limit + i + 1 }}</td>
              <td>{{ p.member.name }}</td>
              <td :class="{ 'text-danger': p.amount < 0, 'text-success': p.amount > 0 }">
                ₹{{ Math.abs(p.amount) }} <small v-if="p.amount < 0">(Refund)</small>
              </td>
              <td class="text-capitalize">{{ p.method.toLowerCase() }}</td>
              <td>{{ formatDate(p.paymentDate) }}</td>
              <td>
                <span class="badge" :class="p.amount > 0 ? 'bg-success' : 'bg-danger'">
                  {{ p.amount > 0 ? 'Received' : 'Refunded' }}
                </span>
              </td>
            </tr>
            <tr v-if="payments.length === 0">
              <td colspan="6" class="text-center text-muted py-4">
                No payments found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="card-footer d-flex justify-content-between align-items-center">
        <div>
          Showing
          {{ (pagination.page - 1) * pagination.limit + 1 }}
          to
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
          of
          {{ pagination.total }}
          payments
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// Match the actual API structure
interface Member {
  id: number
  name: string
  email: string
}

interface Payment {
  id: number
  amount: number
  paymentDate: string
  method: string
  member: Member
  plan: string
  membershipId: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

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

const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => {
    if (toastMessage.value === msg) hideToast()
  }, 4000)
}

const hideToast = () => toastInstance?.hide()

const visiblePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  for (
    let i = Math.max(2, pagination.value.page - delta);
    i <= Math.min(pagination.value.totalPages - 1, pagination.value.page + delta);
    i++
  )
    range.push(i)
  if (pagination.value.page - delta > 2) range.unshift('...')
  if (pagination.value.page + delta < pagination.value.totalPages - 1) range.push('...')
  range.unshift(1)
  if (pagination.value.totalPages > 1) range.push(pagination.value.totalPages)
  return range
})

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const loadPayments = async (page = 1) => {
  isLoading.value = true
  try {
    const params: Record<string, any> = {
      page,
      limit: pagination.value.limit,
      search: searchTerm.value || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
      method: method.value || undefined,
    }

    const res: AxiosResponse<{
      success: boolean
      data: Payment[]
      pagination: Pagination
    }> = await api.get('/payments/history', { params })

    if (res.data.success) {
      payments.value = res.data.data
      pagination.value = res.data.pagination
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      showToast('Failed to load payments.', false)
    }
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load payments.', false)
  } finally {
    isLoading.value = false
  }
}

const goToPage = (page: number) => {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) return
  pagination.value.page = page
  loadPayments(page)
}

const resetPageAndLoad = () => {
  pagination.value.page = 1
  loadPayments(1)
}

onMounted(() => {
  if (toastRef.value) {
    toastInstance = new Toast(toastRef.value)
  }
  loadPayments()
})
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

.text-danger {
  color: #dc3545 !important;
}

.text-success {
  color: #198754 !important;
}

.badge {
  font-size: 0.75rem;
}
</style>