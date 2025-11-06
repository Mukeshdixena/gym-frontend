<template>
  <div class="container mt-4">
    <h3 class="mb-4">Members Management</h3>

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
        <input type="text" class="form-control form-control-sm" placeholder="Search by name, email or phone"
          v-model.trim="filters.search" @input="resetPageAndLoad" />
      </div>
      <div class="col-md-7 text-end">
        <button class="btn btn-primary btn-sm" @click="openAddModal">
          New Enrollment
        </button>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading members and plans...</p>
    </div>

    <!-- Members Table -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Members</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Gender</th>
              <th>Referral</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Plan</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(member, i) in members" :key="member.id">
              <tr @click="toggleExpand(member.id)" style="cursor: pointer"
                :class="{ 'table-active': expandedMemberId === member.id }">
                <td>{{ member.id }}</td>
                <td>{{ member.firstName }} {{ member.lastName }}</td>
                <td>{{ member.email }}</td>
                <td>{{ member.phone }}</td>
                <td>{{ member.gender || 'N/A' }}</td>
                <td>{{ member.referralSource || 'N/A' }}</td>
                <td>{{ member.notes || 'N/A' }}</td>
                <td>
                  <span class="badge" :class="getStatusClass(member.memberships[0]?.status)">
                    {{ member.memberships[0]?.status ?? 'N/A' }}
                  </span>
                </td>
                <td>{{ getPlanName(member.memberships[0]?.planId) }}</td>
                <td class="text-center" @click.stop>
                  <div class="dropdown" @click.stop="toggleDropdown(member.id)">
                    <button class="btn btn-light btn-sm border-0">...</button>
                    <div v-if="openDropdownId === member.id" class="dropdown-menu-custom shadow-sm">
                      <a href="javascript:void(0)" @click="editMember(member)" class="dropdown-item-custom">Edit
                        Member</a>
                      <a v-if="canDeleteMember(member)" href="javascript:void(0)" @click="confirmDelete(member)"
                        class="dropdown-item-custom text-danger">
                        Delete Member
                      </a>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Expandable Membership & Addon Rows -->
              <tr v-if="expandedMemberId === member.id">
                <td colspan="10" class="p-0 bg-light">
                  <div class="p-3">

                    <!-- Memberships Section -->
                    <h6 class="fw-bold mb-2 text-primary">Memberships</h6>
                    <div v-if="member.memberships.length">
                      <table class="table table-sm table-bordered mb-3">
                        <thead class="table-light">
                          <tr>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Paid</th>
                            <th>Pending</th>
                            <th>Discount</th>
                            <!-- <th class="text-center">Actions</th> -->
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="ms in member.memberships" :key="'m-' + ms.id">
                            <td>{{ getPlanName(ms.planId) }}</td>
                            <td>
                              <span class="badge" :class="getStatusClass(ms.status)">
                                {{ ms.status }}
                              </span>
                            </td>
                            <td>{{ formatDate(ms.startDate) }}</td>
                            <td>{{ formatDate(ms.endDate) }}</td>
                            <td>₹{{ ms.paid }}</td>
                            <td>₹{{ ms.pending }}</td>
                            <td>₹{{ ms.discount ?? 0 }}</td>
                            <!-- <td class="text-center" @click.stop> -->
                            <!-- <button class="btn btn-sm btn-outline-primary me-1" @click="openEditMembershipModal(ms)">
                                Edit
                              </button> -->
                            <!-- <button class="btn btn-sm btn-outline-danger" @click="openRefundModal(ms)">
                                Refund
                              </button> -->
                            <!-- <button class="btn btn-sm btn-outline-dark ms-1" @click="confirmDeleteMembership(ms)">
                                Delete
                              </button> -->
                            <!-- </td> -->
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div v-else class="text-muted mb-3">No memberships</div>

                    <!-- Addons Section -->
                    <h6 class="fw-bold mb-2 text-success">Special Programs</h6>
                    <div v-if="member.memberAddons && member.memberAddons.length">
                      <table class="table table-sm table-bordered">
                        <thead class="table-light">
                          <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Paid</th>
                            <th>Pending</th>
                            <th>Discount</th>
                            <th>Trainer</th>
                            <!-- <th class="text-center">Actions</th> -->
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="ad in member.memberAddons" :key="'a-' + ad.id">
                            <td>{{ ad.addon?.name ?? 'N/A' }}</td>
                            <td>
                              <span class="badge" :class="getStatusClass(ad.status)">
                                {{ ad.status }}
                              </span>
                            </td>
                            <td>{{ formatDate(ad.startDate) }}</td>
                            <td>{{ formatDate(ad.endDate) }}</td>
                            <td>₹{{ ad.paid }}</td>
                            <td>₹{{ ad.pending }}</td>
                            <td>₹{{ ad.discount ?? 0 }}</td>
                            <td>{{ ad.trainerId ? ad.trainerId : 'N/A' }}</td>
                            <!-- <td class="text-center" @click.stop> -->
                            <!-- <button class="btn btn-sm btn-outline-primary me-1" @click="editAddon(ad)">
                                Edit
                              </button> -->
                            <!-- <button class="btn btn-sm btn-outline-danger" @click="deleteAddon(ad)">
                                Delete
                              </button> -->
                            <!-- </td> -->
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div v-else class="text-muted">No addons</div>

                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="members.length === 0">
              <td colspan="10" class="text-center text-muted py-4">No members found</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-muted small">
            Showing {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
            of {{ meta.total }} members
          </div>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: meta.page <= 1 }">
                <a class="page-link" @click="goToPage(meta.page - 1)" href="javascript:void(0)">Prev</a>
              </li>
              <li class="page-item" v-for="p in visiblePages" :key="p" :class="{ active: p === meta.page }">
                <a class="page-link" @click="goToPage(p)" href="javascript:void(0)">{{ p }}</a>
              </li>
              <li class="page-item" :class="{ disabled: meta.page >= meta.totalPages }">
                <a class="page-link" @click="goToPage(meta.page + 1)" href="javascript:void(0)">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Add/Edit Member Modal -->
    <div class="modal fade" ref="memberModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingMember ? 'Edit Member' : 'Add Member' }}
            </h5>
            <button type="button" class="btn-close" @click="closeMemberModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>First Name</strong></label>
                  <input v-model.trim="memberForm.firstName" type="text" class="form-control"
                    :class="{ 'is-invalid': memberErrors.firstName }" @blur="validateMemberField('firstName')"
                    required />
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
                  <input v-model.trim="memberForm.referralSource" type="text" class="form-control"
                    placeholder="E.g. Friend, Ad" />
                </div>
                <div class="col-md-4">
                  <label class="form-label"><strong>Notes</strong></label>
                  <input v-model.trim="memberForm.notes" type="text" class="form-control"
                    placeholder="Optional notes" />
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
      <div class="modal-dialog">
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
            <button class="btn btn-primary w-100" @click="saveMembership">Update</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Refund Modal -->
    <div class="modal fade" ref="refundModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm">
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
            <button class="btn btn-success w-100" @click="processRefund">Refund</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete -->
    <div class="modal fade" :class="{ show: isConfirmOpen }" tabindex="-1" style="display: block;" v-if="isConfirmOpen"
      @click.self="resolveConfirm(false)">
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
interface Membership {
  id: number
  planId: number
  startDate: string
  endDate: string
  status: string
  paid: number
  pending: number
  discount?: number
}

interface Addon {
  id: number
  addonId: number
  trainerId?: number | null
  startDate: string
  endDate: string
  price: number
  status: string
  discount?: number
  paid: number
  pending: number
  addon?: {
    id: number
    name: string
    description?: string
    price: number
    durationDays: number
  }
}

interface Member {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  gender?: string
  referralSource?: string
  notes?: string
  memberships: Membership[]
  memberAddons: Addon[]
}

interface Plan {
  id: number
  name: string
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

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
    memberForm.value.firstName &&
    memberForm.value.lastName &&
    memberForm.value.email &&
    memberForm.value.phone &&
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
  if (!status) return 'bg-secondary'
  return {
    ACTIVE: 'bg-success',
    PARTIAL_PAID: 'bg-warning text-dark',
    EXPIRED: 'bg-danger',
    CANCELLED: 'bg-dark',
  }[status] || 'bg-secondary'
}
const canDeleteMember = (member: Member) => {
  const hasActiveMembership = member.memberships?.some(ms => ms.status === 'ACTIVE')
  const hasActiveAddon = member.memberAddons?.some(ad => ad.status === 'ACTIVE')
  const hasAnyMembershipOrAddon = (member.memberships?.length ?? 0) > 0 || (member.memberAddons?.length ?? 0) > 0

  // Delete allowed only if no active ones and both lists are empty or inactive
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
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
        memberErrors.value.email = 'Enter a valid email.'
      else memberErrors.value.email = ''
      break
    case 'phone':
      if (!value) memberErrors.value.phone = 'Phone number is required.'
      else if (!/^[0-9]{10}$/.test(String(value)))
        memberErrors.value.phone = 'Enter a valid 10-digit phone number.'
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
  } catch { }
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
    startDate: ms.startDate.split('T')[0],
    endDate: ms.endDate.split('T')[0],
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
  // You can later add modal edit logic here
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
let resolveConfirm: (v: boolean) => void = () => { }
const showConfirm = (): Promise<boolean> => new Promise(resolve => { isConfirmOpen.value = true; resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) } })
const confirmDeleteMembership = async (ms: Membership) => { if (await showConfirm()) try { await api.delete(`/memberships/${ms.id}`); showToast('Membership deleted!'); loadMembers() } catch { showToast('Failed.', false) } }
const confirmDelete = async (m: Member) => { if (await showConfirm()) try { await api.delete(`/members/${m.id}`); showToast('Member deleted!'); loadMembers() } catch { showToast('Failed.', false) } }

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

.dropdown-item-custom.text-danger {
  color: #dc3545 !important;
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

.card-body {
  overflow: visible !important;
}

.modal-sm .modal-content {
  border-radius: .5rem;
}
</style>
