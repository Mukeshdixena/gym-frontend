<template>
  <div class="container mt-4">
    <h3 class="mb-4">Expense Management</h3>

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

    <!-- Search & Add -->
    <div class="row g-3 mb-3">
      <div class="col-md-5">
        <input type="text" class="form-control form-control-sm" placeholder="Search by title or category"
          v-model.trim="filters.search" @input="resetPageAndLoad" />
      </div>
      <div class="col-md-7 text-end">
        <button class="btn btn-primary btn-sm" @click="openAddModal">
          Add Expense
        </button>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading expenses...</p>
    </div>

    <!-- Expenses Table -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">
        All Expenses
      </div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount (₹)</th>
              <th>Paid (₹)</th>
              <th>Pending (₹)</th>
              <th>Status</th>
              <th>Date</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exp in expenses" :key="exp.id">
              <td>{{ exp.id }}</td>
              <td>{{ exp.title }}</td>
              <td>{{ exp.category }}</td>
              <td>₹{{ exp.amount.toFixed(2) }}</td>
              <td>₹{{ (exp.paid ?? 0).toFixed(2) }}</td>
              <td>₹{{ (exp.pending ?? 0).toFixed(2) }}</td>
              <td>
                <span class="badge" :class="getStatusClass(exp.status)">
                  {{ exp.status }}
                </span>
              </td>
              <td>{{ formatDate(exp.expenseDate) }}</td>
              <td class="text-center">
                <div class="dropdown" @click.stop="toggleDropdown(exp.id)">
                  <button class="btn btn-light btn-sm border-0">...</button>
                  <div v-if="openDropdownId === exp.id" class="dropdown-menu-custom shadow-sm">
                    <a href="javascript:void(0)" @click="openPaymentModal(exp)"
                      class="dropdown-item-custom text-success">Add Payment</a>
                    <a href="javascript:void(0)" @click="editExpense(exp)" class="dropdown-item-custom">Edit</a>
                    <a href="javascript:void(0)" @click="confirmDelete(exp)"
                      class="dropdown-item-custom text-danger">Delete</a>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="!expenses.length">
              <td colspan="9" class="text-center text-muted py-4">
                No expenses found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Expense Modal -->
    <div class="modal fade" ref="expenseModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-md">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingExpense ? 'Edit Expense' : 'Add Expense' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="mb-3">
                <label class="form-label fw-semibold">Title</label>
                <input v-model.trim="expenseForm.title" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Category</label>
                <input v-model.trim="expenseForm.category" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Amount (₹)</label>
                <input v-model.number="expenseForm.amount" type="number" min="0" step="0.01" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Expense Date</label>
                <input v-model="expenseForm.expenseDate" type="date" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Description</label>
                <textarea v-model.trim="expenseForm.description" class="form-control" rows="2"
                  placeholder="Optional details..."></textarea>
              </div>
              <div class="d-grid">
                <button type="button" class="btn btn-primary" @click="saveExpense">
                  {{ editingExpense ? 'Update Expense' : 'Add Expense' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Payment Modal (UPDATED – matches Billing style) -->
    <div class="modal fade" ref="paymentModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Payment – Expense</h5>
            <button type="button" class="btn-close" @click="closePaymentModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <!-- Expense Info -->
              <div class="mb-3">
                <strong>Expense:</strong>
                <span>{{ selectedExpense?.title }}</span>
                <span class="text-muted ms-2">({{ selectedExpense?.category }})</span>
              </div>

              <div class="mt-4">
                <h6>Expense Details</h6>
                <div class="form-control-plaintext p-2 bg-light rounded">
                  Amount: ₹{{ selectedExpense?.amount?.toFixed(2) }}
                </div>
              </div>

              <!-- Payment Fields -->
              <div class="mt-3 row g-3">
                <div class="col-md-4">
                  <label class="form-label"><strong>Total Amount (₹)</strong></label>
                  <input type="number" class="form-control" :value="selectedExpense?.amount" readonly />
                </div>

                <div class="col-md-4">
                  <label class="form-label"><strong>Already Paid (₹)</strong></label>
                  <input type="number" class="form-control" :value="oldPaid" readonly />
                </div>

                <div class="col-md-4">
                  <label class="form-label"><strong>Pending (Before) (₹)</strong></label>
                  <input type="number" class="form-control" :value="oldPending" readonly />
                </div>

                <!-- PAYING NOW – capped & validated -->
                <div class="col-md-4">
                  <label class="form-label text-success"><strong>Paying Now (₹)</strong></label>
                  <input
                    type="number"
                    class="form-control"
                    :class="{ 'is-invalid': newPaidNow > oldPending || newPaidNow < 0 }"
                    v-model.number="newPaidNow"
                    min="0"
                    :max="oldPending"
                    step="0.01"
                    placeholder="Enter amount"
                    @input="clampPayingNow"
                  />
                  <div v-if="newPaidNow > oldPending" class="invalid-feedback">
                    Cannot exceed pending amount (₹{{ oldPending }})
                  </div>
                </div>

                <div class="col-md-4">
                  <label class="form-label text-danger"><strong>Pending (After) (₹)</strong></label>
                  <input type="number" class="form-control" :value="pendingAfterPayment" readonly />
                </div>

                <div class="col-md-4">
                  <label class="form-label"><strong>Payment Method</strong></label>
                  <select v-model="paymentMethod" class="form-select">
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Notes</label>
                  <input v-model.trim="paymentNotes" type="text" class="form-control" placeholder="Optional" />
                </div>
              </div>

              <!-- PAYMENT HISTORY (always shown) -->
              <div class="mt-4">
                <h6>Payment History</h6>
                <div v-if="selectedExpense?.payments?.length" class="table-responsive">
                  <table class="table table-sm table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>#</th>
                        <th>Amount (₹)</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(p, i) in selectedExpense.payments" :key="p.id">
                        <td>{{ i + 1 }}</td>
                        <td>₹{{ p.amount }}</td>
                        <td>{{ formatDateTime(p.paymentDate) }}</td>
                        <td>{{ p.method }}</td>
                        <td>{{ p.notes || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="text-muted">No payments made yet.</div>
              </div>

              <!-- Buttons -->
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-secondary" @click="closePaymentModal" :disabled="isSubmitting">
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="savePayment"
                  :disabled="isSubmitting || newPaidNow <= 0 || newPaidNow > oldPending"
                >
                  {{ isSubmitting ? 'Updating…' : 'Add Payment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div class="modal fade" :class="{ show: isConfirmOpen }" tabindex="-1" style="display: block;" v-if="isConfirmOpen"
      @click.self="resolveConfirm(false)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-2">
            <h5 class="modal-title fs-6">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="resolveConfirm(false)"></button>
          </div>
          <div class="modal-body pt-2 pb-3">
            Are you sure you want to delete this expense?
            <br /><small class="text-muted">This action cannot be undone.</small>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="resolveConfirm(false)">Cancel</button>
            <button type="button" class="btn btn-danger btn-sm" @click="resolveConfirm(true)">Delete</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isConfirmOpen" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

interface Payment {
  id: number
  amount: number
  paymentDate: string
  method: string
  notes?: string
}

interface Expense {
  id: number
  title: string
  category: string
  amount: number
  paid?: number
  pending?: number
  status: string
  expenseDate: string
  description?: string
  payments?: Payment[]
}

const expenses = ref<Expense[]>([])
const isLoading = ref(true)
const filters = ref({ search: '' })

const toastRef = ref<HTMLElement | null>(null)
const expenseModalRef = ref<HTMLElement | null>(null)
const paymentModalRef = ref<HTMLElement | null>(null)
let toastInstance: Toast
let expenseModal: Modal
let paymentModal: Modal

const editingExpense = ref<Expense | null>(null)
const expenseForm = ref<Partial<Expense>>({})
const selectedExpense = ref<Expense | null>(null)
const oldPaid = ref(0)
const oldPending = ref(0)
const newPaidNow = ref(0)
const paymentMethod = ref<'CASH' | 'CARD' | 'UPI' | 'ONLINE'>('CASH')
const paymentNotes = ref('')
const isSubmitting = ref(false)
const openDropdownId = ref<number | null>(null)
const toastMessage = ref('')

// ─────────────── Computed ───────────────
const pendingAfterPayment = computed(() => {
  return Math.max(oldPending.value - newPaidNow.value, 0)
})

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-IN')

// ─────────────── Toast ───────────────
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => {
    if (toastMessage.value === msg) hideToast()
  }, 3000)
}
const hideToast = () => toastInstance?.hide()

// ─────────────── API ───────────────
const loadExpenses = async () => {
  isLoading.value = true
  try {
    const res = (await api.get('/expenses', {
      params: { search: filters.value.search },
    })) as AxiosResponse<Expense[]>
    expenses.value = res.data.map(exp => ({
      ...exp,
      paid: exp.paid ?? 0,
      pending: exp.pending ?? exp.amount,
      payments: exp.payments ?? []
    }))
  } catch {
    showToast('Failed to load expenses', false)
  } finally {
    isLoading.value = false
  }
}

const saveExpense = async () => {
  try {
    if (!expenseForm.value.title || !expenseForm.value.category || expenseForm.value.amount == null)
      return showToast('Please fill all required fields', false)

    if (editingExpense.value) {
      await api.patch(`/expenses/${editingExpense.value.id}`, expenseForm.value)
      showToast('Expense updated!')
    } else {
      await api.post('/expenses', expenseForm.value)
      showToast('Expense added!')
    }

    await loadExpenses()
    closeModal()
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Save failed', false)
  }
}

const savePayment = async () => {
  if (newPaidNow.value <= 0) return showToast('Enter a valid amount', false)
  isSubmitting.value = true
  try {
    await api.patch(`/expenses/${selectedExpense.value!.id}/payment`, {
      amount: newPaidNow.value,
      method: paymentMethod.value,
      notes: paymentNotes.value || undefined,
      status: pendingAfterPayment.value === 0 ? 'PAID' : 'PARTIAL_PAID'
    })
    showToast('Payment added successfully!')
    closePaymentModal()
    await loadExpenses()
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to add payment', false)
  } finally {
    isSubmitting.value = false
  }
}

const deleteExpense = async (id: number) => {
  try {
    await api.delete(`/expenses/${id}`)
    showToast('Expense deleted!')
    await loadExpenses()
  } catch {
    showToast('Failed to delete expense', false)
  }
}

// ─────────────── Modals ───────────────
const openAddModal = () => {
  editingExpense.value = null
  expenseForm.value = {
    title: '',
    category: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  }
  expenseModal?.show()
}

const editExpense = (exp: Expense) => {
  editingExpense.value = exp
  expenseForm.value = { ...exp, expenseDate: exp.expenseDate.split('T')[0] }
  expenseModal?.show()
}

const openPaymentModal = (exp: Expense) => {
  selectedExpense.value = exp
  oldPaid.value = exp.paid ?? 0
  oldPending.value = exp.pending ?? exp.amount
  newPaidNow.value = 0
  paymentMethod.value = 'CASH'
  paymentNotes.value = ''
  paymentModal?.show()
}

const closeModal = () => expenseModal?.hide()
const closePaymentModal = () => {
  paymentModal?.hide()
  selectedExpense.value = null
  newPaidNow.value = 0
}

// ─────────────── Validation ───────────────
const clampPayingNow = () => {
  if (newPaidNow.value < 0) newPaidNow.value = 0
  if (newPaidNow.value > oldPending.value) newPaidNow.value = oldPending.value
}

// ─────────────── Helpers ───────────────
const getStatusClass = (status?: string) => {
  if (!status) return 'bg-secondary'
  return {
    PENDING: 'bg-warning text-dark',
    PARTIAL_PAID: 'bg-info text-dark',
    PAID: 'bg-success',
  }[status] || 'bg-secondary'
}

const toggleDropdown = (id: number) =>
  (openDropdownId.value = openDropdownId.value === id ? null : id)

const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null
}

const isConfirmOpen = ref(false)
let resolveConfirm: (v: boolean) => void = () => { }
const showConfirm = (): Promise<boolean> =>
  new Promise(resolve => {
    isConfirmOpen.value = true
    resolveConfirm = v => {
      isConfirmOpen.value = false
      resolve(v)
    }
  })
const confirmDelete = async (exp: Expense) => {
  if (await showConfirm()) deleteExpense(exp.id)
}

const resetPageAndLoad = () => loadExpenses()

onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  if (expenseModalRef.value) expenseModal = new Modal(expenseModalRef.value)
  if (paymentModalRef.value) paymentModal = new Modal(paymentModalRef.value)
  document.addEventListener('click', handleClickOutside)
  await loadExpenses()
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

.badge {
  font-size: 0.75rem;
  padding: 0.4em 0.6em;
}

.dropdown {
  position: relative;
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

.dropdown-item-custom.text-danger {
  color: #dc3545 !important;
}

.toast {
  min-width: 280px;
}

.card-body {
  overflow: visible !important;
}

input[readonly],
.form-control-plaintext {
  background-color: #f8f9fa !important;
}
</style>