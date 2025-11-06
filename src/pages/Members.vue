<template>
  <div class="members-container">
    <!-- Top Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="font-size: 1.5rem;">Members Management</h2>
        <p class="text-muted small mb-0">Manage members, memberships and special programs.</p>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="loadMembers">
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
          + New Enrollment
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
      <div class="mt-2 text-muted">Loading members and plans...</div>
    </div>

    <!-- Table Container -->
    <div v-else class="table-responsive rounded-3 overflow-hidden">
      <div class="table-scroll-container">
        <div class="table-container border rounded-3 ">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-muted small fw-semibold sticky-top" style="z-index: 10;">
              <tr>
                <!-- ID -->
                <th class="position-relative">
                  <div class="d-flex align-items-center justify-content-between">
                    ID
                    <button v-if="!columnFilters.id" @click.stop="columnFilters.id = true" class="btn btn-sm p-0 ms-2"
                      title="Search ID">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                      </svg>
                    </button>
                    <input v-if="columnFilters.id" v-model.trim="filters.id" @input="debouncedResetPageAndLoad"
                      type="text" class="form-control form-control-sm w-auto ms-2" placeholder="ID"
                      @blur="handleBlur('id')" />
                  </div>
                </th>

                <!-- Name -->
                <th class="position-relative">
                  <div class="d-flex align-items-center justify-content-between">
                    Name
                    <button v-if="!columnFilters.name" @click.stop="columnFilters.name = true"
                      class="btn btn-sm p-0 ms-2" title="Search Name">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                      </svg>
                    </button>
                    <input v-if="columnFilters.name" v-model.trim="filters.name" @input="debouncedResetPageAndLoad"
                      type="text" class="form-control form-control-sm w-auto ms-2" placeholder="Name"
                      @blur="handleBlur('name')" />
                  </div>
                </th>

                <!-- Email -->
                <th class="position-relative">
                  <div class="d-flex align-items-center justify-content-between">
                    Email
                    <button v-if="!columnFilters.email" @click.stop="columnFilters.email = true"
                      class="btn btn-sm p-0 ms-2" title="Search Email">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                      </svg>
                    </button>
                    <input v-if="columnFilters.email" v-model.trim="filters.email" @input="debouncedResetPageAndLoad"
                      type="text" class="form-control form-control-sm w-auto ms-2" placeholder="Email"
                      @blur="handleBlur('email')" />
                  </div>
                </th>

                <!-- Phone -->
                <th class="position-relative">
                  <div class="d-flex align-items-center justify-content-between">
                    Phone
                    <button v-if="!columnFilters.phone" @click.stop="columnFilters.phone = true"
                      class="btn btn-sm p-0 ms-2" title="Search Phone">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                      </svg>
                    </button>
                    <input v-if="columnFilters.phone" v-model.trim="filters.phone" @input="debouncedResetPageAndLoad"
                      type="text" class="form-control form-control-sm w-auto ms-2" placeholder="Phone"
                      @blur="handleBlur('phone')" />
                  </div>
                </th>

                <!-- Plan -->
                <th class="position-relative">
                  <div class="d-flex align-items-center justify-content-between">
                    Plan
                    <button v-if="!columnFilters.plan" @click.stop="columnFilters.plan = true"
                      class="btn btn-sm p-0 ms-2" title="Search Plan">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                      </svg>
                    </button>
                    <input v-if="columnFilters.plan" v-model.trim="filters.plan" @input="debouncedResetPageAndLoad"
                      type="text" class="form-control form-control-sm w-auto ms-2" placeholder="Plan"
                      @blur="handleBlur('plan')" />
                  </div>
                </th>

                <!-- Status -->
                <!-- Status -->
                <th class="position-relative">
                  <div class="d-flex align-items-center justify-content-between">
                    Status
                    <button v-if="!columnFilters.status" @click.stop="columnFilters.status = true"
                      class="btn btn-sm p-0 ms-2" title="Filter Status">
                      <!-- Funnel / Filter Icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                        viewBox="0 0 16 16">
                        <path
                          d="M6 10a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 10zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 7zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 4z" />
                      </svg>

                    </button>

                    <!-- 🔽 Status Dropdown -->
                    <select v-if="columnFilters.status" v-model="filters.status" @change="debouncedResetPageAndLoad"
                      class="form-select form-select-sm w-auto ms-2" @blur="handleBlur('status')">
                      <option value="">All</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="PARTIAL_PAID">Partial Paid</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </th>

                <!-- Action -->
                <th class="text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              <template v-for="member in members" :key="member.id">
                <tr @click="toggleExpand(member.id)" style="cursor: pointer;"
                  :class="{ 'table-active': expandedMemberId === member.id }">
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                          viewBox="0 0 16 16">
                          <path
                            d="M12.146.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708L4.207 13.5 2 14l.5-2.207L12.146.146zM11.207 2L3 10.207V12h1.793L13 3.793 11.207 2z" />
                        </svg>
                      </button>

                      <button class="icon-btn text-danger" :disabled="!canDeleteMember(member)" title="Delete"
                        @click.stop="confirmDelete(member)">
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
                <tr v-if="expandedMemberId === member.id">
                  <td colspan="7" class="p-0 bg-light">
                    <div class="p-4">
                      <div class="row g-4">
                        <div class="col-md-6">
                          <h6 class="fw-bold text-primary mb-3">Memberships</h6>
                          <div v-if="member.memberships?.length" class="table-responsive">
                            <table class="table table-sm table-bordered">
                              <thead class="table-light small">
                                <tr>
                                  <th>Plan</th>
                                  <th>Status</th>
                                  <th>Start</th>
                                  <th>End</th>
                                  <th>Paid</th>
                                  <th>Pending</th>
                                  <th>Discount</th>
                                  <!-- <th>Actions</th> -->
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="ms in member.memberships" :key="'m-' + ms.id">
                                  <td>{{ ms.plan?.name ?? 'N/A' }}</td>
                                  <td><span class="status-badge" :class="getStatusClass(ms.status)">{{ ms.status
                                  }}</span></td>
                                  <td>{{ formatDate(ms.startDate) }}</td>
                                  <td>{{ formatDate(ms.endDate) }}</td>
                                  <td>₹{{ ms.paid }}</td>
                                  <td>₹{{ ms.pending }}</td>
                                  <td>₹{{ ms.discount ?? 0 }}</td>
                                  <!-- <td>
                                    <button class="btn btn-sm btn-outline-primary me-1"
                                      @click.stop="openEditMembershipModal(ms)">Edit</button>
                                    <button class="btn btn-sm btn-outline-success"
                                      @click.stop="openRefundModal(ms)">Refund</button>
                                  </td> -->
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p v-else class="text-muted small">No memberships</p>
                        </div>

                        <div class="col-md-6">
                          <h6 class="fw-bold text-success mb-3">Special Programs</h6>
                          <div v-if="member.memberAddons?.length" class="table-responsive">
                            <table class="table table-sm table-bordered">
                              <thead class="table-light small">
                                <tr>
                                  <th>Name</th>
                                  <th>Status</th>
                                  <th>Start</th>
                                  <th>End</th>
                                  <th>Paid</th>
                                  <th>Pending</th>
                                  <th>Trainer</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="ad in member.memberAddons" :key="'a-' + ad.id">
                                  <td>{{ ad.addon?.name ?? 'N/A' }}</td>
                                  <td><span class="status-badge" :class="getStatusClass(ad.status)">{{ ad.status
                                  }}</span></td>
                                  <td>{{ formatDate(ad.startDate) }}</td>
                                  <td>{{ formatDate(ad.endDate) }}</td>
                                  <td>₹{{ ad.paid }}</td>
                                  <td>₹{{ ad.pending }}</td>
                                  <td>{{ ad.trainerId ?? 'N/A' }}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p v-else class="text-muted small">No add-ons</p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="!members.length">
                <td colspan="7" class="text-center text-muted py-5">No members found</td>
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

            <!-- 🔽 Limit Dropdown -->
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
                <a class="page-link" href="#" @click.prevent="goToPage(p)">{{ p }}</a>
              </li>
              <li class="page-item" :class="{ disabled: meta.page >= meta.totalPages }">
                <a class="page-link" href="#" @click.prevent="goToPage(meta.page + 1)">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
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
import { ref, computed, onMounted } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// Interfaces
interface Plan { id: number; name: string }
interface Membership {
  id: number; planId: number; startDate: string; endDate: string; status: string;
  discount?: number; paid: number; pending: number; plan?: Plan
}
interface Addon {
  id: number; addonId: number; startDate: string; endDate: string; status: string;
  paid: number; pending: number; trainerId?: number | null; addon?: { name: string }
}
interface Member {
  id: number; firstName: string; lastName: string; email: string; phone: string;
  address?: string; gender?: string; referralSource?: string; notes?: string;
  memberships: Membership[]; memberAddons: Addon[]
}
interface PaginationMeta { total: number; page: number; limit: number; totalPages: number }

// Filter Keys
// type FilterKey = keyof typeof filters.value
type FilterKey = keyof typeof columnFilters.value

// State
const members = ref<Member[]>([])
const plans = ref<Plan[]>([])
const filters = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  plan: '',
  status: ''
})
const columnFilters = ref({
  id: false,
  name: false,
  email: false,
  phone: false,
  plan: false,
  status: false
})
const pagination = ref({ page: 1, limit: 10 })
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const isLoading = ref(true)

// Toast & Modals
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
const memberForm = ref<Partial<Member>>({})
const memberErrors = ref<Record<string, string>>({})
const originalMemberForm = ref<Partial<Member>>({})
const membershipForm = ref<Partial<Membership>>({})
const refundForm = ref({ amount: 0, reason: '', method: 'CASH' })
const toastMessage = ref('')

// Filter Labels
const filterLabels: Record<FilterKey, string> = {
  id: 'ID',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  plan: 'Plan',
  status: 'Status'
}

// Active Filters (for chips)
const activeFilters = computed(() => {
  const active: Partial<typeof filters.value> = {}
  Object.entries(filters.value).forEach(([k, v]) => {
    if (v) (active as any)[k] = v
  })
  return active
})

// Simple debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 500): T {
  let timeout: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }) as T
}

// Handle blur for column filters
const handleBlur = (key: FilterKey) => {
  if (!filters.value[key]) {
    columnFilters.value[key] = false
  }
}

const clearFilter = (key: FilterKey) => {
  filters.value[key] = ''
  columnFilters.value[key] = false
  resetPageAndLoad()
}

// Computed
const isMemberFormValid = computed(() => {
  ;['firstName', 'lastName', 'email', 'phone'].forEach(validateMemberField)
  return !!memberForm.value.firstName && !!memberForm.value.lastName && !!memberForm.value.email && !!memberForm.value.phone && !Object.values(memberErrors.value).some(err => err)
})
const isMemberFormDirty = computed(() => {
  if (!editingMember.value) return true
  const keys: (keyof Member)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'gender', 'referralSource', 'notes']
  return keys.some(key => (memberForm.value[key] ?? '').toString().trim() !== (originalMemberForm.value[key] ?? '').toString().trim())
})
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
  const hasActive = member.memberships?.some(ms => ms.status === 'ACTIVE') || member.memberAddons?.some(ad => ad.status === 'ACTIVE')
  return !hasActive && (member.memberships?.length ?? 0) === 0 && (member.memberAddons?.length ?? 0) === 0
}

// Validation
const validateMemberField = (field: string) => {
  const value = memberForm.value[field as keyof Member]
  switch (field) {
    case 'firstName': memberErrors.value.firstName = value ? '' : 'Required.'; break
    case 'lastName': memberErrors.value.lastName = value ? '' : 'Required.'; break
    case 'email': memberErrors.value.email = value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? '' : 'Invalid email.'; break
    case 'phone': memberErrors.value.phone = value && /^[0-9]{10}$/.test(String(value)) ? '' : '10 digits required.'; break
  }
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

// API: Build query
const buildQuery = () => {
  const query: Record<string, any> = {}
  Object.entries(filters.value).forEach(([k, v]) => {
    if (v) query[k] = v
  })
  query.page = pagination.value.page
  query.limit = pagination.value.limit
  return query
}

const loadMembers = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/members', { params: buildQuery() }) as AxiosResponse<{ data: Member[], meta: PaginationMeta }>
    members.value = res.data.data
    meta.value = res.data.meta
  } catch {
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

const resetPageAndLoad = () => {
  pagination.value.page = 1
  loadMembers()
}
const debouncedResetPageAndLoad = debounce(resetPageAndLoad, 700)


const goToPage = (page: number | string) => {
  if (typeof page !== 'number' || page < 1 || page > meta.value.totalPages || page === meta.value.page) return
  pagination.value.page = page
  loadMembers()
}

// Member Modal
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
  if (!isMemberFormValid.value) return showToast('Fill required fields.', false)
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
  } catch { showToast('Save failed.', false) }
}

// Membership Actions
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
    await loadMembers(); closeMembershipModal()
  } catch { showToast('Update failed.', false) }
}

// Refund
const openRefundModal = (ms: Membership) => { refundMembership.value = ms; refundModal?.show() }
const closeRefundModal = () => { refundModal?.hide(); refundMembership.value = null }
const processRefund = async () => {
  if (!refundMembership.value || refundForm.value.amount <= 0) return showToast('Enter valid amount.', false)
  try {
    await api.post(`/memberships/${refundMembership.value.id}/refund`, refundForm.value)
    showToast('Refund processed!')
    closeRefundModal(); await loadMembers()
  } catch { showToast('Refund failed.', false) }
}

// Delete
const isConfirmOpen = ref(false)
let resolveConfirm: (v: boolean) => void = () => { }
const showConfirm = (): Promise<boolean> => new Promise(resolve => {
  isConfirmOpen.value = true
  resolveConfirm = v => { isConfirmOpen.value = false; resolve(v) }
})
const confirmDelete = async (m: Member) => {
  if (await showConfirm()) {
    try {
      await api.delete(`/members/${m.id}`)
      showToast('Member deleted!')
      await loadMembers()
    } catch { showToast('Delete failed.', false) }
  }
}

// UI
const toggleExpand = (id: number) => { expandedMemberId.value = expandedMemberId.value === id ? null : id }

// Lifecycle
onMounted(async () => {
  if (toastRef.value) toastInstance = new Toast(toastRef.value)
  if (memberModalRef.value) memberModal = new Modal(memberModalRef.value)
  if (membershipModalRef.value) membershipModal = new Modal(membershipModalRef.value)
  if (refundModalRef.value) refundModal = new Modal(refundModalRef.value)
  await Promise.all([loadMembers(), loadPlans()])
  isLoading.value = false
})
</script>

<style scoped>
.members-container {
  padding: 1.5rem;
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
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

.search-input-wrapper .input-group {
  width: 300px;
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

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}

.status-danger {
  background: #fee2e2;
  color: #991b1b;
}

.status-dark {
  background: #e5e7eb;
  color: #1f2937;
}

.status-secondary {
  background: #e5e7eb;
  color: #4b5563;
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

.input-group-text {
  background: #f8f9fa;
  border-right: 0;
  color: #6c757d;
}

.form-control {
  border-left: 0;
}

.form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(67, 97, 238, 0.25);
  border-color: #4361ee;
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
</style>