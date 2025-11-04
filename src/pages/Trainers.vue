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

    <!-- Search & Add -->
    <div class="row g-3 mb-3">
      <div class="col-md-5">
        <input v-model.trim="filters.search" @input="resetPageAndLoad" type="text" class="form-control form-control-sm"
          placeholder="Search by name or email" />
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

    <!-- Table + Pagination -->
    <div v-else class="card shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">All Trainers</div>
      <div class="card-body table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Speciality</th>
              <th>Classes</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(trainer, i) in trainers" :key="trainer.id">
              <td>{{ (meta.page - 1) * meta.limit + i + 1 }}</td>
              <td>{{ trainer.firstName }} {{ trainer.lastName }}</td>
              <td>{{ trainer.email }}</td>
              <td>{{ trainer.phone }}</td>
              <td>
                <span class="badge bg-info text-dark" v-if="trainer.speciality">
                  {{ trainer.speciality }}
                </span>
                <span class="text-muted" v-else>—</span>
              </td>
              <td>{{ trainer.classes?.length ?? 0 }}</td>
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
              <td colspan="7" class="text-center text-muted py-4">No trainers found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="card-footer d-flex justify-content-between align-items-center">
        <div>
          Showing {{ (meta.page - 1) * meta.limit + 1 }} to {{ Math.min(meta.page * meta.limit, meta.total) }}
          of {{ meta.total }} trainers
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: meta.page <= 1 }">
              <a class="page-link" @click="goToPage(meta.page - 1)" href="javascript:void(0)">Prev</a>
            </li>
            <li v-for="p in visiblePages" :key="p" :class="[{ active: p === meta.page }, { disabled: p === '...' }]">
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
                  <input v-model.trim="form.firstName" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.firstName }" @blur="validateField('firstName')" required />
                  <div v-if="errors.firstName" class="invalid-feedback">{{ errors.firstName }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Last Name</strong></label>
                  <input v-model.trim="form.lastName" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.lastName }" @blur="validateField('lastName')" required />
                  <div v-if="errors.lastName" class="invalid-feedback">{{ errors.lastName }}</div>
                </div>
              </div>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <label class="form-label"><strong>Email</strong></label>
                  <input v-model.trim="form.email" type="email" class="form-control"
                    :class="{ 'is-invalid': errors.email }" @blur="validateField('email')" required />
                  <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label"><strong>Phone</strong></label>
                  <input v-model.trim="form.phone" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.phone }" @blur="validateField('phone')" required />
                  <div v-if="errors.phone" class="invalid-feedback">{{ errors.phone }}</div>
                </div>
              </div>

              <div class="mt-3">
                <label class="form-label">Speciality (Optional)</label>
                <input v-model.trim="form.speciality" type="text" class="form-control"
                  placeholder="e.g., Yoga, Zumba, Strength Training" />
              </div>

              <div class="d-grid gap-2 mt-4">
                <button type="button" class="btn btn-primary" @click="saveTrainer"
                  :disabled="!isFormValid || isSubmitting">
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

interface GymClass { id: number; name: string; startTime: string; endTime: string; }
interface Trainer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  speciality?: string;
  classes?: GymClass[];
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// State
const trainers = ref<Trainer[]>([]);
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
const isLoading = ref(true);
const isSubmitting = ref(false);

const modalRef = ref<HTMLElement | null>(null);
const toastRef = ref<HTMLElement | null>(null);
let modal: Modal;
let toastInstance: Toast;

const editingTrainer = ref<Trainer | null>(null);
const trainerToDelete = ref<Trainer | null>(null);
const openDropdownId = ref<number | null>(null);

const form = ref<Partial<Trainer>>({ firstName: '', lastName: '', email: '', phone: '', speciality: '' });
const errors = ref<Record<string, string>>({});
const toastMessage = ref('');

// Filters + Pagination
const filters = ref({ search: '' });
const pagination = ref({ page: 1, limit: 10 });

// Computed
const isFormValid = computed(() => {
  ['firstName', 'lastName', 'email', 'phone'].forEach(validateField);
  return (
    !!form.value.firstName?.trim() &&
    !!form.value.lastName?.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email || '') &&
    /^[0-9]{10}$/.test(form.value.phone || '') &&
    !Object.values(errors.value).some(e => e)
  );
});

const visiblePages = computed(() => {
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, meta.value.page - delta); i <= Math.min(meta.value.totalPages - 1, meta.value.page + delta); i++) {
    range.push(i);
  }
  if (meta.value.page - delta > 2) range.unshift('...');
  if (meta.value.page + delta < meta.value.totalPages - 1) range.push('...');
  range.unshift(1);
  if (meta.value.totalPages > 1) range.push(meta.value.totalPages);
  return range;
});

// Validation
const validateField = (field: string) => {
  const v = form.value[field as keyof Trainer];
  switch (field) {
    case 'firstName':
      errors.value.firstName = v ? '' : 'First name is required.';
      break;
    case 'lastName':
      errors.value.lastName = v ? '' : 'Last name is required.';
      break;
    case 'email':
      if (!v) errors.value.email = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) errors.value.email = 'Enter a valid email.';
      else errors.value.email = '';
      break;
    case 'phone':
      if (!v) errors.value.phone = 'Phone number is required.';
      else if (!/^[0-9]{10}$/.test(String(v))) errors.value.phone = 'Enter a valid 10-digit phone number.';
      else errors.value.phone = '';
      break;
  }
};

// Toast
const showToast = (msg: string, success = true) => {
  toastMessage.value = msg;
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`;
    toastInstance?.show();
  }
  setTimeout(() => { if (toastMessage.value === msg) hideToast(); }, 4000);
};
const hideToast = () => toastInstance?.hide();

// API
const buildQuery = () => ({
  ...filters.value,
  ...pagination.value,
});

const loadTrainers = async () => {
  isLoading.value = true;
  try {
    const res = await api.get('/trainers', { params: buildQuery() }) as AxiosResponse<{
      data: Trainer[];
      meta: PaginationMeta;
    }>;
    trainers.value = res.data.data;
    meta.value = res.data.meta;
  } catch (err: any) {
    console.error(err);
    showToast('Failed to load trainers.', false);
  } finally {
    isLoading.value = false;
  }
};

const resetPageAndLoad = () => {
  pagination.value.page = 1;
  loadTrainers();
};

const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return;
  pagination.value.page = page;
  loadTrainers();
};

// CRUD
const openAddModal = () => {
  editingTrainer.value = null;
  form.value = { firstName: '', lastName: '', email: '', phone: '', speciality: '' };
  errors.value = {};
  modal?.show();
};

const editTrainer = (trainer: Trainer) => {
  editingTrainer.value = trainer;
  form.value = { ...trainer };
  errors.value = {};
  modal?.show();
};

const closeModal = () => {
  modal?.hide();
  editingTrainer.value = null;
  form.value = {};
  errors.value = {};
};

const saveTrainer = async () => {
  if (!isFormValid.value) return showToast('Please fill all required fields correctly.', false);
  isSubmitting.value = true;

  const payload = {
    firstName: form.value.firstName!.trim(),
    lastName: form.value.lastName!.trim(),
    email: form.value.email!.trim(),
    phone: form.value.phone!.trim(),
    speciality: form.value.speciality?.trim() || null,
  };

  try {
    if (editingTrainer.value) {
      const res = await api.put(`/trainers/${editingTrainer.value.id}`, payload);
      const idx = trainers.value.findIndex(t => t.id === editingTrainer.value!.id);
      if (idx !== -1) trainers.value[idx] = res.data;
      showToast('Trainer updated successfully!');
    } else {
      const res = await api.post('/trainers', payload);
      trainers.value.unshift(res.data);
      showToast('Trainer added successfully!');
    }
    closeModal();
    await loadTrainers();
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Save failed.', false);
  } finally {
    isSubmitting.value = false;
  }
};

// Delete
const isConfirmOpen = ref(false);
let resolveConfirm: (v: boolean) => void = () => { };

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
    if (trainers.value.length === 0 && meta.value.page > 1) goToPage(meta.value.page - 1);
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to delete trainer.', false);
  }
};

// Dropdown
const toggleDropdown = (id: number) => {
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
/* Same as before */
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