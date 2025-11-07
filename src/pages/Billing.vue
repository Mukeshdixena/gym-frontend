<template>
  <div class="members-container">
    <!-- Top Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="font-size: 1.5rem;">Billing Management</h2>
        <p class="text-muted small mb-0">Manage pending and approved membership & special program bills.</p>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="loadBills">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.416A6 6 0 1 1 8 2v1z" />
            <path d="M8 1v3h3" />
          </svg>
          Refresh
        </button>

        <div class="btn-group" role="group">
          <input type="radio" class="btn-check" id="type-membership" value="membership" v-model="billType">
          <label class="btn btn-outline-primary" for="type-membership">Membership</label>
          <input type="radio" class="btn-check" id="type-addon" value="addon" v-model="billType">
          <label class="btn btn-outline-primary" for="type-addon">Special Program</label>
        </div>
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
          <strong>{{ filterLabels[key] }}:</strong> {{ formatFilterValue(key, value) }}
          <button @click="clearFilter(key)" class="btn-close btn-close-sm"></button>
        </div>

        <button v-if="Object.keys(activeFilters).length" class="btn btn-sm btn-outline-secondary ms-auto"
          @click="resetAllFilters">
          Clear All Filters
        </button>
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
      <div class="mt-2 text-muted">Loading bills...</div>
    </div>

    <!-- Pending Bills -->
    <div v-else class="mb-5">
      <h5 class="fw-semibold text-warning mb-3">Pending {{ billType === 'membership' ? 'Membership' : 'Special Program'
      }} Bills</h5>
      <div class="table-responsive rounded-3 overflow-hidden">
        <div class="table-scroll-container">
          <div class="table-container border rounded-3">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
                <tr>
                  <th>#</th>
                  <th class="filter-header">
                    <div class="filter-wrapper">
                      <span class="header-label" :class="{ hidden: columnFilters.pendingMember }">Member</span>
                      <transition name="fade-slide">
                        <input v-if="columnFilters.pendingMember" v-model.trim="filters.pendingMember"
                          @input="debouncedResetPendingPage" type="text"
                          class="form-control form-control-sm filter-input" placeholder="Name / Email"
                          @blur="handleBlur('pendingMember')" />
                      </transition>
                      <button class="filter-btn" :class="{ active: columnFilters.pendingMember }"
                        @click.stop="toggleFilter('pendingMember')">
                        <template v-if="columnFilters.pendingMember">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                            viewBox="0 0 16 16">
                            <path
                              d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.708-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
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
                  <th class="filter-header">
                    <div class="filter-wrapper">
                      <span class="header-label" :class="{ hidden: columnFilters.pendingPlan }">{{ billType ===
                        'membership' ? 'Plan' :
                        'Program' }}</span>
                      <transition name="fade-slide">
                        <select v-if="columnFilters.pendingPlan" v-model="filters.pendingPlan"
                          @change="debouncedResetPendingPage" class="form-control form-control-sm filter-input">
                          <option :value="null">All</option>
                          <option v-for="p in uniquePlans" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                      </transition>
                      <button class="filter-btn" :class="{ active: columnFilters.pendingPlan }"
                        @click.stop="toggleFilter('pendingPlan')">
                        <template v-if="columnFilters.pendingPlan">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                            viewBox="0 0 16 16">
                            <path
                              d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.708-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
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
                  <th>Price</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bill, i) in paginatedPending" :key="bill.id">
                  <td class="small text-muted">{{ (pendingPage - 1) * pagination.pendingLimit + i + 1 }}</td>
                  <td class="fw-semibold">{{ bill.member.firstName }} {{ bill.member.lastName }}</td>
                  <td><span class="badge bg-secondary text-white">{{ getPlanName(bill) }}</span></td>
                  <td>₹{{ getPrice(bill) }}</td>
                  <td>₹{{ totalPaid(bill) }}</td>
                  <td class="text-danger fw-bold">₹{{ pendingForBill(bill) }}</td>
                  <td><span class="status-badge status-warning">{{ bill.status }}</span></td>
                  <td class="text-center">
                    <button class="icon-btn text-success me-1" title="Approve" @click="openAssignModal(bill)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                      </svg>
                    </button>
                    <button class="icon-btn text-danger" title="Reject" @click="rejectBill(bill.id)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr v-if="!paginatedPending.length">
                  <td colspan="8" class="text-center text-muted py-5">No pending bills</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <footer class="pagination-footer">
          <div class="d-flex justify-content-between align-items-center small text-muted w-100">
            <div class="d-flex align-items-center gap-2">
              <span>Showing {{ (pendingPage - 1) * pagination.pendingLimit + 1 }} to {{ Math.min(pendingPage *
                pagination.pendingLimit, filteredPending.length) }} of {{ filteredPending.length }}</span>
              <div class="d-flex align-items-center ms-3">
                <label class="me-1">Rows:</label>
                <select v-model.number="pagination.pendingLimit" @change="pendingPage = 1"
                  class="form-select form-select-sm w-auto">
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
              </div>
            </div>
            <nav>
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: pendingPage <= 1 }">
                  <a class="page-link" href="#" @click.prevent="pendingPage = Math.max(1, pendingPage - 1)">Prev</a>
                </li>
                <li v-for="p in pendingPages" :key="p" class="page-item" :class="{ active: p === pendingPage }">
                  <a class="page-link" href="#" @click.prevent="pendingPage = p">{{ p }}</a>
                </li>
                <li class="page-item" :class="{ disabled: pendingPage >= pendingTotalPages }">
                  <a class="page-link" href="#"
                    @click.prevent="pendingPage = Math.min(pendingTotalPages, pendingPage + 1)">Next</a>
                </li>
              </ul>
            </nav>
          </div>
        </footer>
      </div>
    </div>

    <!-- Approved Bills -->
    <div v-if="!isLoading">
      <h5 class="fw-semibold text-success mb-3">Approved {{ billType === 'membership' ? 'Memberships' :
        'Special Programs'
      }}</h5>
      <div class="table-responsive rounded-3 overflow-hidden">
        <div class="table-scroll-container">
          <div class="table-container border rounded-3">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
                <tr>
                  <th>#</th>
                  <th class="filter-header">
                    <div class="filter-wrapper">
                      <span class="header-label" :class="{ hidden: columnFilters.approvedMember }">Member</span>
                      <transition name="fade-slide">
                        <input v-if="columnFilters.approvedMember" v-model.trim="filters.approvedMember"
                          @input="debouncedResetApprovedPage" type="text"
                          class="form-control form-control-sm filter-input" placeholder="Name / Email"
                          @blur="handleBlur('approvedMember')" />
                      </transition>
                      <button class="filter-btn" :class="{ active: columnFilters.approvedMember }"
                        @click.stop="toggleFilter('approvedMember')">
                        <template v-if="columnFilters.approvedMember">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                            viewBox="0 0 16 16">
                            <path
                              d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.708-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
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
                  <th class="filter-header">
                    <div class="filter-wrapper">
                      <span class="header-label" :class="{ hidden: columnFilters.approvedPlan }">{{ billType ===
                        'membership' ? 'Plan' : 'Program' }}</span>
                      <transition name="fade-slide">
                        <select v-if="columnFilters.approvedPlan" v-model="filters.approvedPlan"
                          @change="debouncedResetApprovedPage" class="form-control form-control-sm filter-input">
                          <option :value="null">All</option>
                          <option v-for="p in uniquePlans" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                      </transition>
                      <button class="filter-btn" :class="{ active: columnFilters.approvedPlan }"
                        @click.stop="toggleFilter('approvedPlan')">
                        <template v-if="columnFilters.approvedPlan">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                            viewBox="0 0 16 16">
                            <path
                              d="M2.5 2.5a.5.5 0 0 1 .707 0L8 7.293l4.793-4.793a.5.5 0 1 1 .707.707L8.707 8l4.793 4.793a.5.5 0 0 1-.707.707L8 8.707l-4.793 4.793a.5.5 0 0 1-.708-.707L7.293 8 2.5 3.207a.5.5 0 0 1 0-.707z" />
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
                <tr v-for="(bill, i) in paginatedApproved" :key="bill.id">
                  <td class="small text-muted">{{ (approvedPage - 1) * pagination.approvedLimit + i + 1 }}</td>
                  <td class="fw-semibold">{{ bill.member.firstName }} {{ bill.member.lastName }}</td>
                  <td><span class="badge bg-secondary text-white">{{ getPlanName(bill) }}</span></td>
                  <td>₹{{ getPrice(bill) }}</td>
                  <td>₹{{ totalPaid(bill) }}</td>
                  <td :class="{ 'text-danger fw-bold': pendingForBill(bill) > 0 }">₹{{ pendingForBill(bill) }}</td>
                  <td class="small">{{ formatDate(bill.startDate) }}</td>
                  <td class="small">{{ formatDate(bill.endDate) }}</td>
                  <td>
                    <span :class="['status-badge', bill.status === 'ACTIVE' ? 'status-success' : 'status-warning']">
                      {{ bill.status }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="dropdown" @click.stop="toggleDropdown(bill.id)">
                      <button class="icon-btn text-muted">More</button>
                      <div v-if="openDropdownId === bill.id" class="dropdown-menu-custom shadow-sm">
                        <a v-if="bill.status === 'PARTIAL_PAID'" href="#" @click.prevent="openCollectModal(bill)"
                          class="dropdown-item-custom">Payment</a>
                        <a href="#" @click.prevent="openHistoryModal(bill)" class="dropdown-item-custom">History</a>
                        <a href="#" @click.prevent="downloadBill(bill.id)" class="dropdown-item-custom">Download</a>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-if="!paginatedApproved.length">
                  <td colspan="10" class="text-center text-muted py-5">No approved bills</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <footer class="pagination-footer">
          <div class="d-flex justify-content-between align-items-center small text-muted w-100">
            <div class="d-flex align-items-center gap-2">
              <span>Showing {{ (approvedPage - 1) * pagination.approvedLimit + 1 }} to {{ Math.min(approvedPage *
                pagination.approvedLimit, filteredApproved.length) }} of {{ filteredApproved.length }}</span>
              <div class="d-flex align-items-center ms-3">
                <label class="me-1">Rows:</label>
                <select v-model.number="pagination.approvedLimit" @change="approvedPage = 1"
                  class="form-select form-select-sm w-auto">
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
              </div>
            </div>
            <nav>
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: approvedPage <= 1 }">
                  <a class="page-link" href="#" @click.prevent="approvedPage = Math.max(1, approvedPage - 1)">Prev</a>
                </li>
                <li v-for="p in approvedPages" :key="p" class="page-item" :class="{ active: p === approvedPage }">
                  <a class="page-link" href="#" @click.prevent="approvedPage = p">{{ p }}</a>
                </li>
                <li class="page-item" :class="{ disabled: approvedPage >= approvedTotalPages }">
                  <a class="page-link" href="#"
                    @click.prevent="approvedPage = Math.min(approvedTotalPages, approvedPage + 1)">Next</a>
                </li>
              </ul>
            </nav>
          </div>
        </footer>
      </div>
    </div>

    <!-- Collect Payment Modal -->
    <div class="modal fade" ref="collectModalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Collect Payment – {{ billType === 'membership' ? 'Membership' : 'Special Program' }}
            </h5>
            <button type="button" class="btn-close" @click="closeCollectModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="mb-3">
                <strong>Member:</strong>
                <span>{{ selectedMember?.firstName }} {{ selectedMember?.lastName }}</span>
                ({{ selectedMember?.email }})
              </div>

              <div class="mt-4">
                <h6>{{ billType === 'membership' ? 'Membership Plan' : 'Special Program' }}</h6>
                <div class="form-control-plaintext p-2 bg-light rounded">
                  {{ selectedPlan?.name }} - ₹{{ selectedPlan?.price }}
                  <span v-if="billType === 'membership'">({{ selectedPlanDuration }} days)</span>
                </div>

                <div class="mt-3 row g-3">
                  <div class="col-md-4">
                    <label class="form-label"><strong>Price (₹)</strong></label>
                    <input type="number" class="form-control" :value="selectedPlan?.price" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-primary"><strong>Discount (₹)</strong></label>
                    <input type="number" class="form-control" :value="enrollmentForm.discount" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label"><strong>Already Paid (₹)</strong></label>
                    <input type="number" class="form-control" :value="oldPaid" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label"><strong>Pending (Before) (₹)</strong></label>
                    <input type="number" class="form-control" :value="oldPending" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-success"><strong>Paying Now (₹)</strong></label>
                    <input type="number" class="form-control" v-model.number="newPaidNow" min="0" :max="oldPending"
                      placeholder="Enter amount" @input="validatePayment" />
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
                </div>
              </div>

              <div v-if="selectedBill?.payments?.length" class="mt-4">
                <h6>Payment History</h6>
                <div class="table-responsive">
                  <table class="table table-sm table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>#</th>
                        <th>Amount (₹)</th>
                        <th>Date</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(p, i) in selectedBill.payments" :key="p.id">
                        <td>{{ i + 1 }}</td>
                        <td>₹{{ p.amount }}</td>
                        <td>{{ formatDateTime(p.paymentDate) }}</td>
                        <td>{{ p.method }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="mt-3 text-muted">No payments made yet.</div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-secondary" @click="closeCollectModal" :disabled="isSubmitting">
                  Cancel
                </button>
                <button type="button" class="btn btn-primary" @click="updatePayment"
                  :disabled="isSubmitting || newPaidNow <= 0">
                  {{ isSubmitting ? 'Updating...' : 'Update Payment' }}
                </button>
              </div>
            </form>
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
            <div v-if="selectedBill?.payments?.length">
              <table class="table table-sm table-bordered">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Amount (₹)</th>
                    <th>Date</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in selectedBill.payments" :key="p.id">
                    <td>{{ i + 1 }}</td>
                    <td>₹{{ p.amount }}</td>
                    <td>{{ formatDateTime(p.paymentDate) }}</td>
                    <td>{{ p.method }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-muted">No payments found.</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeHistoryModal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div class="modal fade" :class="{ show: isConfirmOpen, 'd-block': isConfirmOpen }" tabindex="-1" role="dialog"
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

type BillType = 'membership' | 'addon'

interface Member { id: number; firstName: string; lastName: string; email: string }
interface Plan { id: number; name: string; price: number; durationDays?: number }
interface Addon { id: number; name: string; price: number; durationDays?: number }
interface Payment { id: number; amount: number; paymentDate: string; method: string }
interface BaseBill { id: number; memberId: number; startDate: string; endDate?: string; price?: number; status: string; discount: number; paid?: number; pending?: number; member: Member; payments: Payment[] }
interface Membership extends BaseBill { planId: number; plan: Plan }
interface MemberAddon extends BaseBill { addonId: number; addon: Addon }
type Bill = Membership | MemberAddon

// State
const billType = ref<BillType>('membership')
const pendingBills = ref<Bill[]>([])
const approvedBills = ref<Bill[]>([])
const isLoading = ref(true)

// Filters
const filters = ref({
  pendingMember: '',
  pendingPlan: null as number | null,
  approvedMember: '',
  approvedPlan: null as number | null
})
const columnFilters = ref({
  pendingMember: false,
  pendingPlan: false,
  approvedMember: false,
  approvedPlan: false
})

// Pagination
const pendingPage = ref(1)
const approvedPage = ref(1)
const pagination = ref({
  pendingLimit: 10,
  approvedLimit: 10
})

// Dropdown
const openDropdownId = ref<number | null>(null)

// Modals & Toast
const collectModalRef = ref<HTMLElement | null>(null)
const historyModalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)
let collectModal: Modal
let historyModal: Modal
let toastInstance: Toast

// Payment Modal State
const selectedBill = ref<Bill | null>(null)
const selectedMember = ref<Member | null>(null)
const selectedPlan = ref<Plan | Addon | null>(null)
const enrollmentForm = ref({ id: 0, discount: 0 })
const oldPaid = ref(0)
const oldPending = ref(0)
const newPaidNow = ref(0)
const paymentMethod = ref<'CASH' | 'CARD' | 'UPI' | 'ONLINE'>('CASH')
const isSubmitting = ref(false)
const toastMessage = ref('')

// Confirm
const isConfirmOpen = ref(false)
const confirmMessage = ref('')
let resolveConfirm: (v: boolean) => void = () => { }

// Inline Debounce
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 500): T {
  let timeout: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }) as T
}

// API
const baseUrl = computed(() => billType.value === 'membership' ? '/memberships' : '/member-addons')

const loadBills = async () => {
  isLoading.value = true
  try {
    const res: AxiosResponse<Bill[]> = await api.get(baseUrl.value)
    const data = Array.isArray(res.data) ? res.data : []
    approvedBills.value = data.filter(b => ['ACTIVE', 'PARTIAL_PAID'].includes(b.status))
    pendingBills.value = data.filter(b => !['ACTIVE', 'PARTIAL_PAID'].includes(b.status))
    resetAllPages()
  } catch {
    showToast('Failed to load bills.', false)
  } finally {
    isLoading.value = false
  }
}

watch(billType, () => {
  resetAllFilters()
  resetAllPages()
  loadBills()
})

// Debounced Reset
const debouncedResetPendingPage = debounce(() => { pendingPage.value = 1 }, 300)
const debouncedResetApprovedPage = debounce(() => { approvedPage.value = 1 }, 300)

const resetAllPages = () => {
  pendingPage.value = 1
  approvedPage.value = 1
}

const resetAllFilters = () => {
  filters.value = { pendingMember: '', pendingPlan: null, approvedMember: '', approvedPlan: null }
  columnFilters.value = { pendingMember: false, pendingPlan: false, approvedMember: false, approvedPlan: false }
}

const toggleFilter = (key: keyof typeof columnFilters.value) => {
  columnFilters.value[key] = !columnFilters.value[key]
  if (!columnFilters.value[key]) {
    const filterKey = key.replace('pending', 'pending').replace('approved', 'approved') as keyof typeof filters.value
    // @ts-ignore
    filters.value[filterKey] = key.includes('Plan') ? null : ''
  }
}

const handleBlur = (key: string) => {
  setTimeout(() => {
    if (!columnFilters.value[key as keyof typeof columnFilters.value]) return
    const input = document.querySelector(`input[placeholder="Name / Email"]`) as HTMLInputElement
    if (input && !input.value) columnFilters.value[key as keyof typeof columnFilters.value] = false
  }, 200)
}

const clearFilter = (key: string) => {
  const filterKey = key.replace('Pending ', 'pending').replace('Approved ', 'approved').toLowerCase() as keyof typeof filters.value
  // @ts-ignore
  filters.value[filterKey] = key.includes('Plan') ? null : ''
}

const activeFilters = computed(() => {
  const map: Record<string, any> = {}
  if (filters.value.pendingMember) map['Pending Member'] = filters.value.pendingMember
  if (filters.value.pendingPlan !== null) map['Pending Plan'] = uniquePlans.value.find(p => p.id === filters.value.pendingPlan)?.name
  if (filters.value.approvedMember) map['Approved Member'] = filters.value.approvedMember
  if (filters.value.approvedPlan !== null) map['Approved Plan'] = uniquePlans.value.find(p => p.id === filters.value.approvedPlan)?.name
  return map
})

const filterLabels: Record<string, string> = {
  'Pending Member': 'Member',
  'Pending Plan': billType.value === 'membership' ? 'Plan' : 'Program',
  'Approved Member': 'Member',
  'Approved Plan': billType.value === 'membership' ? 'Plan' : 'Program'
}


const formatFilterValue = (key: string, value: any) => {
  if (key.includes('Plan')) return value || '—'
  return value
}

const uniquePlans = computed(() => {
  const map = new Map<number, Plan | Addon>()
    ;[...pendingBills.value, ...approvedBills.value].forEach(b => {
      const plan = billType.value === 'membership' ? (b as Membership).plan : (b as MemberAddon).addon
      if (plan?.id) map.set(plan.id, plan)
    })
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const filteredPending = computed(() => pendingBills.value.filter(b => {
  const memberMatch = !filters.value.pendingMember || `${b.member.firstName} ${b.member.lastName}`.toLowerCase().includes(filters.value.pendingMember.toLowerCase()) || b.member.email.toLowerCase().includes(filters.value.pendingMember.toLowerCase())
  const planMatch = filters.value.pendingPlan === null || (billType.value === 'membership' ? (b as Membership).plan.id : (b as MemberAddon).addon.id) === filters.value.pendingPlan
  return memberMatch && planMatch
}))

const filteredApproved = computed(() => approvedBills.value.filter(b => {
  const memberMatch = !filters.value.approvedMember || `${b.member.firstName} ${b.member.lastName}`.toLowerCase().includes(filters.value.approvedMember.toLowerCase()) || b.member.email.toLowerCase().includes(filters.value.approvedMember.toLowerCase())
  const planMatch = filters.value.approvedPlan === null || (billType.value === 'membership' ? (b as Membership).plan.id : (b as MemberAddon).addon.id) === filters.value.approvedPlan
  return memberMatch && planMatch
}))

const paginatedPending = computed(() => {
  const start = (pendingPage.value - 1) * pagination.value.pendingLimit
  return filteredPending.value.slice(start, start + pagination.value.pendingLimit)
})

const paginatedApproved = computed(() => {
  const start = (approvedPage.value - 1) * pagination.value.approvedLimit
  return filteredApproved.value.slice(start, start + pagination.value.approvedLimit)
})

const pendingTotalPages = computed(() => Math.max(1, Math.ceil(filteredPending.value.length / pagination.value.pendingLimit)))
const approvedTotalPages = computed(() => Math.max(1, Math.ceil(filteredApproved.value.length / pagination.value.approvedLimit)))

const pendingPages = computed(() => {
  const total = pendingTotalPages.value
  const current = pendingPage.value
  const pages = []
  const delta = 2
  const left = current - delta
  const right = current + delta + 1
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i < right)) pages.push(i)
  }
  return pages
})

const approvedPages = computed(() => {
  const total = approvedTotalPages.value
  const current = approvedPage.value
  const pages = []
  const delta = 2
  const left = current - delta
  const right = current + delta + 1
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i < right)) pages.push(i)
  }
  return pages
})

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN') : '-'
const formatDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-IN') : '-'

const totalPaid = (b: Bill) => b.payments?.reduce((s, p) => s + (Number(p.amount) || 0), 0) || 0
const getPrice = (b: Bill) => billType.value === 'membership' ? (b as Membership).plan?.price ?? 0 : (b as MemberAddon).addon?.price ?? 0
const pendingForBill = (b: Bill) => Math.max(getPrice(b) - (b.discount ?? 0) - totalPaid(b), 0)
const getPlanName = (b: Bill) => billType.value === 'membership' ? (b as Membership).plan?.name : (b as MemberAddon).addon?.name

const pendingAfterPayment = computed(() => {
  if (!selectedPlan.value) return 0
  const total = oldPaid.value + newPaidNow.value
  const net = (selectedPlan.value.price ?? 0) - (enrollmentForm.value.discount ?? 0)
  return Math.max(net - total, 0)
})

const validatePayment = () => {
  if (!isFinite(newPaidNow.value)) newPaidNow.value = 0
  if (newPaidNow.value > oldPending.value) newPaidNow.value = oldPending.value
  if (newPaidNow.value < 0) newPaidNow.value = 0
}

const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

const setupModal = (bill: Bill, partial: boolean) => {
  selectedBill.value = bill
  selectedMember.value = bill.member
  selectedPlan.value = billType.value === 'membership' ? (bill as Membership).plan : (bill as MemberAddon).addon
  enrollmentForm.value = { id: billType.value === 'membership' ? (bill as Membership).planId : (bill as MemberAddon).addonId, discount: bill.discount ?? 0 }
  oldPaid.value = totalPaid(bill)
  oldPending.value = pendingForBill(bill)
  newPaidNow.value = partial ? 0 : oldPending.value
  paymentMethod.value = 'CASH'
}

const openAssignModal = (bill: Bill) => { setupModal(bill, false); collectModal?.show() }
const openCollectModal = (bill: Bill) => { setupModal(bill, true); collectModal?.show() }
const closeCollectModal = () => { collectModal?.hide(); resetForm() }
const openHistoryModal = (bill: Bill) => { selectedBill.value = bill; historyModal?.show() }
const closeHistoryModal = () => historyModal?.hide()
const resetForm = () => { selectedBill.value = null; selectedMember.value = null; selectedPlan.value = null; newPaidNow.value = 0; isSubmitting.value = false }

const updatePayment = async () => {
  if (newPaidNow.value <= 0) return showToast('Enter a valid amount.', false)
  isSubmitting.value = true
  try {
    await api.patch(`${baseUrl.value}/payment/${selectedBill.value!.id}`, {
      amount: newPaidNow.value, method: paymentMethod.value, status: pendingAfterPayment.value === 0 ? 'ACTIVE' : 'PARTIAL_PAID'
    })
    await loadBills(); showToast('Payment updated!'); closeCollectModal()
  } catch (err: any) { showToast(err.response?.data?.message || 'Update failed.', false) }
  finally { isSubmitting.value = false }
}

const rejectBill = async (id: number) => {
  const ok = await showConfirm('Reject this bill?')
  if (!ok) return
  try { await api.delete(`${baseUrl.value}/${id}`); await loadBills(); showToast('Rejected.') }
  catch { showToast('Failed.', false) }
}

const downloadBill = async (id: number) => {
  try {
    const res = await api.get(`${baseUrl.value}/download-bill/${id}`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${billType.value}_bill_${id}.pdf`; a.click()
    window.URL.revokeObjectURL(url)
  } catch { showToast('Download failed.', false) }
}

const toggleDropdown = (id: number) => openDropdownId.value = openDropdownId.value === id ? null : id
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null
}

const showConfirm = (msg: string): Promise<boolean> => new Promise(resolve => {
  confirmMessage.value = msg; isConfirmOpen.value = true; resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) }
})

const selectedPlanDuration = computed(() => billType.value !== 'membership' ? null : (selectedPlan.value as Plan)?.durationDays ?? null)

onMounted(async () => {
  collectModal = new Modal(collectModalRef.value!)
  historyModal = new Modal(historyModalRef.value!)
  toastInstance = new Toast(toastRef.value!)
  document.addEventListener('click', handleClickOutside)
  await loadBills()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Same styles as Members UI */
.members-container {
  padding: 1.5rem;
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
}

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
  font-size: .8rem;
  color: #495057;
}

.filter-chip .btn-close {
  opacity: .7;
}

.filter-chip .btn-close:hover {
  opacity: 1;
}

.table {
  --bs-table-hover-bg: #f1f5f9;
  margin-bottom: 0;
}

.table thead th {
  font-weight: 600;
  font-size: .85rem;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: #6c757d;
  border-bottom: 1px solid #dee2e6;
  padding: .75rem 1rem;
}

.table tbody td {
  padding: .75rem 1rem;
  font-size: .925rem;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: var(--bs-table-hover-bg);
}

.status-badge {
  font-size: .75rem;
  font-weight: 600;
  padding: .25rem .6rem;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-warning {
  background: #fff3cd;
  color: #856404;
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
  transition: all .2s;
}

.icon-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.pagination .page-link {
  color: #495057;
  border-radius: 6px;
  padding: .35rem .65rem;
  font-size: .875rem;
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
  padding: .65rem 1rem;
  z-index: 1040;
  display: flex;
  justify-content: center;
}

.pagination-footer>div {
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  gap: .4rem;
}

.header-label {
  font-weight: 600;
  font-size: .85rem;
  color: #495057;
  transition: opacity .2s ease;
}

.header-label.hidden {
  opacity: 0;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  max-width: 120px;
  opacity: 1;
  transition: all .3s ease;
  padding: .15rem .4rem;
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
  transition: color .2s;
}

.filter-btn:hover,
.filter-btn.active {
  color: #4361ee;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all .25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(6px);
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

@media (max-width: 768px) {
  .pagination-footer {
    left: 0;
    padding: .5rem;
  }
}
</style>