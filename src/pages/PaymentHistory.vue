<template>
  <div class="container-fluid mt-4">
    <h2 class="mb-4">Payment History</h2>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 2000">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <!-- Search -->
          <div class="col-md-3">
            <input type="text" class="form-control form-control-sm" placeholder="Search by member name or email"
              v-model="searchTerm" />
          </div>

          <!-- Date range -->
          <div class="col-md-2"><input type="date" class="form-control form-control-sm" v-model="startDate" /></div>
          <div class="col-md-2"><input type="date" class="form-control form-control-sm" v-model="endDate" /></div>

          <!-- Method -->
          <div class="col-md-2">
            <select class="form-select form-select-sm" v-model="method">
              <option :value="null">All Methods</option>
              <option v-for="m in paymentMethods" :key="m" :value="m">{{ formatMethod(m) }}</option>
            </select>
          </div>

          <!-- Buttons -->
          <div class="col-md-3 d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" @click="loadPayments(1)">Refresh</button>
            <button class="btn btn-outline-secondary btn-sm" @click="resetFilters">Clear</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table table-striped table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>Date</th>
            <th>Member</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="payment in filteredPayments" :key="payment.id">
            <!-- Main row -->
            <tr @click="toggleExpand(payment.id)" style="cursor:pointer"
              :class="{ 'table-active': expandedId === payment.id }">
              <td>{{ formatDate(payment.paymentDate) }}</td>
              <td>{{ payment.member.name }}</td>
              <td>{{ payment.plan }}</td>
              <td>₹{{ payment.amount.toFixed(2) }}</td>
              <td><span class="badge" :class="getMethodBadge(payment.method)">{{ formatMethod(payment.method) }}</span>
              </td>
              <td><span class="badge bg-success">Paid</span></td>
              <td>
                <button class="btn btn-sm btn-info" @click.stop="downloadBill(payment.membershipId)">
                  Download
                </button>
              </td>
            </tr>

            <!-- Expanded row -->
            <tr v-if="expandedId === payment.id">
              <td colspan="7" class="bg-light p-0">
                <div class="p-3">
                  <div class="row g-3">
                    <div class="col-md-6"><strong>Membership ID:</strong> {{ payment.membershipId }}</div>
                    <div class="col-md-6"><strong>Email:</strong> {{ payment.member.email }}</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- Empty -->
          <tr v-if="!loading && filteredPayments.length === 0">
            <td colspan="7" class="text-center text-muted py-4">No payments found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav v-if="pagination.totalPages > 1" aria-label="Payment pagination">
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

    <!-- Loading -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Toast } from 'bootstrap'
import api from '@/api/axios'
import { API_BASE_URL } from '@/api/config'

// ───── Types ─────
interface Payment {
  id: number
  amount: number
  paymentDate: string
  method: string
  membershipId: string | number     // ← allow both string & number
  member: { id: number; name: string; email: string }
  plan: string
}
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ───── State ─────
const payments = ref<Payment[]>([])
const loading = ref(false)
const toastRef = ref<HTMLElement | null>(null)
let toastInstance!: Toast
const toastMessage = ref('')

const searchTerm = ref('')
const startDate = ref('')
const endDate = ref('')
const method = ref<string | null>(null)
const expandedId = ref<number | null>(null)

const pagination = ref<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 })
const paymentMethods = ['CASH', 'CARD', 'UPI', 'ONLINE']

// ───── Computed ─────
const filteredPayments = computed(() => payments.value.filter(p => {
  const matchesSearch = p.member.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    p.member.email.toLowerCase().includes(searchTerm.value.toLowerCase())
  const matchesDate = (!startDate.value || p.paymentDate >= `${startDate.value}T00:00:00.000Z`) &&
    (!endDate.value || p.paymentDate <= `${endDate.value}T23:59:59.999Z`)
  const matchesMethod = !method.value || p.method === method.value
  return matchesSearch && matchesDate && matchesMethod
}))

const visiblePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  for (let i = Math.max(2, pagination.value.page - delta); i <= Math.min(pagination.value.totalPages - 1, pagination.value.page + delta); i++)
    range.push(i)
  if (pagination.value.page - delta > 2) range.unshift('...')
  if (pagination.value.page + delta < pagination.value.totalPages - 1) range.push('...')
  range.unshift(1)
  if (pagination.value.totalPages > 1) range.push(pagination.value.totalPages)
  return range.filter((v, i, a) => a.indexOf(v) === i)
})

// ───── Toast ─────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance.show()
  }
}
const hideToast = () => toastInstance.hide()

// ───── Helpers ─────
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN')
const formatMethod = (m: string) => m.charAt(0) + m.slice(1).toLowerCase()
const getMethodBadge = (m: string) => {
  const map: Record<string, string> = { CASH: 'bg-secondary', CARD: 'bg-primary', UPI: 'bg-info', ONLINE: 'bg-success' }
  return map[m] || 'bg-dark'
}
const toggleExpand = (id: number) => expandedId.value = expandedId.value === id ? null : id
const resetFilters = () => { searchTerm.value = ''; startDate.value = ''; endDate.value = ''; method.value = null }

// ───── API ─────
const loadPayments = async (page: number = 1) => {
  loading.value = true
  try {
    const params: any = {
      page,
      limit: pagination.value.limit,
      ...(searchTerm.value && { search: searchTerm.value }),
      ...(startDate.value && { startDate: startDate.value }),
      ...(endDate.value && { endDate: endDate.value }),
      ...(method.value && { method: method.value })
    }
    const res = await api.get('/payments/history', { params })
    payments.value = res.data.data || []
    pagination.value = { ...res.data.pagination, page }
  } catch (err: any) {
    console.error(err)
    showToast('Failed to load payments.', false)
  } finally {
    loading.value = false
  }
}

// ───── Download Bill (TS-safe) ─────
const downloadBill = async (membershipId: string | number) => {
  try {
    const idNum = typeof membershipId === 'string' ? parseInt(membershipId, 10) : membershipId
    if (isNaN(idNum)) throw new Error('Invalid membership ID')

    const res = await api.get(`/memberships/download-bill/${idNum}`, {
      responseType: 'blob', // Important
    })

    // Create a blob URL and trigger download
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `bill_${idNum}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showToast('Bill downloaded successfully!')
  } catch (err: any) {
    console.error(err)
    if (err.response?.status === 401)
      showToast('Unauthorized: Please log in again.', false)
    else
      showToast('Failed to download bill.', false)
  }
}


// ───── Lifecycle ─────
onMounted(() => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value, { delay: 3000 })
  loadPayments()
})
</script>


<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

.table-active {
  background-color: #e9ecef !important;
}

.badge {
  font-size: .75rem;
}

.spinner-border {
  width: 2rem;
  height: 2rem;
}

.page-link {
  color: #495057;
}

.page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
</style>