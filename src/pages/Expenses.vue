<template>
  <div class="members-container">
    <!-- Top Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="font-size: 1.5rem;">Expense Management</h2>
        <p class="text-muted small mb-0">Track all expenses, payments, and financial records.</p>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="loadExpenses">
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
          + Add Expense
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
      <div class="mt-2 text-muted">Loading expenses...</div>
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

                <!-- Title -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.title }">Title</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.title" v-model.trim="filters.title" @input="debouncedResetPageAndLoad"
                        type="text" class="form-control form-control-sm filter-input" placeholder="Search Title"
                        @blur="handleBlur('title')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.title }"
                      @click.stop="toggleFilter('title')" title="Filter Title">
                      <template v-if="columnFilters.title">
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

                <!-- Category -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.category }">Category</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.category" v-model.trim="filters.category"
                        @input="debouncedResetPageAndLoad" type="text" class="form-control form-control-sm filter-input"
                        placeholder="Search Category" @blur="handleBlur('category')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.category }"
                      @click.stop="toggleFilter('category')" title="Filter Category">
                      <template v-if="columnFilters.category">
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

                <!-- Amount -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.amount }">Amount</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.amount" v-model.trim="filters.amount"
                        @input="debouncedResetPageAndLoad" type="text" class="form-control form-control-sm filter-input"
                        placeholder="Min Amount" @blur="handleBlur('amount')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.amount }"
                      @click.stop="toggleFilter('amount')" title="Filter Amount">
                      <template v-if="columnFilters.amount">
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
                        <option value="PENDING">Pending</option>
                        <option value="PARTIAL_PAID">Partially Paid</option>
                        <option value="PAID">Paid</option>
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

                <!-- Date -->
                <th class="filter-header">
                  <div class="filter-wrapper">
                    <span class="header-label" :class="{ hidden: columnFilters.date }">Date</span>
                    <transition name="fade-slide">
                      <input v-if="columnFilters.date" v-model.trim="filters.date" @input="debouncedResetPageAndLoad"
                        type="date" class="form-control form-control-sm filter-input" @blur="handleBlur('date')" />
                    </transition>
                    <button class="filter-btn" :class="{ active: columnFilters.date }"
                      @click.stop="toggleFilter('date')" title="Filter Date">
                      <template v-if="columnFilters.date">
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
              <template v-for="exp in expenses" :key="exp.id">
                <tr :class="{ 'table-active': expandedExpenseId === exp.id }">
                  <td class="small text-muted">{{ exp.id }}</td>
                  <td class="fw-semibold">{{ exp.title }}</td>
                  <td class="small">{{ exp.category }}</td>
                  <td class="small">₹{{ exp.amount.toFixed(2) }}</td>
                  <td class="small">
                    <span class="badge" :class="getStatusClass(exp.status)">
                      {{ exp.status }}
                    </span>
                  </td>
                  <td class="small">{{ formatDate(exp.expenseDate) }}</td>
                  <td class="text-center" @click.stop>
                    <div class="d-flex justify-content-center gap-2">
                      <!-- Add Payment -->
                      <button class="icon-btn text-success" title="Add Payment" @click.stop="openPaymentModal(exp)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path d="M8 1v14m7-7H1" />
                        </svg>
                      </button>

                      <!-- Edit -->
                      <button class="icon-btn" title="Edit" @click.stop="editExpense(exp)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M12.146.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708L4.207 13.5 2 14l.5-2.207L12.146.146zM11.207 2L3 10.207V12h1.793L13 3.793 11.207 2z" />
                        </svg>
                      </button>

                      <!-- Delete -->
                      <button class="icon-btn text-danger" title="Delete" @click.stop="confirmDelete(exp)">
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

                <!-- Expanded Row -->
                <tr v-if="expandedExpenseId === exp.id">
                  <td colspan="7" class="p-0 bg-light">
                    <div class="p-4">
                      <div class="row g-4">
                        <div class="col-md-6">
                          <h6 class="fw-bold text-primary mb-3">Financial Summary</h6>
                          <table class="table table-sm">
                            <tr>
                              <th>Total Amount</th>
                              <td>₹ R{{ exp.amount.toFixed(2) }}</td>
                            </tr>
                            <tr>
                              <th>Paid</th>
                              <td class="text-success">₹{{ (exp.paid ?? 0).toFixed(2) }}</td>
                            </tr>
                            <tr>
                              <th>Pending</th>
                              <td class="text-danger">₹{{ (exp.pending ?? exp.amount).toFixed(2) }}</td>
                            </tr>
                            <tr>
                              <th>Status</th>
                              <td><span class="badge" :class="getStatusClass(exp.status)">{{ exp.status }}</span></td>
                            </tr>
                          </table>
                        </div>
                        <div class="col-md-6">
                          <h6 class="fw-bold text-secondary mb-3">Description</h6>
                          <p class="text-muted small">{{ exp.description || '—' }}</p>

                          <h6 class="fw-bold text-info mt-4 mb-3">Payment History</h6>
                          <div v-if="exp.payments?.length" class="table-responsive">
                            <table class="table table-sm table-bordered">
                              <thead class="table-light">
                                <tr>
                                  <th>#</th>
                                  <th>Amount</th>
                                  <th>Date</th>
                                  <th>Method</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="(p, i) in exp.payments" :key="p.id">
                                  <td>{{ i + 1 }}</td>
                                  <td>₹{{ p.amount.toFixed(2) }}</td>
                                  <td>{{ formatDateTime(p.paymentDate) }}</td>
                                  <td>{{ p.method }}</td>
                                  <td>{{ p.notes || '-' }}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div v-else class="text-muted small">No payments recorded.</div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="!expenses.length">
                <td colspan="7" class="text-center text-muted py-5">No expenses found</td>
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

    <!-- Add/Edit Expense Modal -->
    <div class="modal fade" ref="expenseModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingExpense ? 'Edit Expense' : 'Add Expense' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="mb-3">
                <label class="form-label"><strong>Title</strong></label>
                <input v-model.trim="expenseForm.title" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label"><strong>Category</strong></label>
                <input v-model.trim="expenseForm.category" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label"><strong>Amount (₹)</strong></label>
                <input v-model.number="expenseForm.amount" type="number" min="0" step="0.01" class="form-control"
                  required />
              </div>
              <div class="mb-3">
                <label class="form-label"><strong>Expense Date</strong></label>
                <input v-model="expenseForm.expenseDate" type="date" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label"><strong>Description</strong></label>
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

    <!-- Add Payment Modal -->
    <div class="modal fade" ref="paymentModalRef" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered" style="max-width: 900px; width: 100%;">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">

          <!-- Header -->
          <div class="modal-header border-0 bg-primary text-white pb-3">
            <h5 class="modal-title fw-bold fs-4">
              Add Payment – {{ selectedExpense?.title }}
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closePaymentModal"
              aria-label="Close"></button>
          </div>

          <div class="modal-body pt-4 px-4">
            <form @submit.prevent="savePayment">

              <!-- Summary Card -->
              <div class="bg-light rounded-3 p-4 mb-4 border">
                <div class="row g-3 text-center text-md-start">
                  <div class="col-md-4">
                    <div class="text-muted small fw-semibold">Total Amount</div>
                    <div class="fs-4 fw-bold text-dark">₹{{ selectedExpense?.amount?.toFixed(2) }}</div>
                  </div>
                  <div class="col-md-4">
                    <div class="text-muted small fw-semibold">Already Paid</div>
                    <div class="fs-4 fw-bold text-success">₹{{ oldPaid.toFixed(2) }}</div>
                  </div>
                  <div class="col-md-4">
                    <div class="text-muted small fw-semibold">Pending</div>
                    <div class="fs-4 fw-bold text-danger">₹{{ oldPending.toFixed(2) }}</div>
                  </div>
                </div>
              </div>

              <!-- Main Input Row -->
              <div class="row g-4 align-items-end">

                <!-- Paying Now (LARGE & FOCUSED) -->
                <div class="col-lg-5">
                  <label class="form-label text-success fw-bold fs-5">
                    Paying Now <span class="text-danger">*</span>
                  </label>
                  <div class="input-group input-group-lg">
                    <span class="input-group-text fw-bold bg-white">₹</span>
                    <input type="number" class="form-control form-control-lg fw-bold text-success border-start-0"
                      :class="{ 'is-invalid': newPaidNow > oldPending || newPaidNow < 0 }" v-model.number="newPaidNow"
                      min="0" :max="oldPending" step="0.01" @input="clampPayingNow" placeholder="0.00"
                      ref="payingNowInput" required autofocus />
                    <span class="input-group-text bg-light text-muted small fw-semibold border-start-0"
                      :class="{ 'text-danger': pendingAfterPayment === 0 }">
                      → ₹{{ pendingAfterPayment.toFixed(2) }}
                    </span>
                  </div>
                  <div v-if="newPaidNow > oldPending" class="invalid-feedback mt-1">
                    Cannot exceed pending amount
                  </div>
                </div>

                <!-- Payment Method -->
                <div class="col-lg-4">
                  <label class="form-label fw-bold fs-5">
                    Method <span class="text-danger">*</span>
                  </label>
                  <select v-model="paymentMethod" class="form-select form-select-lg fw-semibold" required
                    ref="methodSelect">
                    <option value="" disabled>Select payment method</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="ONLINE">Online Transfer</option>
                  </select>
                </div>

                <!-- Notes (Optional) -->
                <div class="col-lg-3">
                  <label class="form-label text-secondary fs-6">Notes</label>
                  <input v-model.trim="paymentNotes" type="text" class="form-control" placeholder="Optional" />
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="d-flex justify-content-end gap-3 mt-5">
                <button type="button" class="btn btn-outline-secondary px-5 py-2 fw-semibold" @click="closePaymentModal"
                  :disabled="isSubmitting">
                  Cancel
                </button>
                <button type="submit" class="btn btn-success px-5 py-2 fw-bold text-white shadow-sm"
                  :disabled="isSubmitting || newPaidNow <= 0 || newPaidNow > oldPending || !paymentMethod">
                  <span v-if="isSubmitting">
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                    Adding...
                  </span>
                  <span v-else>
                    Add Payment
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
            Delete <strong>{{ expenseToDelete?.title }}</strong> permanently?
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
interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// State
const expenses = ref<Expense[]>([])
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)
const isSubmitting = ref(false)

const toastRef = ref<HTMLElement | null>(null)
const expenseModalRef = ref<HTMLElement | null>(null)
const paymentModalRef = ref<HTMLElement | null>(null)
let toastInstance: Toast
let expenseModal: Modal
let paymentModal: Modal

const editingExpense = ref<Expense | null>(null)
const expenseForm = ref<Partial<Expense>>({})
const selectedExpense = ref<Expense | null>(null)
const expenseToDelete = ref<Expense | null>(null)
const oldPaid = ref(0)
const oldPending = ref(0)
const newPaidNow = ref(0)
const paymentMethod = ref<'CASH' | 'CARD' | 'UPI' | 'ONLINE'>('CASH')
const paymentNotes = ref('')
const toastMessage = ref('')
const expandedExpenseId = ref<number | null>(null)

// Filters
const filters = ref({
  id: '',
  title: '',
  category: '',
  amount: '',
  status: '',
  date: ''
})
const columnFilters = ref({
  id: false,
  title: false,
  category: false,
  amount: false,
  status: false,
  date: false
})
const pagination = ref({ page: 1, limit: 10 })

// Filter Labels
const filterLabels: Record<string, string> = {
  id: 'ID',
  title: 'Title',
  category: 'Category',
  amount: 'Amount',
  status: 'Status',
  date: 'Date'
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

// Format
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-IN')

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

const loadExpenses = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/expenses', { params: buildQuery() }) as AxiosResponse<{ data: Expense[], meta: PaginationMeta }>
    expenses.value = res.data.data.map(exp => ({
      ...exp,
      paid: exp.paid ?? 0,
      pending: exp.pending ?? exp.amount,
      payments: exp.payments ?? []
    }))
    meta.value = res.data.meta
  } catch {
    showToast('Failed to load expenses.', false)
  } finally {
    isLoading.value = false
  }
}

const resetPageAndLoad = () => {
  pagination.value.page = 1
  loadExpenses()
}
const debouncedResetPageAndLoad = debounce(resetPageAndLoad, 600)

const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadExpenses()
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
  editingExpense.value = null
  expenseForm.value = {
    title: '',
    category: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    description: ''
  }
  expenseModal?.show()
}

const editExpense = (exp: Expense) => {
  editingExpense.value = exp
  expenseForm.value = { ...exp, expenseDate: exp.expenseDate.split('T')[0] }
  expenseModal?.show()
}

const saveExpense = async () => {
  if (!expenseForm.value.title || !expenseForm.value.category || !expenseForm.value.amount) {
    return showToast('Fill all required fields.', false)
  }
  try {
    if (editingExpense.value) {
      await api.patch(`/expenses/${editingExpense.value.id}`, expenseForm.value)
      showToast('Expense updated!')
    } else {
      await api.post('/expenses', expenseForm.value)
      showToast('Expense added!')
    }
    closeModal()
    await loadExpenses()
  } catch {
    showToast('Save failed.', false)
  }
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

const pendingAfterPayment = computed(() => Math.max(oldPending.value - newPaidNow.value, 0))

const clampPayingNow = () => {
  if (newPaidNow.value < 0) newPaidNow.value = 0
  if (newPaidNow.value > oldPending.value) newPaidNow.value = oldPending.value
}

const savePayment = async () => {
  if (newPaidNow.value <= 0) return showToast('Enter valid amount.', false)
  isSubmitting.value = true
  try {
    await api.patch(`/expenses/${selectedExpense.value!.id}/payment`, {
      amount: newPaidNow.value,
      method: paymentMethod.value,
      notes: paymentNotes.value || undefined,
      status: pendingAfterPayment.value === 0 ? 'PAID' : 'PARTIAL_PAID'
    })
    showToast('Payment added!')
    closePaymentModal()
    await loadExpenses()
  } catch {
    showToast('Payment failed.', false)
  } finally {
    isSubmitting.value = false
  }
}

// Delete
const isConfirmOpen = ref(false)
let resolveConfirm: (v: boolean) => void = () => { }
const showConfirm = (): Promise<boolean> => new Promise(resolve => {
  isConfirmOpen.value = true
  resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) }
})

const confirmDelete = async (exp: Expense) => {
  expenseToDelete.value = exp
  if (await showConfirm()) {
    try {
      await api.delete(`/expenses/${exp.id}`)
      showToast('Expense deleted!')
      await loadExpenses()
    } catch {
      showToast('Delete failed.', false)
    }
  }
}



// Helpers
const getStatusClass = (status?: string) => {
  if (!status) return 'bg-secondary'
  return {
    PENDING: 'bg-warning text-dark',
    PARTIAL_PAID: 'bg-info text-dark',
    PAID: 'bg-success'
  }[status] || 'bg-secondary'
}

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

// Lifecycle
onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  if (expenseModalRef.value) expenseModal = new Modal(expenseModalRef.value)
  if (paymentModalRef.value) paymentModal = new Modal(paymentModalRef.value)
  await loadExpenses()
})
</script>

<style scoped>
.members-container {
  padding: 1.5rem;
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
  /* min-height: 100vh; */
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

.pagination-footer>div {
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