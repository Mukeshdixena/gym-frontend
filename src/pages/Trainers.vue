<template>
  <div class="container mt-4">
    <h3 class="mb-4">Trainers Management</h3>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>

    <!-- Search + Add -->
    <div class="row g-3 mb-3">
      <div class="col-md-5">
        <input v-model.trim="filters.search" @input="resetPageAndLoad" type="text" class="form-control form-control-sm"
          placeholder="Search by name, email or speciality" />
      </div>
      <div class="col-md-7 text-end">
        <button class="btn btn-primary btn-sm" @click="openAddModal">Add Trainer</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2">Loading trainers...</p>
    </div>

    <!-- Table -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Trainers</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Speciality</th>
              <th>Salary (₹)</th>
              <th>Joining Date</th>
              <th>Programs</th>
              <th>Address</th>
              <th>Notes</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trainer in trainers" :key="trainer.id">
              <td>{{ trainer.id }}</td>
              <td>{{ trainer.firstName }} {{ trainer.lastName }}</td>
              <td>{{ trainer.email }}</td>
              <td>{{ trainer.phone }}</td>
              <td>
                <span v-if="trainer.speciality" class="badge bg-info text-dark">{{ trainer.speciality }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>{{ trainer.salary ? trainer.salary.toLocaleString() : '—' }}</td>
              <td>
                {{ trainer.joiningDate ? new Date(trainer.joiningDate).toLocaleDateString() : '—' }}
              </td>
              <td><span class="badge bg-secondary">{{ trainer.memberAddonsCount ?? 0 }}</span></td>
              <td>{{ trainer.address || '—' }}</td>
              <td>{{ trainer.notes || '—' }}</td>
              <td class="text-center" @click.stop>
                <div class="dropdown" @click.stop="toggleDropdown(trainer.id)">
                  <button class="btn btn-light btn-sm border-0">...</button>
                  <div v-if="openDropdownId === trainer.id" class="dropdown-menu-custom shadow-sm">
                    <a href="javascript:void(0)" @click="editTrainer(trainer)" class="dropdown-item-custom">Edit</a>
                    <a href="javascript:void(0)" @click="confirmDelete(trainer)"
                      class="dropdown-item-custom text-danger">Delete</a>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="trainers.length === 0">
              <td colspan="11" class="text-center text-muted py-4">No trainers found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="card-footer d-flex justify-content-between align-items-center">
        <div>
          Showing {{ (meta.page - 1) * meta.limit + 1 }} to
          {{ Math.min(meta.page * meta.limit, meta.total) }} of {{ meta.total }} trainers
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: meta.page <= 1 }">
              <a class="page-link" @click="goToPage(meta.page - 1)" href="javascript:void(0)">Prev</a>
            </li>
            <li v-for="p in visiblePages" :key="p"
              :class="{ active: typeof p === 'number' && p === meta.page, disabled: p === '...' }">
              <span v-if="p === '...'" class="page-link">...</span>
              <a v-else class="page-link" @click="goToPage(Number(p))" href="javascript:void(0)">{{ p }}</a>
            </li>
            <li class="page-item" :class="{ disabled: meta.page >= meta.totalPages }">
              <a class="page-link" @click="goToPage(meta.page + 1)" href="javascript:void(0)">Next</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" ref="modalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingTrainer ? 'Edit Trainer' : 'Add New Trainer' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label"><strong>First Name</strong></label>
                  <input v-model.trim="form.firstName" type="text" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Last Name</strong></label>
                  <input v-model.trim="form.lastName" type="text" class="form-control" required />
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label"><strong>Email</strong></label>
                  <input v-model.trim="form.email" type="email" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Phone</strong></label>
                  <input v-model.trim="form.phone" type="text" maxlength="10" class="form-control" required />
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label">Speciality</label>
                  <input v-model.trim="form.speciality" type="text" class="form-control"
                    placeholder="e.g., Yoga, Zumba" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Salary (₹)</label>
                  <input v-model.number="form.salary" type="number" class="form-control" placeholder="e.g., 35000" />
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label">Joining Date</label>
                  <input v-model="form.joiningDate" type="date" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Address</label>
                  <input v-model.trim="form.address" type="text" class="form-control" placeholder="Full address" />
                </div>
              </div>

              <div class="mt-3">
                <label class="form-label">Notes</label>
                <textarea v-model.trim="form.notes" class="form-control" rows="2"
                  placeholder="Trainer notes (optional)"></textarea>
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="saveTrainer" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="d-flex align-items-center justify-content-center">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    {{ editingTrainer ? 'Updating...' : 'Adding...' }}
                  </span>
                  <span v-else>
                    {{ editingTrainer ? 'Update Trainer' : 'Add Trainer' }}
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
            Delete <strong>{{ trainerToDelete?.firstName }} {{ trainerToDelete?.lastName }}</strong> permanently?
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Modal, Toast } from 'bootstrap';
import api from '@/api/axios';
import type { AxiosResponse } from 'axios';

interface Trainer {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string | null;
  salary?: number | null;
  speciality?: string | null;
  notes?: string | null;
  joiningDate?: string | null;
  memberAddonsCount?: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const trainers = ref<Trainer[]>([]);
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
const isLoading = ref(true);
const isSubmitting = ref(false);
const modalRef = ref<HTMLElement | null>(null);
const toastRef = ref<HTMLElement | null>(null);
let modal: Modal;
let toastInstance: Toast;
const toastMessage = ref('');
const openDropdownId = ref<number | null>(null);

const editingTrainer = ref<Trainer | null>(null);
const trainerToDelete = ref<Trainer | null>(null);
const isConfirmOpen = ref(false);
let resolveConfirm: (v: boolean) => void = () => { };

const filters = ref({ search: '' });
const pagination = ref({ page: 1, limit: 10 });

const form = ref<Trainer>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  salary: null,
  speciality: '',
  notes: '',
  joiningDate: '',
});

// Toast
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg;
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`;
    toastInstance?.show();
  }
  setTimeout(() => hideToast(), 4000);
};
const hideToast = () => toastInstance?.hide();

// API
const buildQuery = () => ({ ...filters.value, ...pagination.value });

const loadTrainers = async () => {
  isLoading.value = true;
  try {
    const res = await api.get('/trainers', { params: buildQuery() }) as AxiosResponse<{ data: Trainer[]; meta: PaginationMeta; }>;
    trainers.value = res.data.data;
    meta.value = res.data.meta;
  } catch (err) {
    showToast('Failed to load trainers.', false);
  } finally {
    isLoading.value = false;
  }
};

// CRUD
const openAddModal = () => {
  editingTrainer.value = null;
  form.value = { firstName: '', lastName: '', email: '', phone: '', address: '', salary: null, speciality: '', notes: '', joiningDate: '' };
  modal?.show();
};

const editTrainer = (trainer: Trainer) => {
  editingTrainer.value = trainer;
  form.value = { ...trainer };
  modal?.show();
};

const closeModal = () => {
  modal?.hide();
  editingTrainer.value = null;
};

const saveTrainer = async () => {
  isSubmitting.value = true;
  try {
    const payload = { ...form.value };
    if (editingTrainer.value) {
      const res = await api.put(`/trainers/${editingTrainer.value.id}`, payload);
      showToast('Trainer updated successfully!');
    } else {
      await api.post('/trainers', payload);
      showToast('Trainer added successfully!');
    }
    closeModal();
    await loadTrainers();
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to save trainer.', false);
  } finally {
    isSubmitting.value = false;
  }
};

// Delete
const showConfirm = (): Promise<boolean> => {
  return new Promise(resolve => {
    isConfirmOpen.value = true;
    resolveConfirm = v => {
      isConfirmOpen.value = false;
      resolve(v);
    };
  });
};

const confirmDelete = async (trainer: Trainer) => {
  trainerToDelete.value = trainer;
  const ok = await showConfirm();
  if (!ok) return;
  try {
    await api.delete(`/trainers/${trainer.id}`);
    trainers.value = trainers.value.filter(t => t.id !== trainer.id);
    showToast('Trainer deleted successfully!');
    if (trainers.value.length === 0 && meta.value.page > 1) pagination.value.page--;
    await loadTrainers();
  } catch (err) {
    showToast('Failed to delete trainer.', false);
  }
};

// Pagination
const resetPageAndLoad = () => {
  pagination.value.page = 1;
  loadTrainers();
};

const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return;
  pagination.value.page = page;
  loadTrainers();
};

const visiblePages = computed(() => {
  const delta = 2;
  const range: (number | string)[] = [];
  for (let i = Math.max(2, meta.value.page - delta); i <= Math.min(meta.value.totalPages - 1, meta.value.page + delta); i++) range.push(i);
  if (meta.value.page - delta > 2) range.unshift('...');
  if (meta.value.page + delta < meta.value.totalPages - 1) range.push('...');
  range.unshift(1);
  if (meta.value.totalPages > 1) range.push(meta.value.totalPages);
  return range;
});

// Dropdown
const toggleDropdown = (id: number | undefined) => {
  if (id === undefined) return;
  openDropdownId.value = openDropdownId.value === id ? null : id;
};
const handleClickOutside = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null;
};

// Lifecycle
onMounted(async () => {
  if (modalRef.value) modal = new Modal(modalRef.value);
  if (toastRef.value) toastInstance = new Toast(toastRef.value);
  document.addEventListener('click', handleClickOutside);
  await loadTrainers();
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
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

.table th,
.table td {
  vertical-align: middle;
}

.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.toast {
  min-width: 280px;
}

.modal-sm .modal-content {
  border-radius: .5rem;
}

.badge {
  font-size: .75rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.card-body {
  overflow: visible !important;
}
</style>
