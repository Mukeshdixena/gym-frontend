<template>
  <div class="container mt-4">
    <h3 class="mb-4">Billing Management</h3>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- ==== TYPE SWITCH ==== -->
    <div class="mb-3 d-flex gap-2">
      <div class="btn-group" role="group">
        <input type="radio" class="btn-check" id="type-membership" value="membership" v-model="billType">
        <label class="btn btn-outline-primary" for="type-membership">Membership</label>

        <input type="radio" class="btn-check" id="type-addon" value="addon" v-model="billType">
        <label class="btn btn-outline-primary" for="type-addon">Add-on</label>
      </div>
      <button class="btn btn-sm btn-outline-secondary ms-auto" @click="resetFilters">Clear Filters</button>
    </div>

    <!-- ==== FILTERS ==== -->
    <div class="row g-3 mb-3">
      <div class="col-md-4">
        <input type="text" class="form-control form-control-sm" placeholder="Member name / email"
          v-model="filterMember" />
      </div>
      <div class="col-md-3">
        <select class="form-select form-select-sm" v-model="filterPlan">
          <option :value="null">All {{ billType === 'membership' ? 'Plans' : 'Add-ons' }}</option>
          <option v-for="p in uniquePlans" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <select class="form-select form-select-sm" v-model="filterStatus">
          <option :value="null">All Statuses</option>
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </div>

    <!-- Pending Bills -->
    <div class="card mb-4 shadow-sm">
      <div class="card-header bg-warning text-dark fw-bold">
        Pending {{ billType === 'membership' ? 'Membership' : 'Add-on' }} Bills
      </div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>{{ billType === 'membership' ? 'Plan' : 'Add-on' }}</th>
              <th>Price</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bill in filteredPendingBills" :key="bill.id">
              <td>{{ bill.id }}</td>
              <td>{{ bill.member.firstName }} {{ bill.member.lastName }}</td>
              <td>{{ getPlanName(bill) }}</td>
              <td>₹{{ getPrice(bill) }}</td>
              <td>₹{{ totalPaid(bill) }}</td>
              <td>₹{{ pendingForBill(bill) }}</td>
              <td><span class="badge bg-secondary">{{ bill.status }}</span></td>
              <td>
                <button class="btn btn-primary btn-sm" @click="openAssignModal(bill)">Approve</button>
                <button class="btn btn-danger btn-sm ms-2" @click="rejectBill(bill.id)">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Approved Bills -->
    <div class="card shadow-sm">
      <div class="card-header bg-success text-white fw-bold">
        Approved {{ billType === 'membership' ? 'Memberships' : 'Add-ons' }}
      </div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>{{ billType === 'membership' ? 'Plan' : 'Add-on' }}</th>
              <th>Price</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bill in filteredApprovedBills" :key="bill.id">
              <td>{{ bill.id }}</td>
              <td>{{ bill.member.firstName }} {{ bill.member.lastName }}</td>
              <td>{{ getPlanName(bill) }}</td>
              <td>₹{{ getPrice(bill) }}</td>
              <td>₹{{ totalPaid(bill) }}</td>
              <td>₹{{ pendingForBill(bill) }}</td>
              <td>{{ formatDate(bill.startDate) }}</td>
              <td>{{ formatDate(bill.endDate) }}</td>
              <td>
                <span class="badge"
                  :class="{ 'bg-success': bill.status === 'ACTIVE', 'bg-warning text-dark': bill.status === 'PARTIAL_PAID' }">
                  {{ bill.status }}
                </span>
              </td>
              <td class="text-center">
                <div class="dropdown" @click.stop="toggleDropdown(bill.id)">
                  <button class="btn btn-light btn-sm border-0">...</button>
                  <div v-if="openDropdownId === bill.id" class="dropdown-menu-custom shadow-sm">
                    <a v-if="bill.status === 'PARTIAL_PAID'" href="javascript:void(0)" @click="openCollectModal(bill)"
                      class="dropdown-item-custom">Payment</a>
                    <a href="javascript:void(0)" @click="openHistoryModal(bill)" class="dropdown-item-custom">
                      Payment History
                    </a>
                    <a href="javascript:void(0)" @click="downloadBill(bill.id)" class="dropdown-item-custom">
                      Download Bill
                    </a>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Collect Payment Modal (same for both) -->
    <div class="modal fade" ref="collectModalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Collect Payment – {{ billType === 'membership' ? 'Membership' : 'Add-on' }}</h5>
            <button type="button" class="btn-close" @click="closeCollectModal"></button>
          </div>
          <div class="modal-body">
            <!-- ... same form as before, just uses selectedBill ... -->
            <!-- (see script for details) -->
          </div>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div class="modal fade" ref="historyModalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Payment History</h5>
            <button type="button" class="btn-close" @click="closeHistoryModal"></button>
          </div>
          <div class="modal-body">
            <!-- same as before -->
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div class="modal fade" :class="{ show: isConfirmOpen }" tabindex="-1" v-if="isConfirmOpen"
      @click.self="resolveConfirm(false)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-2">
            <h5 class="modal-title fs-6">Confirm Action</h5>
            <button type="button" class="btn-close" @click="resolveConfirm(false)"></button>
          </div>
          <div class="modal-body pt-2 pb-3">{{ confirmMessage }}</div>
          <div class="modal-footer border-0 pt-0">
            <button class="btn btn-secondary btn-sm" @click="resolveConfirm(false)">Cancel</button>
            <button class="btn btn-danger btn-sm" @click="resolveConfirm(true)">OK</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isConfirmOpen" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type BillType = 'membership' | 'addon'

interface Member { id: number; firstName: string; lastName: string; email: string }
interface Plan { id: number; name: string; price: number; durationDays?: number }
interface Addon { id: number; name: string; price: number; description?: string }
interface Trainer { id: number; name: string }
interface Payment { id: number; amount: number; paymentDate: string; method: string }

interface BaseBill {
  id: number
  memberId: number
  startDate: string
  endDate: string
  price: number
  status: string
  discount: number
  paid?: number
  pending?: number
  member: Member
  payments: Payment[]
}
interface Membership extends BaseBill { planId: number; plan: Plan }
interface MemberAddon extends BaseBill { addonId: number; addon: Addon; trainerId?: number | null; trainer?: Trainer | null }

type Bill = Membership | MemberAddon

// ──────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────
const billType = ref<BillType>('membership')
const pendingBills = ref<Bill[]>([])
const approvedBills = ref<Bill[]>([])

// Filters
const filterMember = ref('')
const filterPlan = ref<number | null>(null)
const filterStatus = ref<string | null>(null)

// Modals / Toast
const collectModalRef = ref<HTMLElement | null>(null)
const historyModalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)

let collectModal: Modal
let historyModal: Modal
let toastInstance: Toast

// Selected bill
const selectedBill = ref<Bill | null>(null)
const selectedMember = ref<Member | null>(null)
const selectedPlan = ref<Plan | Addon | null>(null)

const enrollmentForm = ref({ id: 0, discount: 0 })
const oldPaid = ref(0)
const oldPending = ref(0)
const newPaidNow = ref(0)
const paymentMethod = ref<'CASH' | 'CARD' | 'UPI' | 'ONLINE'>('CASH')
const isPartialPayment = ref(false)
const isSubmitting = ref(false)

const toastMessage = ref('')

// ──────────────────────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────────────────────
const pendingAfterPayment = computed(() => {
  if (!selectedPlan.value) return 0
  const total = oldPaid.value + newPaidNow.value
  const net = selectedPlan.value.price - enrollmentForm.value.discount
  return Math.max(net - total, 0)
})

const latestPaymentDate = (b: Bill): Date => {
  if (b.payments?.length) return new Date(Math.max(...b.payments.map(p => new Date(p.paymentDate).getTime())))
  return new Date((b as any).updatedAt || (b as any).createdAt)
}

const filteredPendingBills = computed(() => applyFilters(pendingBills.value))
const filteredApprovedBills = computed(() => {
  const sorted = [...approvedBills.value].sort((a, b) => latestPaymentDate(b).getTime() - latestPaymentDate(a).getTime())
  return applyFilters(sorted)
})

const uniquePlans = computed(() => {
  const map = new Map<number, Plan | Addon>()
    ;[...pendingBills.value, ...approvedBills.value].forEach(b => {
      const plan = billType.value === 'membership' ? (b as Membership).plan : (b as MemberAddon).addon
      map.set(plan.id, plan)
    })
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const statusOptions = computed(() => {
  const set = new Set<string>()
    ;[...pendingBills.value, ...approvedBills.value].forEach(b => set.add(b.status))
  return Array.from(set).sort()
})

function applyFilters(list: Bill[]) {
  return list.filter(b => {
    const memberMatch = !filterMember.value ||
      `${b.member.firstName} ${b.member.lastName}`.toLowerCase().includes(filterMember.value.toLowerCase()) ||
      b.member.email.toLowerCase().includes(filterMember.value.toLowerCase())

    const planMatch = filterPlan.value === null ||
      (billType.value === 'membership' ? (b as Membership).plan.id : (b as MemberAddon).addon.id) === filterPlan.value

    const statusMatch = filterStatus.value === null || b.status === filterStatus.value

    return memberMatch && planMatch && statusMatch
  })
}

const resetFilters = () => {
  filterMember.value = ''
  filterPlan.value = null
  filterStatus.value = null
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN')
const formatDateTime = (d: string) => new Date(d).toLocaleString('en-IN')

const totalPaid = (b: Bill) => b.payments.reduce((s, p) => s + p.amount, 0)
const pendingForBill = (b: Bill) => Math.max(b.price - b.discount - totalPaid(b), 0)

const getPlanName = (b: Bill) => billType.value === 'membership' ? (b as Membership).plan.name : (b as MemberAddon).addon.name
const getPrice = (b: Bill) => billType.value === 'membership' ? (b as Membership).plan.price : b.price

const validatePayment = () => {
  if (newPaidNow.value > oldPending.value) newPaidNow.value = oldPending.value
  if (newPaidNow.value < 0) newPaidNow.value = 0
}

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
// API Base URL
// ──────────────────────────────────────────────────────────────
const baseUrl = computed(() => billType.value === 'membership' ? '/memberships' : '/member-addons')

// ──────────────────────────────────────────────────────────────
// Load Data
// ──────────────────────────────────────────────────────────────
const loadBills = async () => {
  try {
    const res: AxiosResponse<Bill[]> = await api.get(baseUrl.value)
    const data = Array.isArray(res.data) ? res.data : []
    approvedBills.value = data.filter(b => ['ACTIVE', 'PARTIAL_PAID'].includes(b.status))
    pendingBills.value = data.filter(b => !['ACTIVE', 'PARTIAL_PAID'].includes(b.status))
  } catch (err: any) {
    showToast('Failed to load bills.', false)
  }
}

// Watch type change → reload
watch(billType, () => {
  resetFilters()
  loadBills()
})

// ──────────────────────────────────────────────────────────────
// Modals
// ──────────────────────────────────────────────────────────────
const openAssignModal = (bill: Bill) => { setupModal(bill, false); collectModal?.show() }
const openCollectModal = (bill: Bill) => { setupModal(bill, true); collectModal?.show() }

const setupModal = (bill: Bill, partial: boolean) => {
  selectedBill.value = bill
  selectedMember.value = bill.member
  selectedPlan.value = billType.value === 'membership' ? (bill as Membership).plan : (bill as MemberAddon).addon
  enrollmentForm.value = { id: billType.value === 'membership' ? (bill as Membership).planId : (bill as MemberAddon).addonId, discount: bill.discount }
  oldPaid.value = totalPaid(bill)
  oldPending.value = pendingForBill(bill)
  newPaidNow.value = 0
  paymentMethod.value = 'CASH'
  isPartialPayment.value = partial
}

const closeCollectModal = () => { collectModal?.hide(); resetForm() }
const openHistoryModal = (bill: Bill) => { selectedBill.value = bill; historyModal?.show() }
const closeHistoryModal = () => historyModal?.hide()
const resetForm = () => {
  selectedBill.value = null
  selectedMember.value = null
  selectedPlan.value = null
  newPaidNow.value = 0
  isSubmitting.value = false
}

// ──────────────────────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────────────────────
const updatePayment = async () => {
  if (newPaidNow.value <= 0) return showToast('Enter a valid amount.', false)
  isSubmitting.value = true
  try {
    await api.patch(`${baseUrl.value}/payment/${selectedBill.value!.id}`, {
      amount: newPaidNow.value,
      method: paymentMethod.value,
      status: pendingAfterPayment.value === 0 ? 'ACTIVE' : 'PARTIAL_PAID',
    })
    await loadBills()
    showToast('Payment updated!')
    closeCollectModal()
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Update failed.', false)
  } finally { isSubmitting.value = false }
}

const approvePayment = async () => {
  if (pendingAfterPayment.value > 0) return showToast('Full amount not paid.', false)
  const ok = await showConfirm(`Approve and activate this ${billType.value === 'membership' ? 'membership' : 'add-on'}?`)
  if (!ok) return
  isSubmitting.value = true
  try {
    await api.patch(`${baseUrl.value}/payment/${selectedBill.value!.id}`, {
      amount: newPaidNow.value,
      method: paymentMethod.value,
      status: 'ACTIVE',
    })
    await loadBills()
    showToast('Approved!')
    closeCollectModal()
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Failed.', false)
  } finally { isSubmitting.value = false }
}

const rejectBill = async (id: number) => {
  const ok = await showConfirm('Reject this bill?')
  if (!ok) return
  try {
    await api.delete(`${baseUrl.value}/${id}`)
    await loadBills()
    showToast('Rejected.')
  } catch (err: any) {
    showToast('Failed.', false)
  }
}

const downloadBill = async (id: number) => {
  try {
    const res = await api.get(`${baseUrl.value}/download-bill/${id}`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${billType.value}_bill_${id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    showToast('Download failed.', false)
  }
}

// ──────────────────────────────────────────────────────────────
// Dropdown & Confirm
// ──────────────────────────────────────────────────────────────
const openDropdownId = ref<number | null>(null)
const toggleDropdown = (id: number) => openDropdownId.value = openDropdownId.value === id ? null : id
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null
}

const isConfirmOpen = ref(false)
const confirmMessage = ref('')
let resolveConfirm: (v: boolean) => void = () => { }
const showConfirm = (msg: string): Promise<boolean> => {
  return new Promise(resolve => {
    confirmMessage.value = msg
    isConfirmOpen.value = true
    resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) }
  })
}

// ──────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────
onMounted(async () => {
  collectModal = new Modal(collectModalRef.value!)
  historyModal = new Modal(historyModalRef.value!)
  toastInstance = new Toast(toastRef.value!)
  document.addEventListener('click', handleClickOutside)
  await loadBills()
})

onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
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

.card-body {
  overflow: visible !important;
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

.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.toast {
  min-width: 280px;
}

input[readonly],
.form-control-plaintext {
  background-color: #f8f9fa !important;
}

.modal-sm .modal-content {
  border-radius: .5rem;
}
</style>