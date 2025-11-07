<template>
  <div class="members-container">
    <!-- Top Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="font-size: 1.5rem;">Plans Management</h2>
        <p class="text-muted small mb-0">Manage membership plans, pricing and availability.</p>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="loadPlans">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.416A6 6 0 1 1 8 2v1z" />
            <path d="M8 1v3h3" />
          </svg>
          Refresh
        </button>

        <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" @click="openAddModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1v14m7-7H1" />
          </svg>
          + New Plan
        </button>
      </div>
    </div>

    <!-- Filter Bar (Sticky) -->
    <div class="filter-bar">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- Filter Chips -->
        <div v-for="(value, key) in activeFilters" :key="key"
          class="filter-chip d-flex align-items-center gap-1 px-2 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.5 2.5A.5.5 0 0 1 3 2h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-1z" />
            <path d="M3 5h10v1H3z" />
          </svg>
          <strong>{{ filterLabels[key] }}:</strong> {{ value }}
          <button @click="clearFilter(key)" class="btn-close btn-close-sm"></button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
      <div class="mt-2 text-muted">Loading plans...</div>
    </div>

    <!-- Table Container -->
    <div v-else class="table-responsive rounded-3 overflow-hidden">
      <div class="table-scroll-container">
        <div class="table-container border rounded-3">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
              <tr>
                <!-- ID -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.id }">ID</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.id" v-model.trim="filters.id" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="Search ID"
                        @blur="handleBlur('id')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.id }" @click.stop="toggleFilter('id')"
                      title="Filter ID">
                      <template v-if="columnFilters.id">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Name -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.name }">Name</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.name" v-model.trim="filters.name" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="Search Name"
                        @blur="handleBlur('name')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.name }"
                      @click.stop="toggleFilter('name')" title="Filter Name">
                      <template v-if="columnFilters.name">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Price -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.price }">Price</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.price" v-model.trim="filters.price" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="Min Price"
                        @blur="handleBlur('price')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.price }"
                      @click.stop="toggleFilter('price')" title="Filter Price">
                      <template v-if="columnFilters.price">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Duration -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.duration }">Duration</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.duration" v-model.trim="filters.duration" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="Min Days"
                        @blur="handleBlur('duration')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.duration }"
                      @click.stop="toggleFilter('duration')" title="Filter Duration">
                      <template v-if="columnFilters.duration">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Status -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.status }">Status</span>
                    <transition name="fade-slide">
                      <select v-if="columnFilters.status" v-model="filters.status" @change="debouncedResetPageAndLoad"
                        class="form-select form-select-sm filter-input">
                        <option value="">All</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.status }"
                      @click.stop="toggleFilter('status')" title="Filter Status">
                      <template v-if="columnFilters.status">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Action -->
                <th class="text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              <template v-for="plan in plans" :key="plan.id">
                <tr :class="{ 'table-active': expandedPlanId === plan.id }">
                  <td class="small text-muted">{{ plan.id }}</td>
                  <td class="fw-semibold">{{ plan.name }}</td>
                  <td class="small">₹{{ plan.price }}</td>
                  <td class="small">{{ plan.durationDays }} days</td>
                  <td class="small">
                    <span :class="plan.isActive ? 'text-success' : 'text-muted'">
                      {{ plan.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-center" @click.stop>
                    <div class="d-flex justify-content-center gap-2">
                      <!-- Edit -->
                      <button class="icon-btn" title="Edit" @click.stop="editPlan(plan)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M12.146.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708L4.207 13.5 2 14l.5-2.207L12.146.146zM11.207 2L3 10.207V12h1.793L13 3.793 11.207 2z" />
                        </svg>
                      </button>

                      <!-- Delete -->
                      <button class="icon-btn text-danger" title="Delete"
                        @click.stop="confirmDelete(plan.id)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path d="M5.5 5.5v7h1v-7h-1zm3 0v7h1v-7h-1z" />
                          <path fill-rule="evenodd"
                            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2.5a1 1 0 1 1 0-2H5l.5-1h5l.5 1h2.5a1 1 0 0 1 1 1z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Expanded row -->
                <tr v-if="expandedPlanId === plan.id">
                  <td colspan="6" class="p-0 bg-light">
                    <div class="p-4">
                      <div class="row g-4">
                        <div class="col-md-6">
                          <h6 class="fw-bold text-primary mb-3">Plan Details</h6>
                          <table class="table table-sm">
                            <tr><th>Price</th><td>₹{{ plan.price }}</td></tr>
                            <tr><th>Duration</th><td>{{ plan.durationDays }} days</td></tr>
                            <tr><th>Status</th><td><span :class="plan.isActive ? 'text-success' : 'text-muted'">{{ plan.isActive ? 'Active' : 'Inactive' }}</span></td></tr>
                          </table>
                        </div>
                        <div class="col-md-6">
                          <h6 class="fw-bold text-secondary mb-3">Description</h6>
                          <p class="text-muted small">{{ plan.description || '—' }}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="!plans.length">
                <td colspan="6" class="text-center text-muted py-5">No plans found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Footer -->
      <footer class="pagination-footer">
        <div class="d-flex justify-content-between align-items-center small text-muted w-100">
          <div class="d-flex align-items-center gap-2">
            <span>
              Showing {{ (meta.page - 1) * meta.limit + 1 }} to {{ Math.min(meta.page * meta.limit, meta.total) }} of
              {{ meta.total }} results
            </span>

            <div class="d-flex align-items-center ms-3">
              <label class="me-1">Rows per page:</label>
              <select v-model.number="pagination.limit" @change="debouncedResetPageAndLoad"
                class="form-select form-select-sm w-auto">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
          </div>

          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: meta.page <= 1 }">
                <a class="page-link" href="#" @click.prevent="goToPage(meta.page - 1)">Previous</a>
              </li>
              <li v-for="p in visiblePages" :key="p" class="page-item" :class="{ active: p === meta.page }">
                <a class="page-link" href="#" @click.prevent="goToPage(Number(p))">{{ p }}</a>
              </li>
              <li class="page-item" :class="{ disabled: meta.page >= meta.totalPages }">
                <a class="page-link" href="#" @click.prevent="goToPage(meta.page + 1)">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>

    <!-- Add/Edit Plan Modal -->
    <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingPlan ? 'Edit Plan' : 'Add Plan' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>Plan Name</strong></label>
                  <input v-model.trim="form.name" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.name }" @blur="validateField('name')" required />
                  <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Description</strong></label>
                  <textarea v-model.trim="form.description" class="form-control" rows="2"
                    :class="{ 'is-invalid': errors.description }" @blur="validateField('description')"
                    required></textarea>
                  <div v-if="errors.description" class="invalid-feedback">{{ errors.description }}</div>
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label"><strong>Price (₹)</strong></label>
                  <input v-if="!editingPlan" v-model.number="form.price" type="number" class="form-control"
                    :class="{ 'is-invalid': errors.price }" @blur="validateField('price')" min="1" required />
                  <div v-else class="form-control-plaintext">₹{{ form.price }}</div>
                  <div v-if="errors.price" class="invalid-feedback">{{ errors.price }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Duration (Days)</strong></label>
                  <input v-if="!editingPlan" v-model.number="form.durationDays" type="number" class="form-control"
                    :class="{ 'is-invalid': errors.durationDays }" @blur="validateField('durationDays')" min="1"
                    required />
                  <div v-else class="form-control-plaintext">{{ form.durationDays }} days</div>
                  <div v-if="errors.durationDays" class="invalid-feedback">{{ errors.durationDays }}</div>
                </div>
              </div>

              <div class="mt-3">
                <label class="form-label"><strong>Status</strong></label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="activeSwitch" v-model="form.isActive" />
                  <label class="form-check-label" for="activeSwitch">
                    {{ form.isActive ? 'Active' : 'Inactive' }}
                  </label>
                </div>
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="savePlan"
                  :disabled="!isFormValid || isUnchanged">
                  <span v-if="isSubmitting" class="d-flex align-items-center justify-content-center">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    {{ editingPlan ? 'Updating...' : 'Adding...' }}
                  </span>
                  <span v-else>
                    {{ editingPlan ? 'Update Plan' : 'Add Plan' }}
                  </span>
                </button>
              </div>
            </form>
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
            Delete <strong>{{ planToDelete?.name }}</strong> permanently?
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

// Interfaces
interface Plan {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
  isActive: boolean
}
interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// State
const plans = ref<Plan[]>([])
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)
const isSubmitting = ref(false)
const modalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)
let modal: Modal
let toastInstance: Toast
const toastMessage = ref('')

const editingPlan = ref<Plan | null>(null)
const planToDelete = ref<Plan | null>(null)
const isConfirmOpen = ref(false)
let resolveConfirm: (v: boolean) => void = () => { }
const expandedPlanId = ref<number | null>(null)

const filters = ref({
  id: '',
  name: '',
  price: '',
  duration: '',
  status: ''
})
const columnFilters = ref({
  id: false,
  name: false,
  price: false,
  duration: false,
  status: false
})
const pagination = ref({ page: 1, limit: 10 })

const form = ref<Partial<Plan>>({
  name: '',
  description: '',
  price: 0,
  durationDays: 0,
  isActive: true
})
const originalForm = ref<Partial<Plan>>({})
const errors = ref<Record<string, string>>({})

// Filter Labels
const filterLabels: Record<string, string> = {
  id: 'ID',
  name: 'Name',
  price: 'Price',
  duration: 'Duration',
  status: 'Status'
}

// Active Filters
const activeFilters = computed(() => {
  const active: Partial<typeof filters.value> = {}
  Object.entries(filters.value).forEach(([k, v]) => {
    if (v) (active as any)[k] = v
  })
  return active
})

// Debounce
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 600): T {
  let timeout: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }) as T
}

// Validation
const validateField = (field: string) => {
  const v = form.value[field as keyof Plan]
  switch (field) {
    case 'name':
      errors.value.name = v ? '' : 'Required.'
      break
    case 'description':
      errors.value.description = v ? '' : 'Required.'
      break
    case 'price':
      errors.value.price = !v || Number(v) <= 0 ? 'Enter valid price.' : ''
      break
    case 'durationDays':
      errors.value.durationDays = !v || Number(v) <= 0 ? 'Enter valid days.' : ''
      break
  }
}
const isFormValid = computed(() => {
  ;['name', 'description', 'price', 'durationDays'].forEach(validateField)
  return !Object.values(errors.value).some(err => err)
})
const isUnchanged = computed(() => JSON.stringify(form.value) === JSON.stringify(originalForm.value))

// Filter Helpers
const handleBlur = (key: string) => {
  if (!filters.value[key as keyof typeof filters.value]) {
    columnFilters.value[key as keyof typeof columnFilters.value] = false
  }
}
const clearFilter = (key: string) => {
  filters.value[key as keyof typeof filters.value] = ''
  columnFilters.value[key as keyof typeof columnFilters.value] = false
  resetPageAndLoad()
}
const toggleFilter = (key: string) => {
  columnFilters.value[key as keyof typeof columnFilters.value] = !columnFilters.value[key as keyof typeof columnFilters.value]
  if (!columnFilters.value[key as keyof typeof columnFilters.value]) filters.value[key as keyof typeof filters.value] = ''
}

// Toast
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

// API
const buildQuery = () => {
  const query: Record<string, any> = {}
  Object.entries(filters.value).forEach(([k, v]) => { if (v) query[k] = v })
  query.page = pagination.value.page
  query.limit = pagination.value.limit
  return query
}

const loadPlans = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/plans', { params: buildQuery() }) as AxiosResponse<{ data: Plan[], meta: PaginationMeta }>
    plans.value = res.data.data
    meta.value = res.data.meta
  } catch {
    showToast('Failed to load plans.', false)
  } finally {
    isLoading.value = false
  }
}

const resetPageAndLoad = () => {
  pagination.value.page = 1
  loadPlans()
}
const debouncedResetPageAndLoad = debounce(resetPageAndLoad, 600)

const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadPlans()
}

const visiblePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  for (let i = Math.max(2, meta.value.page - delta); i <= Math.min(meta.value.totalPages - 1, meta.value.page + delta); i++) range.push(i)
  if (meta.value.page - delta > 2) range.unshift('...')
  if (meta.value.page + delta < meta.value.totalPages - 1) range.push('...')
  range.unshift(1)
  if (meta.value.totalPages > 1) range.push(meta.value.totalPages)
  return range
})

// CRUD
const openAddModal = () => {
  editingPlan.value = null
  form.value = { name: '', description: '', price: 0, durationDays: 0, isActive: true }
  originalForm.value = { ...form.value }
  errors.value = {}
  modal?.show()
}

const editPlan = (plan: Plan) => {
  editingPlan.value = plan
  form.value = { ...plan }
  originalForm.value = { ...plan }
  errors.value = {}
  modal?.show()
}

const closeModal = () => {
  modal?.hide()
  editingPlan.value = null
}

const savePlan = async () => {
  if (!isFormValid.value) return showToast('Please fix errors.', false)
  isSubmitting.value = true
  try {
    const payload: any = {
      name: form.value.name!.trim(),
      description: form.value.description!.trim(),
      isActive: form.value.isActive ?? true
    }
    if (!editingPlan.value) {
      payload.price = form.value.price!
      payload.durationDays = form.value.durationDays!
    }
    if (editingPlan.value) {
      await api.put(`/plans/${editingPlan.value.id}`, payload)
      showToast('Plan updated!')
    } else {
      await api.post('/plans', payload)
      showToast('Plan added!')
    }
    closeModal()
    await loadPlans()
  } catch {
    showToast('Save failed.', false)
  } finally {
    isSubmitting.value = false
  }
}

const showConfirm = (): Promise<boolean> => new Promise(resolve => {
  isConfirmOpen.value = true
  resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) }
})

const confirmDelete = async (id: number) => {
  const plan = plans.value.find(p => p.id === id)
  if (!plan) return
  planToDelete.value = plan
  if (await showConfirm()) {
    try {
      await api.delete(`/plans/${id}`)
      showToast('Plan deleted!')
      await loadPlans()
    } catch {
      showToast('Delete failed.', false)
    }
  }
}

// Lifecycle
onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await loadPlans()
})
</script>

<style scoped>
.members-container {
  padding: 1.5rem;
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}

/* Filter Bar */
.filter-bar {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 15;
  padding: 0.75rem 0;
  border-bottom: 1px solid #dee2e6;
  backdrop-filter: blur(4px);
}

.filter-chip {
  background: #e9ecef;
  border-radius: 1rem;
  font-size: 0.8rem;
  color: #495057;
  transition: background 0.2s;
}

.filter-chip:hover {
  background: #dee2e6;
}

.filter-chip .btn-close {
  opacity: 0.7;
}

.filter-chip .btn-close:hover {
  opacity: 1;
}

/* Table */
.table {
  --bs-table-hover-bg: #f1f5f9;
  margin-bottom: 0;
}

.table thead th {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6c757d;
  border-bottom: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
}

.table tbody td {
  padding: 0.75rem 1rem;
  font-size: 0.925rem;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: var(--bs-table-hover-bg);
}

.icon-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.sticky-top {
  position: sticky;
  top: 0;
  background: #f8f9fa;
}

.pagination .page-link {
  color: #495057;
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.875rem;
}

.pagination .page-item.active .page-link {
  background: #4361ee;
  border-color: #4361ee;
  color: white;
}

.table-container {
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  background: white;
}

.pagination-footer {
  position: fixed;
  bottom: 10px;
  left: 240px;
  right: 0;
  background: #fff;
  padding: 0.65rem 1rem;
  z-index: 1040;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination-footer > div {
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-footer select {
  min-width: 70px;
}

.filter-header {
  position: relative;
  white-space: nowrap;
  min-width: 140px;
}

.filter-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.4rem;
  position: relative;
}

.header-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #495057;
  transition: opacity 0.2s ease;
}

.header-label.hidden {
  opacity: 0;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  max-width: 120px;
  opacity: 1;
  transition: all 0.3s ease;
  padding: 0.15rem 0.4rem;
}

.filter-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.filter-btn:hover {
  color: #4361ee;
}

.filter-header .form-control-sm,
.filter-header .form-select-sm {
  font-size: 0.8rem;
  height: 26px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

.header-label.hidden {
  opacity: 0;
  transform: translateX(-4px);
  width: 0;
  margin: 0;
  overflow: hidden;
  transition: opacity 0.25s ease, transform 0.25s ease, width 0.25s ease 0.15s;
}

.filter-btn.active {
  color: #4361ee;
}

@media (max-width: 768px) {
  .pagination-footer {
    left: 0;
    padding: 0.5rem;
  }
}
</style>