<template>
  <div class="members-container">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="font-size: 1.5rem;">Assign Membership Plans</h2>
        <p class="text-muted small mb-0">Assign, renew, and manage membership plans & special programs.</p>
      </div>
    </div>

    <!-- Filter Bar (Sticky) -->
    <div class="filter-bar">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <div v-for="(value, key) in activeFilters" :key="key"
          class="filter-chip d-flex align-items-center gap-1 px-2 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M6 10a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 10zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 7zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 4z" />
          </svg>
          <strong>{{ filterLabels[key as unknown as string] }}:</strong>
          {{ formatFilterValue(key as unknown as string, value) }}
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
      <div class="mt-2 text-muted">Loading members, plans, special programs, and trainers...</div>
    </div>

    <!-- Inactive Members Table -->
    <div v-else>
      <div class="mb-5">
        <h5 class="fw-semibold text-danger mb-3">Members Without Active Plan</h5>
        <div class="table-responsive rounded-3 overflow-hidden">
          <div class="table-scroll-container">
            <div class="table-container border rounded-3">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
                  <tr>
                    <th class="filter-header">
                      <div class="filter-wrapper">
                        <span class="header-label" :class="{ hidden: columnFilters.name }">Name</span>
                        <transition name="fade-slide">
                          <input v-if="columnFilters.name" v-model.trim="filters.name"
                            @input="debouncedResetPageAndLoad" type="text"
                            class="form-control form-control-sm filter-input" placeholder="Name"
                            @blur="handleBlur('name')" />
                        </transition>
                        <button class="filter-btn" :class="{ active: columnFilters.name }"
                          @click.stop="toggleFilter('name')">
                          <template v-if="columnFilters.name">
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
                        <span class="header-label" :class="{ hidden: columnFilters.email }">Email</span>
                        <transition name="fade-slide">
                          <input v-if="columnFilters.email" v-model.trim="filters.email"
                            @input="debouncedResetPageAndLoad" type="text"
                            class="form-control form-control-sm filter-input" placeholder="Email"
                            @blur="handleBlur('email')" />
                        </transition>
                        <button class="filter-btn" :class="{ active: columnFilters.email }"
                          @click.stop="toggleFilter('email')">
                          <template v-if="columnFilters.email">
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
                    <th>Phone</th>
                    <th class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(m, i) in paginatedInactive" :key="m.id">
                    <td class="small text-muted">{{ (inactivePage - 1) * pagination.limit + i + 1 }}</td>
                    <td class="fw-semibold">{{ m.firstName }} {{ m.lastName }}</td>
                    <td class="small text-muted">{{ m.email }}</td>
                    <td class="small">{{ m.phone }}</td>
                    <td class="text-center">
                      <button class="icon-btn text-primary" title="Assign Plan" @click="openAssignModal(m)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path d="M8 1v14m7-7H1" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!paginatedInactive.length">
                    <td colspan="5" class="text-center text-muted py-5">No inactive members</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination -->
          <footer class="pagination-footer">
            <div class="d-flex justify-content-between align-items-center small text-muted w-100">
              <div class="d-flex align-items-center gap-2">
                <span>
                  Showing {{ (inactivePage - 1) * pagination.limit + 1 }} to
                  {{ Math.min(inactivePage * pagination.limit, filteredInactive.length) }} of {{ filteredInactive.length
                  }}
                </span>
              </div>
              <nav>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: inactivePage <= 1 }">
                    <a class="page-link" href="#"
                      @click.prevent="inactivePage = Math.max(1, inactivePage - 1)">Previous</a>
                  </li>
                  <li v-for="p in inactivePages" :key="p" class="page-item" :class="{ active: p === inactivePage }">
                    <a class="page-link" href="#" @click.prevent="inactivePage = Number(p)">{{ p }}</a>
                  </li>
                  <li class="page-item" :class="{ disabled: inactivePage >= inactiveTotalPages }">
                    <a class="page-link" href="#"
                      @click.prevent="inactivePage = Math.min(inactiveTotalPages, inactivePage + 1)">Next</a>
                  </li>
                </ul>
              </nav>
            </div>
          </footer>
        </div>
      </div>

      <!-- Active Members Table -->
      <div>
        <h5 class="fw-semibold text-success mb-3">Active Members (Sorted by Expiry Date)</h5>
        <div class="table-responsive rounded-3 overflow-hidden">
          <div class="table-scroll-container">
            <div class="table-container border rounded-3">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
                  <tr>
                    <th class="filter-header">
                      <div class="filter-wrapper">
                        <span class="header-label" :class="{ hidden: columnFilters.activeName }">Name</span>
                        <transition name="fade-slide">
                          <input v-if="columnFilters.activeName" v-model.trim="filters.activeName"
                            @input="debouncedResetPageAndLoad" type="text"
                            class="form-control form-control-sm filter-input" placeholder="Name"
                            @blur="handleBlur('activeName')" />
                        </transition>
                        <button class="filter-btn" :class="{ active: columnFilters.activeName }"
                          @click.stop="toggleFilter('activeName')">
                          <template v-if="columnFilters.activeName">
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
                        <span class="header-label" :class="{ hidden: columnFilters.activeEmail }">Email</span>
                        <transition name="fade-slide">
                          <input v-if="columnFilters.activeEmail" v-model.trim="filters.activeEmail"
                            @input="debouncedResetPageAndLoad" type="text"
                            class="form-control form-control-sm filter-input" placeholder="Email"
                            @blur="handleBlur('activeEmail')" />
                        </transition>
                        <button class="filter-btn" :class="{ active: columnFilters.activeEmail }"
                          @click.stop="toggleFilter('activeEmail')">
                          <template v-if="columnFilters.activeEmail">
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
                    <th>Plan</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(m, i) in paginatedActive" :key="m.id">
                    <td class="small text-muted">{{ (activePage - 1) * pagination.limit + i + 1 }}</td>
                    <td class="fw-semibold">{{ m.firstName }} {{ m.lastName }}</td>
                    <td class="small text-muted">{{ m.email }}</td>
                    <td><span class="badge bg-secondary text-white">{{ getPlanName(m.memberships[0]?.planId) }}</span>
                    </td>
                    <td class="small">{{ formatDate(getLastActiveEndDate(m.memberships)) }}</td>
                    <td>
                      <span class="status-badge status-success">{{ m.memberships[0]?.status }}</span>
                    </td>
                    <td class="text-center">
                      <button class="icon-btn text-warning" title="Renew / Assign New" @click="openAssignModal(m)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" />
                          <path
                            d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!paginatedActive.length">
                    <td colspan="7" class="text-center text-muted py-5">No active members</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination -->
          <footer class="pagination-footer">
            <div class="d-flex justify-content-between align-items-center small text-muted w-100">
              <div class="d-flex align-items-center gap-2">
                <span>
                  Showing {{ (activePage - 1) * pagination.limit + 1 }} to
                  {{ Math.min(activePage * pagination.limit, filteredActive.length) }} of {{ filteredActive.length }}
                </span>
                <div class="d-flex align-items-center ms-3">
                  <label class="me-1">Rows per page:</label>
                  <select v-model.number="pagination.limit" @change="resetPages"
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
                  <li class="page-item" :class="{ disabled: activePage <= 1 }">
                    <a class="page-link" href="#" @click.prevent="activePage = Math.max(1, activePage - 1)">Previous</a>
                  </li>
                  <li v-for="p in activePages" :key="p" class="page-item" :class="{ active: p === activePage }">
                    <a class="page-link" href="#" @click.prevent="activePage = Number(p)">{{ p }}</a>
                  </li>
                  <li class="page-item" :class="{ disabled: activePage >= activeTotalPages }">
                    <a class="page-link" href="#"
                      @click.prevent="activePage = Math.min(activeTotalPages, activePage + 1)">Next</a>
                  </li>
                </ul>
              </nav>
            </div>
          </footer>
        </div>
      </div>
    </div>

    <!-- Assign / Renew Modal -->
    <div class="modal fade" ref="assignModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{selectedMember?.memberships.some(ms => ms.status === 'ACTIVE') ? 'Renew / Update' : 'Assign'}}
              Membership / Special Program
            </h5>
            <button type="button" class="btn-close" @click="closeAssignModal"></button>
          </div>
          <div class="modal-body">
            <!-- Member Info -->
            <div class="mb-3">
              <strong>Member:</strong>
              {{ selectedMember?.firstName }} {{ selectedMember?.lastName }}
              <span class="text-muted">({{ selectedMember?.email }})</span>
            </div>

            <!-- Membership Section -->
            <div class="border rounded-3 p-3 mb-4 shadow-sm bg-white">
              <h5 class="text-primary mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"
                  class="me-1">
                  <path
                    d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 0-1h5.793L8.146 4.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5a.5.5 0 0 1 0-1z" />
                </svg>
                Membership Section
              </h5>

              <!-- Plan Dropdown -->
              <div class="mb-3">
                <label class="form-label fw-semibold">Select Membership Plan</label>
                <select v-model="enrollmentForm.planId" class="form-select" @change="updatePlanDates"
                  :disabled="plans.length === 0">
                  <option :value="0">-- Select Plan --</option>
                  <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                    {{ plan.name }} - ₹{{ plan.price }} ({{ plan.durationDays }} days)
                  </option>
                </select>
              </div>

              <!-- Membership History -->
              <div v-if="selectedMember?.memberships?.length" class="mb-3">
                <h6 class="text-secondary mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"
                    class="me-1">
                    <path
                      d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412l-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                  </svg>
                  Membership History
                </h6>
                <div class="table-responsive small">
                  <table class="table table-sm table-striped align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Plan</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                        <th>Paid</th>
                        <th>Discount</th>
                        <th>Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="ms in selectedMember.memberships" :key="ms.id">
                        <td>{{ ms.plan?.name || getPlanName(ms.planId) }}</td>
                        <td>{{ formatDate(ms.startDate) }}</td>
                        <td>{{ formatDate(ms.endDate) }}</td>
                        <td>
                          <span :class="['badge',
                            ms.status === 'ACTIVE' ? 'bg-success' :
                              ms.status === 'PARTIAL_PAID' ? 'bg-warning text-dark' :
                                ms.status === 'INACTIVE' ? 'bg-secondary' :
                                  'bg-danger']">
                            {{ ms.status }}
                          </span>
                        </td>
                        <td>{{ ms.paid || 0 }}</td>
                        <td>{{ ms.discount || 0 }}</td>
                        <td>{{ ms.pending || 0 }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Plan Form -->
              <div v-if="selectedPlan" class="mt-3 p-3 border rounded bg-light">
                <h6 class="mb-3 text-primary">Membership Plan Details</h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <p><strong>Description:</strong> {{ selectedPlan.description }}</p>
                    <p><strong>Duration:</strong> {{ selectedPlan.durationDays }} days</p>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label"><strong>Start Date:</strong></label>
                    <input type="date" v-model="enrollmentForm.startDate" class="form-control"
                      @change="updatePlanDates" />
                    <p class="mt-2"><strong>End Date:</strong> {{ formattedEndDate }}</p>
                  </div>
                </div>

                <div class="row mt-3 g-3">
                  <div class="col-md-4">
                    <label class="form-label"><strong>Price (₹)</strong></label>
                    <input type="number" class="form-control" :value="selectedPlan.price" readonly />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Discount (₹)</label>
                    <input type="number" v-model.number="enrollmentForm.discount" class="form-control" min="0"
                      :max="selectedPlan.price" @input="clampDiscount" placeholder="0" />
                    <small v-if="discountExceedsPrice" class="text-danger">
                      Discount cannot exceed plan price (₹{{ selectedPlan.price }})
                    </small>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Pending (₹)</label>
                    <input type="number" class="form-control" :value="pendingAmount" readonly />
                  </div>
                </div>
              </div>
            </div>

            <!-- Special Program Section -->
            <div class="border rounded-3 p-3 mb-4 shadow-sm bg-white">
              <h5 class="text-success mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"
                  class="me-1">
                  <path d="M8 16a8 8 0 1 0 0-16A8 8 0 0 0 8 16zm1-8.5V4h-2v3.5H5l3 3 3-3H9z" />
                </svg>
                Special Program Section
              </h5>

              <!-- Addon Dropdown -->
              <div class="mb-3">
                <label class="form-label fw-semibold">Select Special Program</label>
                <select v-model="selectedAddonId" class="form-select" @change="onAddonSelect"
                  :disabled="addons.length === 0">
                  <option :value="0">-- Select Special Program --</option>
                  <option v-for="a in addons" :key="a.id" :value="a.id">
                    {{ a.name }} - ₹{{ a.price }} ({{ a.durationDays }} days)
                  </option>
                </select>
              </div>

              <!-- Special Program History -->
              <div v-if="selectedMember?.memberAddons?.length" class="mb-3">
                <h6 class="text-secondary mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"
                    class="me-1">
                    <path
                      d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412l-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                  </svg>
                  Special Program History
                </h6>
                <div class="table-responsive small">
                  <table class="table table-sm table-striped align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Program</th>
                        <th>Trainer</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                        <th>Paid</th>
                        <th>Discount</th>
                        <th>Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="ad in selectedMember.memberAddons" :key="ad.id">
                        <td>{{ ad.addon?.name }}</td>
                        <td>{{ ad.trainerId ? getTrainerName(ad.trainerId) : '—' }}</td>
                        <td>{{ formatDate(ad.startDate) }}</td>
                        <td>{{ formatDate(ad.endDate) }}</td>
                        <td>
                          <span :class="['badge',
                            ad.status === 'ACTIVE' ? 'bg-success' :
                              ad.status === 'PARTIAL_PAID' ? 'bg-warning text-dark' :
                                ad.status === 'INACTIVE' ? 'bg-secondary' :
                                  'bg-danger']">
                            {{ ad.status }}
                          </span>
                        </td>
                        <td>{{ ad.paid || 0 }}</td>
                        <td>{{ ad.discount || 0 }}</td>
                        <td>{{ ad.pending || 0 }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Special Program Form -->
              <div v-if="selectedAddon" class="mt-3 p-3 border rounded bg-light">
                <h6 class="mb-3 text-success">Special Program Details</h6>
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Description:</strong> {{ selectedAddon.description }}</p>
                    <p><strong>Duration:</strong> {{ selectedAddon.durationDays }} days</p>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label"><strong>Start Date:</strong></label>
                    <input type="date" v-model="addonStartDate" class="form-control" @change="updateAddonEndDate" />
                    <p class="mt-2"><strong>End Date:</strong> {{ formattedAddonEndDate }}</p>
                  </div>
                </div>

                <div class="row mt-3 g-3">
                  <div class="col-md-3">
                    <label class="form-label"><strong>Price (₹)</strong></label>
                    <input type="number" class="form-control" :value="selectedAddon.price" readonly />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Discount (₹)</label>
                    <input type="number" v-model.number="addonDiscount" class="form-control" min="0"
                      :max="selectedAddon.price" @input="clampAddonDiscount" placeholder="0" />
                    <small v-if="addonDiscountExceedsPrice" class="text-danger">
                      Discount cannot exceed program price (₹{{ selectedAddon.price }})
                    </small>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Pending (₹)</label>
                    <input type="number" class="form-control" :value="addonPendingAmount" readonly />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Trainer</label>
                    <select v-model="addonTrainerId" class="form-select">
                      <option :value="null">-- Select Trainer (Optional) --</option>
                      <option v-for="trainer in trainers" :key="trainer.id" :value="trainer.id">
                        {{ trainer.firstName }} {{ trainer.lastName }} ({{ trainer.speciality }})
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <div v-if="!isFormValid" class="alert alert-warning mt-3">
              <small><strong>Please select at least one:</strong> Plan or Special Program</small>
            </div>

            <button type="submit" class="btn btn-success w-100 mt-4" :disabled="isSubmitting || !isFormValid"
              @click="assignPlan">
              {{ isSubmitting ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'

interface Plan { id: number; name: string; description: string; price: number; durationDays: number }
interface Trainer { id: number; firstName: string; lastName: string; speciality?: string }
interface Membership { id: number; planId: number; startDate: string; endDate: string; status: string; paid?: number; discount?: number; pending?: number; plan?: Plan }
interface MemberAddon { id: number; addonId: number; trainerId?: number | null; startDate: string; endDate: string; price: number; status: string; discount?: number; paid?: number; pending?: number; addon?: Plan }
interface Member { id: number; firstName: string; lastName: string; email: string; phone: string; memberships: Membership[]; memberAddons: MemberAddon[] }

const members = ref<Member[]>([])
const plans = ref<Plan[]>([])
const addons = ref<Plan[]>([])
const trainers = ref<Trainer[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)

const assignModalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)
let assignModal!: Modal
let toastInstance!: Toast

const selectedMember = ref<Member | null>(null)

const enrollmentForm = ref({
  memberId: 0,
  planId: 0,
  startDate: '',
  endDate: '',
  paid: 0,
  discount: 0,
  method: 'CASH' as 'CASH' | 'CARD' | 'UPI' | 'ONLINE'
})

const selectedAddonId = ref<number>(0)
const addonTrainerId = ref<number | null>(null)
const addonStartDate = ref('')
const addonEndDate = ref('')
const addonDiscount = ref<number>(0)

const toastMessage = ref('')

// Filters
const filters = ref({ name: '', email: '', activeName: '', activeEmail: '' })
const columnFilters = ref({ name: false, email: false, activeName: false, activeEmail: false })
const pagination = ref({ limit: 10 })
const inactivePage = ref(1)
const activePage = ref(1)

const filterLabels: Record<string, string> = { name: 'Name', email: 'Email', activeName: 'Name', activeEmail: 'Email' }

// Computed
const activeFilters = computed(() => {
  const active: any = {}
  Object.entries(filters.value).forEach(([k, v]) => { if (v) active[k] = v })
  return active
})
const formatFilterValue = (key: string, value: string) => value

const selectedPlan = computed(() => plans.value.find(p => p.id === enrollmentForm.value.planId))
const selectedAddon = computed(() => addons.value.find(a => a.id === selectedAddonId.value))

const formattedEndDate = computed(() => enrollmentForm.value.endDate ? new Date(enrollmentForm.value.endDate).toLocaleDateString('en-IN') : '')
const formattedAddonEndDate = computed(() => addonEndDate.value ? new Date(addonEndDate.value).toLocaleDateString('en-IN') : '')

const pendingAmount = computed(() => {
  if (!selectedPlan.value) return 0
  const total = selectedPlan.value.price
  const paid = enrollmentForm.value.paid || 0
  const discount = enrollmentForm.value.discount || 0
  return Math.max(total - paid - discount, 0)
})

const addonPendingAmount = computed(() => {
  if (!selectedAddon.value) return 0
  return Math.max(selectedAddon.value.price - (addonDiscount.value || 0), 0)
})

const discountExceedsPrice = computed(() => selectedPlan.value && enrollmentForm.value.discount > selectedPlan.value.price)
const addonDiscountExceedsPrice = computed(() => selectedAddon.value && addonDiscount.value > selectedAddon.value.price)

const isFormValid = computed(() => {
  const hasPlan = enrollmentForm.value.planId > 0 && enrollmentForm.value.startDate && enrollmentForm.value.endDate
  const hasAddon = selectedAddonId.value && addonStartDate.value && addonEndDate.value
  return hasPlan || hasAddon
})

// Members
const filteredInactive = computed(() => {
  return members.value.filter(m => {
    const noActive = !m.memberships.some(ms => ms.status === 'ACTIVE')
    const name = !filters.value.name || `${m.firstName} ${m.lastName}`.toLowerCase().includes(filters.value.name.toLowerCase())
    const email = !filters.value.email || m.email.toLowerCase().includes(filters.value.email.toLowerCase())
    return noActive && name && email
  })
})

const filteredActive = computed(() => {
  return members.value
    .filter(m => m.memberships.some(ms => ms.status === 'ACTIVE'))
    .map(m => ({ ...m, memberships: m.memberships.filter(ms => ms.status === 'ACTIVE') }))
    .filter(m => {
      const name = !filters.value.activeName || `${m.firstName} ${m.lastName}`.toLowerCase().includes(filters.value.activeName.toLowerCase())
      const email = !filters.value.activeEmail || m.email.toLowerCase().includes(filters.value.activeEmail.toLowerCase())
      return name && email
    })
    .sort((a, b) => new Date(a.memberships[0].endDate).getTime() - new Date(b.memberships[0].endDate).getTime())
})

const paginatedInactive = computed(() => {
  const start = (inactivePage.value - 1) * pagination.value.limit
  return filteredInactive.value.slice(start, start + pagination.value.limit)
})
const paginatedActive = computed(() => {
  const start = (activePage.value - 1) * pagination.value.limit
  return filteredActive.value.slice(start, start + pagination.value.limit)
})

const inactiveTotalPages = computed(() => Math.ceil(filteredInactive.value.length / pagination.value.limit))
const activeTotalPages = computed(() => Math.ceil(filteredActive.value.length / pagination.value.limit))

const inactivePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  for (let i = Math.max(2, inactivePage.value - delta); i <= Math.min(inactiveTotalPages.value - 1, inactivePage.value + delta); i++) range.push(i)
  if (inactivePage.value - delta > 2) range.unshift('...')
  if (inactivePage.value + delta < inactiveTotalPages.value - 1) range.push('...')
  range.unshift(1)
  if (inactiveTotalPages.value > 1) range.push(inactiveTotalPages.value)
  return range
})
const activePages = computed(() => {
  const delta = 2
  const range: (number | string)[] = []
  for (let i = Math.max(2, activePage.value - delta); i <= Math.min(activeTotalPages.value - 1, activePage.value + delta); i++) range.push(i)
  if (activePage.value - delta > 2) range.unshift('...')
  if (activePage.value + delta < activeTotalPages.value - 1) range.push('...')
  range.unshift(1)
  if (activeTotalPages.value > 1) range.push(activeTotalPages.value)
  return range
})

// Helpers
const getPlanName = (id?: number) => plans.value.find(p => p.id === id)?.name ?? 'N/A'
const getTrainerName = (id: number) => trainers.value.find(t => t.id === id)?.firstName + ' ' + trainers.value.find(t => t.id === id)?.lastName || 'N/A'
const formatDate = (dateStr?: string | null) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : 'N/A'
const getLastActiveEndDate = (list: Membership[]) => list.find(m => m.status === 'ACTIVE')?.endDate || null

const showToast = (msg: string, success = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`
    toastInstance?.show()
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast() }, 4000)
}
const hideToast = () => toastInstance?.hide()

const clampDiscount = () => {
  if (enrollmentForm.value.discount > (selectedPlan.value?.price || 0)) enrollmentForm.value.discount = selectedPlan.value!.price
  if (enrollmentForm.value.discount < 0) enrollmentForm.value.discount = 0
}
const clampAddonDiscount = () => {
  if (addonDiscount.value > (selectedAddon.value?.price || 0)) addonDiscount.value = selectedAddon.value!.price
  if (addonDiscount.value < 0) addonDiscount.value = 0
}

// Date Calculations
const updatePlanDates = () => {
  const plan = selectedPlan.value
  if (!plan || !enrollmentForm.value.startDate) {
    enrollmentForm.value.endDate = ''
    return
  }
  const start = new Date(enrollmentForm.value.startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + plan.durationDays - 1)
  enrollmentForm.value.endDate = end.toISOString().split('T')[0]
  if (selectedAddon.value && !addonStartDate.value) {
    addonStartDate.value = enrollmentForm.value.startDate
    updateAddonEndDate()
  }
}
const updateAddonEndDate = () => {
  const addon = selectedAddon.value
  if (!addon || !addonStartDate.value) {
    addonEndDate.value = ''
    return
  }
  const start = new Date(addonStartDate.value)
  const end = new Date(start)
  end.setDate(start.getDate() + addon.durationDays - 1)
  addonEndDate.value = end.toISOString().split('T')[0]
}
const onAddonSelect = () => {
  const addon = selectedAddon.value
  if (addon) {
    addonStartDate.value = enrollmentForm.value.startDate || new Date().toISOString().split('T')[0]
    updateAddonEndDate()
  } else {
    addonStartDate.value = ''
    addonEndDate.value = ''
    addonTrainerId.value = null
    addonDiscount.value = 0
  }
}

// Modal
const openAssignModal = (member: Member) => {
  selectedMember.value = member
  const lastActive = member.memberships.find(m => m.status === 'ACTIVE')
  const today = new Date().toISOString().split('T')[0]
  const nextDay = lastActive?.endDate
    ? (() => { const d = new Date(lastActive.endDate); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()
    : today

  enrollmentForm.value = {
    memberId: member.id,
    planId: 0,
    startDate: nextDay,
    endDate: '',
    paid: 0,
    discount: 0,
    method: 'CASH'
  }

  selectedAddonId.value = 0
  addonTrainerId.value = null
  addonStartDate.value = ''
  addonEndDate.value = ''
  addonDiscount.value = 0

  assignModal.show()
}
const closeAssignModal = () => {
  assignModal.hide()
  selectedMember.value = null
}

// API
const loadMembers = async () => {
  try {
    const { data } = await api.get<{ data: Member[] }>('/members')
    members.value = Array.isArray(data.data) ? data.data : []
  } catch { showToast('Failed to load members.', false) }
}
const loadPlans = async () => {
  try {
    const { data } = await api.get<Plan[]>('/plans/list-all?isActive=true&sortBy=createdAt&order=desc')
    plans.value = Array.isArray(data) ? data : []
  } catch { showToast('Failed to load plans.', false) }
}
const loadAddons = async () => {
  try {
    const { data } = await api.get<Plan[]>('/addons/list-all?isActive=true&sortBy=createdAt&order=desc')
    addons.value = Array.isArray(data) ? data : []
  } catch { showToast('Failed to load addons.', false) }
}
const loadTrainers = async () => {
  try {
    const { data } = await api.get<{ data: Trainer[] }>('/trainers')
    trainers.value = Array.isArray(data.data) ? data.data : []
  } catch { showToast('Failed to load trainers.', false) }
}

const assignPlan = async () => {
  if (!isFormValid.value) return showToast('Please select at least a plan or addon.', false)
  isSubmitting.value = true
  let success = 0
  const errors: string[] = []

  try {
    if (enrollmentForm.value.planId > 0) {
      try {
        await api.post('/memberships', enrollmentForm.value)
        success++
      } catch (e: any) { errors.push(`Plan: ${e.response?.data?.message || 'Failed'}`) }
    }
    if (selectedAddonId.value && addonStartDate.value && addonEndDate.value) {
      const payload = {
        memberId: enrollmentForm.value.memberId,
        addonId: selectedAddonId.value,
        trainerId: addonTrainerId.value ?? undefined,
        startDate: addonStartDate.value,
        endDate: addonEndDate.value,
        paid: 0,
        discount: addonDiscount.value
      }
      try {
        await api.post('/member-addons', payload)
        success++
      } catch (e: any) { errors.push(`Addon: ${e.response?.data?.message || 'Failed'}`) }
    }

    showToast(success === 2 ? 'Plan and addon assigned!' : success === 1 ? 'Assigned!' : 'Saved.', true)
    if (errors.length) showToast(errors.join(' | '), false)
    await loadMembers()
    closeAssignModal()
  } catch { showToast('Error.', false) } finally { isSubmitting.value = false }
}

// Filter helpers
const clearFilter = (key: string) => {
  ; (filters.value as any)[key] = ''
    ; (columnFilters.value as any)[key] = false
  resetPages()
}
const toggleFilter = (key: string) => {
  ; (columnFilters.value as any)[key] = !(columnFilters.value as any)[key]
  if (!(columnFilters.value as any)[key]) (filters.value as any)[key] = ''
}
const handleBlur = (key: string) => {
  if (!(filters.value as any)[key]) (columnFilters.value as any)[key] = false
}
const resetPages = () => { inactivePage.value = 1; activePage.value = 1 }

function debounce<T extends (...args: any[]) => void>(fn: T, delay = 800): T {
  let timeout: any
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }) as T
}
const debouncedResetPageAndLoad = debounce(resetPages, 800)

onMounted(async () => {
  if (assignModalRef.value) assignModal = new Modal(assignModalRef.value)
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  await Promise.all([loadMembers(), loadPlans(), loadAddons(), loadTrainers()])
  isLoading.value = false
})
</script>

<style scoped>
/* SAME AS ADMIN APPROVALS */
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

@media (max-width: 768px) {
  .pagination-footer {
    left: 0;
    padding: .5rem;
  }
}
</style>