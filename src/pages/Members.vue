<template>
  <div class="members-container">
    <!-- Top header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-semibold mb-0">Members Management</h2>
        <p class="text-muted small mb-0">Manage members, memberships and special programs.</p>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary btn-sm" @click="loadMembers" title="Refresh">
          <!-- refresh svg -->
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.416A6 6 0 1 1 8 2v1z"/>
            <path d="M8 1v3h3"/>
          </svg>
        </button>

        <button class="btn btn-primary btn-sm" @click="openAddModal">
          + New Enrollment
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="card card-body shadow-sm border-0 mb-3 py-2">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <input
          v-model.trim="filters.search"
          @input="resetPageAndLoad"
          type="text"
          class="form-control form-control-sm search-input"
          placeholder="Search by name, email, or phone"
        />
        <div class="ms-auto text-muted small">
          Showing {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} of {{ meta.total }}
        </div>
      </div>
    </div>

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

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
      <div class="mt-2 text-muted">Loading members and plans...</div>
    </div>

    <!-- Table -->
    <div v-else class="card shadow-sm border-0">
      <div class="card-body p-0">
        <table class="table table-hover align-middle mb-0 table-modern">
          <thead class="bg-light">
            <tr>
              <th class="text-muted small fw-semibold">ID</th>
              <th class="text-muted small fw-semibold">Name</th>
              <th class="text-muted small fw-semibold">Email</th>
              <th class="text-muted small fw-semibold">Phone</th>
              <th class="text-muted small fw-semibold">Plan</th>
              <th class="text-muted small fw-semibold">Status</th>
              <th class="text-muted small fw-semibold text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="member in members" :key="member.id">
              <tr :class="{ 'table-active': expandedMemberId === member.id }" @click="toggleExpand(member.id)" style="cursor:pointer">
                <td class="small text-muted">{{ member.id }}</td>
                <td class="fw-semibold">{{ member.firstName }} {{ member.lastName }}</td>
                <td class="small">{{ member.email }}</td>
                <td class="small">{{ member.phone }}</td>
                <td class="small">{{ member.memberships[0]?.plan?.name ?? 'N/A' }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(member.memberships[0]?.status)">
                    {{ member.memberships[0]?.status ?? 'N/A' }}
                  </span>
                </td>
                <td class="text-center" @click.stop>
                  <div class="d-flex justify-content-center gap-2">
                    <button class="icon-btn" title="Edit" @click.stop="editMember(member)">
                      <!-- pencil -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708L4.207 13.5 2 14l.5-2.207L12.146.146zM11.207 2L3 10.207V12h1.793L13 3.793 11.207 2z"/>
                      </svg>
                    </button>

                    <button class="icon-btn text-danger" :disabled="!canDeleteMember(member)" title="Delete" @click.stop="confirmDelete(member)">
                      <!-- trash -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5v7h1v-7h-1zm3 0v7h1v-7h-1z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2.5a1 1 0 1 1 0-2H5l.5-1h5l.5 1h2.5a1 1 0 0 1 1 1z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Expanded details -->
              <tr v-if="expandedMemberId === member.id">
                <td colspan="7" class="bg-light p-0">
                  <div class="p-3">
                    <div class="row">
                      <div class="col-md-6">
                        <h6 class="fw-bold text-primary">Memberships</h6>
                        <div v-if="member.memberships?.length">
                          <table class="table table-sm table-bordered mt-2">
                            <thead class="table-light small">
                              <tr>
                                <th>Plan</th><th>Status</th><th>Start</th><th>End</th><th>Paid</th><th>Pending</th><th>Discount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="ms in member.memberships" :key="'m-'+ms.id">
                                <td>{{ ms.plan?.name ?? 'N/A' }}</td>
                                <td><span class="status-badge" :class="getStatusClass(ms.status)">{{ ms.status }}</span></td>
                                <td>{{ formatDate(ms.startDate) }}</td>
                                <td>{{ formatDate(ms.endDate) }}</td>
                                <td>₹{{ ms.paid }}</td>
                                <td>₹{{ ms.pending }}</td>
                                <td>₹{{ ms.discount ?? 0 }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div v-else class="text-muted small mt-2">No memberships</div>
                      </div>

                      <div class="col-md-6">
                        <h6 class="fw-bold text-success">Special Programs</h6>
                        <div v-if="member.memberAddons?.length">
                          <table class="table table-sm table-bordered mt-2">
                            <thead class="table-light small">
                              <tr>
                                <th>Name</th><th>Status</th><th>Start</th><th>End</th><th>Paid</th><th>Pending</th><th>Trainer</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="ad in member.memberAddons" :key="'a-'+ad.id">
                                <td>{{ ad.addon?.name ?? 'N/A' }}</td>
                                <td><span class="status-badge" :class="getStatusClass(ad.status)">{{ ad.status }}</span></td>
                                <td>{{ formatDate(ad.startDate) }}</td>
                                <td>{{ formatDate(ad.endDate) }}</td>
                                <td>₹{{ ad.paid }}</td>
                                <td>₹{{ ad.pending }}</td>
                                <td>{{ ad.trainerId ?? 'N/A' }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div v-else class="text-muted small mt-2">No add-ons</div>
                      </div>
                    </div>
                    <!-- membership-level actions (edit/refund/delete) -->
                    <div class="mt-3 d-flex gap-2">
                      <button v-if="editingMembership" class="btn btn-outline-secondary btn-sm" @click="openEditMembershipModal(editingMembership)">
                        Edit open membership
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="!members.length">
              <td colspan="7" class="text-center text-muted py-4">No members found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div class="d-flex justify-content-between align-items-center border-top px-3 py-2 small text-muted">
        <div>
          Showing {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} of {{ meta.total }}
        </div>

        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: meta.page <= 1 }">
            <a class="page-link" href="javascript:void(0)" @click="goToPage(meta.page - 1)">Prev</a>
          </li>

          <li v-for="p in visiblePages" :key="p" class="page-item" :class="{ active: p === meta.page }">
            <a class="page-link" href="javascript:void(0)" @click="goToPage(p)">{{ p }}</a>
          </li>

          <li class="page-item" :class="{ disabled: meta.page >= meta.totalPages }">
            <a class="page-link" href="javascript:void(0)" @click="goToPage(meta.page + 1)">Next</a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Add/Edit Member Modal -->
    <div class="modal fade" ref="memberModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingMember ? 'Edit Member' : 'Add Member' }}</h5>
            <button type="button" class="btn-close" @click="closeMemberModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>First Name</strong></label>
                  <input v-model.trim="memberForm.firstName" type="text" class="form-control"
                         :class="{ 'is-invalid': memberErrors.firstName }" @blur="validateMemberField('firstName')" required />
                  <div v-if="memberErrors.firstName" class="invalid-feedback">{{ memberErrors.firstName }}</div>
                </div>

                <div class="col-md-6">
                  <label class="form-label"><strong>Last Name</strong></label>
                  <input v-model.trim="memberForm.lastName" type="text" class="form-control"
                         :class="{ 'is-invalid': memberErrors.lastName }" @blur="validateMemberField('lastName')" required />
                  <div v-if="memberErrors.lastName" class="invalid-feedback">{{ memberErrors.lastName }}</div>
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label"><strong>Email</strong></label>
                  <input v-model.trim="memberForm.email" type="email" class="form-control"
                         :class="{ 'is-invalid': memberErrors.email }" @blur="validateMemberField('email')" required />
                  <div v-if="memberErrors.email" class="invalid-feedback">{{ memberErrors.email }}</div>
                </div>

                <div class="col-md-6">
                  <label class="form-label"><strong>Phone</strong></label>
                  <input v-model.trim="memberForm.phone" type="text" class="form-control"
                         :class="{ 'is-invalid': memberErrors.phone }" @blur="validateMemberField('phone')" required />
                  <div v-if="memberErrors.phone" class="invalid-feedback">{{ memberErrors.phone }}</div>
                </div>
              </div>

              <div class="mt-3">
                <label class="form-label">Address</label>
                <textarea v-model.trim="memberForm.address" class="form-control" rows="2"></textarea>
              </div>

              <div class="row g-3 mt-3">
                <div class="col-md-4">
                  <label class="form-label"><strong>Gender</strong></label>
                  <select v-model="memberForm.gender" class="form-select">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div class="col-md-4">
                  <label class="form-label"><strong>Referral Source</strong></label>
                  <input v-model.trim="memberForm.referralSource" type="text" class="form-control" placeholder="E.g. Friend, Ad" />
                </div>

                <div class="col-md-4">
                  <label class="form-label"><strong>Notes</strong></label>
                  <input v-model.trim="memberForm.notes" type="text" class="form-control" placeholder="Optional notes" />
                </div>
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="saveMember"
                        :disabled="!isMemberFormValid || (!!editingMember && !isMemberFormDirty)">
                  {{ editingMember ? 'Update Member' : 'Add Member' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Membership Modal -->
    <div class="modal fade" ref="membershipModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Membership</h5>
            <button type="button" class="btn-close" @click="closeMembershipModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Plan</label>
              <select v-model="membershipForm.planId" class="form-select">
                <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Start Date</label>
              <input v-model="membershipForm.startDate" type="date" class="form-control" />
            </div>

            <div class="mb-3">
              <label class="form-label">End Date</label>
              <input v-model="membershipForm.endDate" type="date" class="form-control" />
            </div>

            <div class="mb-3">
              <label class="form-label">Status</label>
              <select v-model="membershipForm.status" class="form-select">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PARTIAL_PAID">Partial Paid</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div class="d-grid">
              <button class="btn btn-primary" @click="saveMembership">Update</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Refund Modal -->
    <div class="modal fade" ref="refundModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Issue Refund</h5>
            <button type="button" class="btn-close" @click="closeRefundModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Amount (₹)</label>
              <input v-model.number="refundForm.amount" type="number" min="1" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Reason (optional)</label>
              <input v-model="refundForm.reason" type="text" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Method</label>
              <select v-model="refundForm.method" class="form-select">
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            <div class="d-grid">
              <button class="btn btn-success" @click="processRefund">Refund</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete -->
    <div class="modal fade" :class="{ show: isConfirmOpen }" tabindex="-1" style="display: block;" v-if="isConfirmOpen" @click.self="resolveConfirm(false)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-2">
            <h5 class="modal-title fs-6">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="resolveConfirm(false)"></button>
          </div>
          <div class="modal-body pt-2 pb-3">
            Are you sure you want to delete this item?
            <br><small class="text-muted">This action cannot be undone.</small>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// ─────────────── Interfaces ───────────────
interface Plan { id: number; name: string }
interface Membership {
  id: number
  userId?: number
  planId: number
  memberId?: number
  startDate: string
  endDate: string
  status: string
  discount?: number
  paid: number
  pending: number
  createdAt?: string
  updatedAt?: string
  plan?: Plan
}
interface Addon {
  id: number
  memberId?: number
  addonId: number
  trainerId?: number | null
  startDate: string
  endDate: string
  price: number
  status: string
  discount?: number
  paid: number
  pending: number
  createdAt?: string
  updatedAt?: string
  addon?: { id: number; name: string; description?: string; price?: number; durationDays?: number }
}
interface Member {
  id: number
  userId?: number
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  gender?: string
  referralSource?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  memberships: Membership[]
  memberAddons: Addon[]
}
interface PaginationMeta { total: number; page: number; limit: number; totalPages: number }

// ─────────────── State ───────────────
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])
const filters = ref({ search: '' })
const pagination = ref({ page: 1, limit: 10 })
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)

const toastRef = ref<HTMLElement | null>(null)
const memberModalRef = ref<HTMLElement | null>(null)
const membershipModalRef = ref<HTMLElement | null>(null)
const refundModalRef = ref<HTMLElement | null>(null)
let toastInstance: Toast
let memberModal: Modal
let membershipModal: Modal
let refundModal: Modal

const editingMember = ref<Member | null>(null)
const editingMembership = ref<Membership | null>(null)
const refundMembership = ref<Membership | null>(null)
const expandedMemberId = ref<number | null>(null)
const openDropdownId = ref<number | null>(null)
const memberForm = ref<Partial<Member>>({})
const memberErrors = ref<Record<string, string>>({})
const originalMemberForm = ref<Partial<Member>>({})
const membershipForm = ref<Partial<Membership>>({})
const refundForm = ref({ amount: 0, reason: '', method: 'CASH' })
const toastMessage = ref('')

// ─────────────── Computed ───────────────
const isMemberFormValid = computed(() => {
  ;['firstName', 'lastName', 'email', 'phone'].forEach(validateMemberField)
  return (
    !!memberForm.value.firstName &&
    !!memberForm.value.lastName &&
    !!memberForm.value.email &&
    !!memberForm.value.phone &&
    !Object.values(memberErrors.value).some(err => err)
  )
})
const isMemberFormDirty = computed(() => {
  if (!editingMember.value) return true
  const keys: (keyof Member)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'gender', 'referralSource', 'notes']
  return keys.some(key => {
    const current = (memberForm.value[key] ?? '').toString().trim()
    const original = (originalMemberForm.value[key] ?? '').toString().trim()
    return current !== original
  })
})
const visiblePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  for (let i = Math.max(2, meta.value.page - delta); i <= Math.min(meta.value.totalPages - 1, meta.value.page + delta); i++)
    range.push(i)
  if (meta.value.page - delta > 2) range.unshift('...')
  if (meta.value.page + delta < meta.value.totalPages - 1) range.push('...')
  range.unshift(1)
  if (meta.value.totalPages > 1) range.push(meta.value.totalPages)
  return range
})
const getPlanName = (id?: number) => plans.value.find(p => p.id === id)?.name ?? 'N/A'
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN')
const getStatusClass = (status?: string) => {
  if (!status) return 'status-secondary'
  return {
    ACTIVE: 'status-success',
    PARTIAL_PAID: 'status-warning',
    EXPIRED: 'status-danger',
    CANCELLED: 'status-dark',
  }[status] || 'status-secondary'
}
const canDeleteMember = (member: Member) => {
  const hasActiveMembership = member.memberships?.some(ms => ms.status === 'ACTIVE')
  const hasActiveAddon = member.memberAddons?.some(ad => ad.status === 'ACTIVE')
  const hasAnyMembershipOrAddon = (member.memberships?.length ?? 0) > 0 || (member.memberAddons?.length ?? 0) > 0
  return !hasActiveMembership && !hasActiveAddon && !hasAnyMembershipOrAddon
}

// ─────────────── Validation ───────────────
const validateMemberField = (field: string) => {
  const value = memberForm.value[field as keyof Member]
  switch (field) {
    case 'firstName':
      memberErrors.value.firstName = value ? '' : 'First name is required.'
      break
    case 'lastName':
      memberErrors.value.lastName = value ? '' : 'Last name is required.'
      break
    case 'email':
      if (!value) memberErrors.value.email = 'Email is required.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) memberErrors.value.email = 'Enter a valid email.'
      else memberErrors.value.email = ''
      break
    case 'phone':
      if (!value) memberErrors.value.phone = 'Phone number is required.'
      else if (!/^[0-9]{10}$/.test(String(value))) memberErrors.value.phone = 'Enter a valid 10-digit phone number.'
      else memberErrors.value.phone = ''
      break
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
const loadMembers = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/members', { params: buildQuery() }) as AxiosResponse<{ data: Member[], meta: PaginationMeta }>
    members.value = res.data.data
    meta.value = res.data.meta
  } catch (err: any) {
    showToast('Failed to load members.', false)
  } finally {
    isLoading.value = false
  }
}
const loadPlans = async () => {
  try {
    const res: AxiosResponse<any> = await api.get('/plans/list-all')
    plans.value = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  } catch { /* swallow */ }
}
const resetPageAndLoad = () => { pagination.value.page = 1; loadMembers() }
const goToPage = (page: number | string) => {
  if (typeof page !== 'number' || page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadMembers()
}

// ─────────────── Member Modals ───────────────
const openAddModal = () => {
  editingMember.value = null
  memberForm.value = { firstName: '', lastName: '', email: '', phone: '', address: '', gender: '', referralSource: '', notes: '' }
  memberErrors.value = {}
  memberModal?.show()
}
const editMember = (m: Member) => {
  editingMember.value = m
  memberForm.value = { ...m }
  originalMemberForm.value = { ...m }
  memberErrors.value = {}
  memberModal?.show()
}
const closeMemberModal = () => { memberModal?.hide(); editingMember.value = null }
const saveMember = async () => {
  if (!isMemberFormValid.value) return showToast('Please fill required fields.', false)
  try {
    const payload = { ...memberForm.value }
    if (editingMember.value) {
      await api.put(`/members/${editingMember.value.id}`, payload)
      showToast('Member updated!')
    } else {
      await api.post('/members', payload)
      showToast('Member added!')
    }
    await loadMembers(); closeMemberModal()
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to save.', false)
  }
}

// ─────────────── Membership Actions ───────────────
const openEditMembershipModal = (ms: Membership) => {
  editingMembership.value = ms
  membershipForm.value = {
    planId: ms.planId,
    startDate: ms.startDate?.split('T')[0] ?? '',
    endDate: ms.endDate?.split('T')[0] ?? '',
    status: ms.status,
  }
  membershipModal?.show()
}
const closeMembershipModal = () => { membershipModal?.hide(); editingMembership.value = null }
const saveMembership = async () => {
  if (!editingMembership.value) return
  try {
    await api.patch(`/memberships/${editingMembership.value.id}`, membershipForm.value)
    showToast('Membership updated!')
    await loadMembers()
    closeMembershipModal()
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to update membership.', false)
  }
}

// ─────────────── Addon Actions ───────────────
const editAddon = (addon: Addon) => {
  showToast(`Edit Addon #${addon.id} clicked`)
}
const deleteAddon = async (addon: Addon) => {
  if (await showConfirm()) {
    try {
      await api.delete(`/member-addons/${addon.id}`)
      showToast('Addon deleted!')
      await loadMembers()
    } catch {
      showToast('Failed to delete addon.', false)
    }
  }
}

// ─────────────── Refund Actions ───────────────
const openRefundModal = (ms: Membership) => { refundMembership.value = ms; refundModal?.show() }
const closeRefundModal = () => { refundModal?.hide(); refundMembership.value = null }
const processRefund = async () => {
  if (!refundMembership.value || refundForm.value.amount <= 0) return showToast('Enter valid amount.', false)
  try {
    await api.post(`/memberships/${refundMembership.value.id}/refund`, refundForm.value)
    showToast('Refund processed!')
    closeRefundModal(); await loadMembers()
  } catch (err: any) { showToast(err?.response?.data?.message || 'Refund failed.', false) }
}

// ─────────────── Delete Confirmation ───────────────
const isConfirmOpen = ref(false)
let resolveConfirm: (v: boolean) => void = () => {}
const showConfirm = (): Promise<boolean> => new Promise(resolve => { isConfirmOpen.value = true; resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) } })
const confirmDeleteMembership = async (ms: Membership) => { if (await showConfirm()) try { await api.delete(`/memberships/${ms.id}`); showToast('Membership deleted!'); loadMembers() } catch { showToast('Failed.', false) } }
const confirmDelete = async (m: Member) => {
  if (await showConfirm()) {
    try {
      await api.delete(`/members/${m.id}`)
      showToast('Member deleted!')
      await loadMembers()
    } catch {
      showToast('Failed to delete member.', false)
    }
  }
}

// ─────────────── UI Helpers ───────────────
const toggleExpand = (id: number) => { expandedMemberId.value = expandedMemberId.value === id ? null : id }
const toggleDropdown = (id: number) => { openDropdownId.value = openDropdownId.value === id ? null : id }
const handleClickOutside = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null }

// ─────────────── Lifecycle ───────────────
onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  if (memberModalRef.value) memberModal = new Modal(memberModalRef.value)
  if (membershipModalRef.value) membershipModal = new Modal(membershipModalRef.value)
  if (refundModalRef.value) refundModal = new Modal(refundModalRef.value)
  document.addEventListener('click', handleClickOutside)
  await Promise.all([loadMembers(), loadPlans()])
  isLoading.value = false
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.members-container { padding: 1.25rem; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #fff; }

/* header */
h2 { font-size: 1.125rem; }

/* search card */
.search-input { width: 320px; }

/* table */
.table-modern th, .table-modern td { font-size: 0.925rem; vertical-align: middle; }
.table-modern th { color: #6b7280; font-weight: 600; border-bottom: 1px solid #eef2f6; background: #f8fafc; }
.table-modern tbody tr:hover { background: #fbfdff; transition: background 0.12s; }
.table-active { background: #f3f4f6 !important; }

/* action icon */
.icon-btn {
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  padding: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.icon-btn:hover { background: #e2e8f0; }

/* status badges */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #fff;
}
.status-success { background: #16a34a; }
.status-warning { background: #f59e0b; color: #000; }
.status-danger { background: #dc2626; }
.status-dark { background: #374151; }
.status-secondary { background: #6b7280; }

/* dropdown menu custom */
.dropdown { position: relative; display: inline-block; }
.dropdown-menu-custom {
  position: absolute; right: 0; top: 100%;
  background: white; border: 1px solid #e6e9ee; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(16,24,40,0.06); z-index: 2000; min-width: 180px;
}
.dropdown-item-custom { display:block; padding:8px 12px; color:#111827; text-decoration:none; font-size:0.9rem; }
.dropdown-item-custom:hover { background:#f8fafc; }

/* modal tweaks */
.modal-body { max-height: 70vh; overflow-y: auto; }
.modal-dialog { max-width: 820px; }
.modal-sm .modal-content { border-radius: .5rem; }

/* toast width */
.toast { min-width: 280px; }

/* pagination */
.pagination .page-item .page-link { color: #374151; border-radius: 6px; }
.pagination .page-item.active .page-link { background-color: #2563eb; color: #fff; border-color: #2563eb; }
</style>
