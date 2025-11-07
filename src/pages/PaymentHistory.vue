<template>
  <div class="members-container">
    <!-- Top Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="font-size: 1.5rem;">Payment History</h2>
        <p class="text-muted small mb-0">View all membership, program, and expense payments.</p>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="loadPayments">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.416A6 6 0 1 1 8 2v1z" />
            <path d="M8 1v3h3" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Filter Bar (Sticky) -->
    <div class="filter-bar">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <div v-for="(value, key) in activeFilters" :key="key"
          class="filter-chip d-flex align-items-center gap-1 px-2 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.5 2.5A.5.5 0 0 1 3 2h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-1z" />
            <path d="M3 5h10v1H3z" />
          </svg>
          <strong>{{ filterLabels[key] }}:</strong> {{ formatFilterValue(key as unknown as string,value) }}
          <button @click="clearFilter(key as unknown as string)" class="btn-close btn-close-sm"></button>
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
      <div class="mt-2 text-muted">Loading payment history...</div>
    </div>

    <!-- Table Container -->
    <div v-else class="table-responsive rounded-3 overflow-hidden">
      <div class="table-scroll-container">
        <div class="table-container border rounded-3">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
              <tr>
                <!-- Amount -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.amount }">Amount</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.amount" v-model.trim="filters.amount" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="e.g. 500"
                        @blur="handleBlur('amount')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.amount }" @click.stop="toggleFilter('amount')"
                      title="Filter Amount">
                      <template v-if="columnFilters.amount">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Method -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.method }">Method</span>
                    <transition name="fade-slide">
                      <select v-if="columnFilters.method" v-model="filters.method" @change="debouncedResetPageAndLoad"
                        class="form-select form-select-sm filter-input">
                        <option value="">All</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="ONLINE">Online</option>
                      </select>
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.method }" @click.stop="toggleFilter('method')"
                      title="Filter Method">
                      <template v-if="columnFilters.method">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Date -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.date }">Date</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.date" v-model="filters.date" @input="debouncedResetPageAndLoad"
                        type="date" class="form-control form-control-sm filter-input" @blur="handleBlur('date')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.date }" @click.stop="toggleFilter('date')"
                      title="Filter Date">
                      <template v-if="columnFilters.date">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Type -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.type }">Type</span>
                    <transition name="fade-slide">
                      <select v-if="columnFilters.type" v-model="filters.type" @change="debouncedResetPageAndLoad"
                        class="form-select form-select-sm filter-input">
                        <option value="">All</option>
                        <option value="membership">Membership</option>
                        <option value="addon">Program</option>
                        <option value="expense">Expense</option>
                      </select>
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.type }" @click.stop="toggleFilter('type')"
                      title="Filter Type">
                      <template v-if="columnFilters.type">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.707-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
                        </svg>
                      </template>
                      <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </template>
                    </button>
                  </div>
                </th>

                <!-- Details -->
                <th class="text-center">Details</th>
              </tr>
            </thead>

            <tbody>
              <template v-for="p in displayPayments" :key="p.id">
                <!-- Compact Row -->
                <tr class="cursor-pointer" @click="toggleExpand(p.id)" :class="{ 'table-active': expanded.has(p.id) }">
                  <td class="fw-semibold">
                    <span :class="p.amount > 0 ? 'text-success' : 'text-danger'">
                      {{ p.amount > 0 ? '+ ' : '- ' }}₹{{ Math.abs(p.amount).toLocaleString('en-IN') }}
                    </span>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark small">{{ p.method }}</span>
                  </td>
                  <td class="small">
                    <div>{{ formatDate(p.paymentDate) }}</div>
                    <div class="text-muted">{{ formatTime(p.paymentDate) }}</div>
                  </td>
                  <td>
                    <span class="badge small" :class="getTypeBadgeClass(p.type)">
                      {{ formatType(p.type) }}
                    </span>
                  </td>
                  <td class="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                      :class="expanded.has(p.id) ? 'rotate-90' : ''" viewBox="0 0 16 16">
                      <path fill-rule="evenodd"
                        d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                    </svg>
                  </td>
                </tr>

                <!-- Expanded Row -->
                <tr v-if="expanded.has(p.id)">
                  <td colspan="5" class="p-0 bg-light">
                    <div class="p-4">

                      <!-- MEMBERSHIP -->
                      <div v-if="p.type === 'membership'" class="row g-4">
                        <div class="col-md-6">
                          <div class="bg-white rounded-3 shadow-sm p-3 border-start border-primary border-4">
                            <h6 class="fw-bold text-primary mb-2">Member</h6>
                            <div class="d-flex align-items-center">
                              <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style="width: 40px; height: 40px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                  <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                                </svg>
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
                              <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style="width: 40px; height: 40px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L10.293 7.5H4.5z" />
                                </svg>
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
                              <div class="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style="width: 38px; height: 38px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                  <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                                </svg>
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
                              <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3"
                                style="width: 38px; height: 38px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M8.5 2.687c.654-.689 1.782-.886 3.112-.752 1.234.124 2.502.394 3.512.844l.5.25a.5.5 0 0 1 0 .866l-2.5 1.25a.5.5 0 0 1-.5 0l-2.5-1.25a.5.5 0 0 1 0-.866l.5-.25c.51-.25 1.18-.52 1.876-.752zM8.5 8.687c.654-.689 1.782-.886 3.112-.752 1.234.124 2.502.394 3.512.844l.5.25a.5.5 0 0 1 0 .866l-2.5 1.25a.5.5 0 0 1-.5 0l-2.5-1.25a.5.5 0 0 1 0-.866l.5-.25c.51-.25 1.18-.52 1.876-.752z" />
                                </svg>
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
                              <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style="width: 38px; height: 38px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                </svg>
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
                              <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style="width: 40px; height: 40px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z" />
                                </svg>
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
                            <div class="row g-3 text-center">
                              <div class="col-4">
                                <div class="fw-bold text-success">₹{{ p.paid.toLocaleString('en-IN') }}</div>
                                <div class="text-muted small">Paid</div>
                              </div>
                              <div class="col-4">
                                <div class="fw-bold text-warning">₹{{ p.pending.toLocaleString('en-IN') }}</div>
                                <div class="text-muted small">Pending</div>
                              </div>
                              <div class="col-4 border-start">
                                <div class="fw-bold text-dark">₹{{ p.expenseAmount?.toLocaleString('en-IN') }}</div>
                                <div class="text-muted small">Total</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="mt-3 text-end text-muted small">
                        Payment ID: #{{ p.id }}
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="!displayPayments.length">
                <td colspan="5" class="text-center text-muted py-5">No payments found</td>
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
              {{ meta.total }} payments
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

interface RawMember { id: number; firstName: string; lastName: string; email: string }
interface RawPlan { name: string; price: number }
interface RawAddon { name: string; price: number }
interface RawTrainer { id: number; firstName: string; lastName: string }
interface RawExpense { id: number; title: string; category: string; amount: number; paid: number | null; pending: number | null }
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

// State
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
  type: '',
  amount: '',
  date: ''
})
const columnFilters = ref({
  amount: false,
  method: false,
  date: false,
  type: false
})
const pagination = ref({ page: 1, limit: 10 })

const toastRef = ref<HTMLElement | null>(null)
let toastInstance: Toast | null = null

// Display
const displayPayments = computed<DisplayPayment[]>(() => {
  return payments.value.map(p => {
    const base: DisplayPayment = {
      id: p.id, amount: p.amount, paymentDate: p.paymentDate, method: p.method,
      type: 'unknown', member: null, plan: null, addonName: null, trainer: null,
      expenseTitle: null, category: null, expenseAmount: null, paid: 0, pending: 0
    }

    if (p.membership) {
      const m = p.membership.member
      return { ...base, type: 'membership', member: { id: m.id, name: `${m.firstName} ${m.lastName}`, email: m.email }, plan: p.membership.plan.name }
    }
    if (p.memberAddon) {
      const m = p.memberAddon.member
      const t = p.memberAddon.trainer
      return { ...base, type: 'addon', member: { id: m.id, name: `${m.firstName} ${m.lastName}`, email: m.email }, addonName: p.memberAddon.addon.name, trainer: t ? { id: t.id, name: `${t.firstName} ${t.lastName}` } : null }
    }
    if (p.expense) {
      return { ...base, type: 'expense', expenseTitle: p.expense.title, category: p.expense.category, expenseAmount: p.expense.amount, paid: p.expense.paid ?? 0, pending: p.expense.pending ?? 0 }
    }
    return base
  })
})

// Helpers
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
  const q: any = { ...filters.value, ...pagination.value }
  if (filters.value.startDate) q.startDate = filters.value.startDate
  if (filters.value.endDate) q.endDate = filters.value.endDate
  return q
}

const loadPayments = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/payments/history', { params: buildQuery() }) as AxiosResponse<{ data: RawPayment[], meta: PaginationMeta }>
    payments.value = res.data.data
    meta.value = res.data.meta
  } catch {
    showToast('Failed to load payment history', false)
  } finally {
    isLoading.value = false
  }
}

const resetPageAndLoad = () => { pagination.value.page = 1; loadPayments() }
const debouncedResetPageAndLoad = debounce(resetPageAndLoad, 600)

const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadPayments()
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

// Filters
const filterLabels: Record<string, string> = {
  search: 'Search',
  startDate: 'Start Date',
  endDate: 'End Date',
  method: 'Method',
  type: 'Type',
  amount: 'Amount',
  date: 'Date'
}

const activeFilters = computed(() => {
  const active: any = {}
  Object.entries(filters.value).forEach(([k, v]) => { if (v) active[k] = v })
  return active
})

const formatFilterValue = (key: string, value: any) => {
  if (['startDate', 'endDate', 'date'].includes(key)) return formatDate(value)
  if (key === 'method') return value
  if (key === 'type') return formatType(value)
  return value
}

const clearFilter = (key: string) => {
  filters.value[key as keyof typeof filters.value] = ''
  columnFilters.value[key as keyof typeof columnFilters.value] = false
  resetPageAndLoad()
}

const handleBlur = (key: string) => {
  if (!filters.value[key as keyof typeof filters.value]) {
    columnFilters.value[key as keyof typeof columnFilters.value] = false
  }
}

const toggleFilter = (key: string) => {
  columnFilters.value[key as keyof typeof columnFilters.value] = !columnFilters.value[key as keyof typeof columnFilters.value]
  if (!columnFilters.value[key as keyof typeof columnFilters.value]) filters.value[key as keyof typeof filters.value] = ''
}

// Debounce
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 600): T {
  let timeout: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }) as T
}

// Lifecycle
onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await loadPayments()
})
</script>

<style scoped>
.members-container { padding: 1.5rem; background: #f8f9fa; font-family: 'Inter', sans-serif; min-height: 100vh; }
.filter-bar { position: sticky; top: 0; background: #f8f9fa; z-index: 15; padding: 0.75rem 0; border-bottom: 1px solid #dee2e6; backdrop-filter: blur(4px); }
.filter-chip { background: #e9ecef; border-radius: 1rem; font-size: 0.8rem; color: #495057; transition: background 0.2s; }
.filter-chip:hover { background: #dee2e6; }
.filter-chip .btn-close { opacity: 0.7; }
.filter-chip .btn-close:hover { opacity: 1; }
.table { --bs-table-hover-bg: #f1f5f9; margin-bottom: 0; }
.table thead th { font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d; border-bottom: 1px solid #dee2e6; padding: 0.75rem 1rem; }
.table tbody td { padding: 0.75rem 1rem; font-size: 0.925rem; vertical-align: middle; }
.table tbody tr:hover { background-color: var(--bs-table-hover-bg); }
.rotate-90 { transform: rotate(90deg); transition: transform 0.2s ease; }
.sticky-top { position: sticky; top: 0; background: #f8f9fa; }
.pagination .page-link { color: #495057; border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.875rem; }
.pagination .page-item.active .page-link { background: #4361ee; border-color: #4361ee; color: white; }
.table-container { max-height: calc(100vh - 240px); overflow-y: auto; background: white; }
.pagination-footer { position: fixed; bottom: 10px; left: 240px; right: 0; background: #fff; padding: 0.65rem 1rem; z-index: 1040; display: flex; justify-content: center; align-items: center; }
.pagination-footer > div { width: 100%; max-width: 900px; display: flex; justify-content: space-between; align-items: center; }
.pagination-footer select { min-width: 70px; }
.filter-header { position: relative; white-space: nowrap; min-width: 140px; }
.filter-wrapper { display: flex; align-items: center; justify-content: flex-start; gap: 0.4rem; position: relative; }
.header-label { font-weight: 600; font-size: 0.85rem; color: #495057; transition: opacity 0.2s ease; }
.header-label.hidden { opacity: 0; pointer-events: none; }
.filter-input { width: 100%; max-width: 120px; opacity: 1; transition: all 0.3s ease; padding: 0.15rem 0.4rem; }
.filter-btn { background: transparent; border: none; padding: 0; cursor: pointer; color: #6c757d; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
.filter-btn:hover { color: #4361ee; }
.filter-header .form-control-sm, .filter-header .form-select-sm { font-size: 0.8rem; height: 26px; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.25s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateX(6px); }
.filter-btn.active { color: #4361ee; }
@media (max-width: 768px) { .pagination-footer { left: 0; padding: 0.5rem; } }
</style>