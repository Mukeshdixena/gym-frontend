<template>
    <div class="container mt-4">
        <h3 class="mb-4">Special Programs</h3>

        <!-- Toast -->
        <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
            <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">{{ toastMessage }}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="row g-3 mb-3">
            <div class="col-md-3">
                <label class="form-label"><strong>Search</strong></label>
                <input v-model.trim="filters.search" @input="resetPageAndLoad" type="text"
                    class="form-control form-control-sm" placeholder="Name or description" />
            </div>
            <div class="col-md-2">
                <label class="form-label"><strong>Status</strong></label>
                <select v-model="filters.isActive" @change="resetPageAndLoad" class="form-select form-select-sm">
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label"><strong>Min Price</strong></label>
                <input v-model.number="filters.minPrice" @change="resetPageAndLoad" type="number"
                    class="form-control form-control-sm" placeholder="Min ₹" />
            </div>
            <div class="col-md-2">
                <label class="form-label"><strong>Max Price</strong></label>
                <input v-model.number="filters.maxPrice" @change="resetPageAndLoad" type="number"
                    class="form-control form-control-sm" placeholder="Max ₹" />
            </div>
            <div class="col-md-3 d-flex align-items-end">
                <button class="btn btn-primary btn-sm w-100" @click="openAddModal">New Special Program</button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="text-center my-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading special programs...</p>
        </div>

        <!-- Table -->
        <div v-else class="card shadow-sm">
            <div class="card-header bg-primary text-white fw-bold">All Special Programs</div>
            <div class="card-body table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(addon, i) in addons" :key="addon.id">
                            <td>{{ addon.id }}</td>
                            <td>{{ addon.name }}</td>
                            <td>{{ addon.description }}</td>
                            <td>₹{{ addon.price }}</td>
                            <td>{{ addon.durationDays }} days</td>
                            <td>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" :id="'switch-' + addon.id"
                                        :checked="addon.isActive" @change="toggleAddonStatus(addon.id, $event)"
                                        :disabled="isToggling" />
                                    <label class="form-check-label" :for="'switch-' + addon.id"
                                        :class="{ 'text-success': addon.isActive, 'text-muted': !addon.isActive }">
                                        {{ addon.isActive ? 'Active' : 'Inactive' }}
                                    </label>
                                </div>
                            </td>
                            <td class="text-center" @click.stop>
                                <div class="dropdown" @click.stop="toggleDropdown(addon.id)">
                                    <button class="btn btn-light btn-sm border-0">...</button>
                                    <div v-if="openDropdownId === addon.id" class="dropdown-menu-custom shadow-sm">
                                        <a href="javascript:void(0)" @click="editAddon(addon)"
                                            class="dropdown-item-custom">Edit</a>
                                        <a href="javascript:void(0)" @click="confirmDelete(addon.id)"
                                            class="dropdown-item-custom text-danger">Delete</a>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="addons.length === 0">
                            <td colspan="7" class="text-center text-muted py-4">No special programs found</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="card-footer d-flex justify-content-between align-items-center">
                <div>
                    Showing {{ (meta.page - 1) * meta.limit + 1 }} to {{ Math.min(meta.page * meta.limit, meta.total) }}
                    of {{ meta.total }} special programs
                </div>
                <nav>
                    <ul class="pagination pagination-sm mb-0">
                        <li class="page-item" :class="{ disabled: meta.page <= 1 }">
                            <a class="page-link" @click="goToPage(meta.page - 1)" href="javascript:void(0)">Prev</a>
                        </li>
                        <li class="page-item" v-for="p in visiblePages" :key="p" :class="{ active: p === meta.page }">
                            <a class="page-link" @click="typeof p === 'number' && goToPage(p)"
                                href="javascript:void(0)">{{ p }}</a>
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
                        <h5 class="modal-title">{{ editingAddon ? 'Edit Special Program' : 'Add Special Program' }}</h5>
                        <button type="button" class="btn-close" @click="closeModal"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Special Program Name</strong></label>
                                    <input v-model.trim="form.name" type="text" class="form-control"
                                        :class="{ 'is-invalid': errors.name }" @blur="validateField('name')" required />
                                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Description</strong></label>
                                    <textarea v-model.trim="form.description" class="form-control" rows="2"
                                        :class="{ 'is-invalid': errors.description }"
                                        @blur="validateField('description')" required></textarea>
                                    <div v-if="errors.description" class="invalid-feedback">{{ errors.description }}
                                    </div>
                                </div>
                            </div>

                            <div class="row g-3 mt-2">
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Price (₹)</strong></label>
                                    <input v-if="!editingAddon" v-model.number="form.price" type="number"
                                        class="form-control" :class="{ 'is-invalid': errors.price }"
                                        @blur="validateField('price')" min="1" required />
                                    <div v-else class="form-control-plaintext">₹{{ form.price }}</div>
                                    <div v-if="errors.price" class="invalid-feedback">{{ errors.price }}</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label"><strong>Duration (Days)</strong></label>
                                    <input v-if="!editingAddon" v-model.number="form.durationDays" type="number"
                                        class="form-control" :class="{ 'is-invalid': errors.durationDays }"
                                        @blur="validateField('durationDays')" min="1" required />
                                    <div v-else class="form-control-plaintext">{{ form.durationDays }} days</div>
                                    <div v-if="errors.durationDays" class="invalid-feedback">{{ errors.durationDays }}
                                    </div>
                                </div>
                            </div>

                            <div class="mt-3">
                                <label class="form-label"><strong>Status</strong></label>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="activeSwitch"
                                        v-model="form.isActive" />
                                    <label class="form-check-label" for="activeSwitch">
                                        {{ form.isActive ? 'Active' : 'Inactive' }}
                                    </label>
                                </div>
                            </div>

                            <div class="d-grid gap-2 mt-4">
                                <button type="button" class="btn btn-primary" @click="saveAddon"
                                    :disabled="!isFormValid || isUnchanged">
                                    {{ editingAddon ? 'Update Special Program' : 'Add Special Program' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Confirm Delete -->
        <div class="modal fade" :class="{ show: isConfirmOpen }" tabindex="-1" style="display: block;"
            v-if="isConfirmOpen" @click.self="resolveConfirm(false)">
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-2">
                        <h5 class="modal-title fs-6">Confirm Delete</h5>
                        <button type="button" class="btn-close" @click="resolveConfirm(false)"></button>
                    </div>
                    <div class="modal-body pt-2 pb-3">
                        Are you sure you want to delete this special program?<br>
                        <small class="text-muted">This action cannot be undone.</small>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-secondary btn-sm"
                            @click="resolveConfirm(false)">Cancel</button>
                        <button type="button" class="btn btn-danger btn-sm"
                            @click="resolveConfirm(true)">Delete</button>
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

// ──────── Types ────────
interface Addon {
    id: number;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    isActive: boolean;
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ──────── State ────────
const addons = ref<Addon[]>([]);
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
const isLoading = ref(true);
const isToggling = ref(false);

const modalRef = ref<HTMLElement | null>(null);
const toastRef = ref<HTMLElement | null>(null);
let modal: Modal;
let toastInstance: Toast;

const editingAddon = ref<Addon | null>(null);
const openDropdownId = ref<number | null>(null);

const form = ref<Partial<Addon>>({
    name: '',
    description: '',
    price: 0,
    durationDays: 0,
    isActive: true,
});
const originalForm = ref<Partial<Addon>>({});
const errors = ref<Record<string, string>>({});
const toastMessage = ref('');

// Filters + Pagination
const filters = ref({
    search: '',
    isActive: '',
    minPrice: null as number | null,
    maxPrice: null as number | null,
    sortBy: 'createdAt',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
});
const pagination = ref({ page: 1, limit: 10 });

// ──────── Computed ────────
const isFormValid = computed(() => {
    ['name', 'description', 'price', 'durationDays'].forEach(validateField);
    return (
        !!form.value.name &&
        !!form.value.description &&
        (form.value.price ?? 0) > 0 &&
        (form.value.durationDays ?? 0) > 0 &&
        !Object.values(errors.value).some(e => e)
    );
});

const isUnchanged = computed(() => JSON.stringify(form.value) === JSON.stringify(originalForm.value));

const visiblePages = computed(() => {
    const delta = 2;
    const range = [];
    for (
        let i = Math.max(2, meta.value.page - delta);
        i <= Math.min(meta.value.totalPages - 1, meta.value.page + delta);
        i++
    ) range.push(i);
    if (meta.value.page - delta > 2) range.unshift('...');
    if (meta.value.page + delta < meta.value.totalPages - 1) range.push('...');
    range.unshift(1);
    if (meta.value.totalPages > 1) range.push(meta.value.totalPages);
    return range;
});

// ──────── Validation ────────
const validateField = (field: string) => {
    const v = form.value[field as keyof Addon];
    switch (field) {
        case 'name':
            errors.value.name = v ? '' : 'Addon name is required.';
            break;
        case 'description':
            errors.value.description = v ? '' : 'Description is required.';
            break;
        case 'price':
            errors.value.price = !v || Number(v) <= 0 ? 'Enter a valid positive price.' : '';
            break;
        case 'durationDays':
            errors.value.durationDays = !v || Number(v) <= 0 ? 'Enter a valid duration (days).' : '';
            break;
    }
};

// ──────── Toast ────────
const showToast = (msg: string, success = true) => {
    toastMessage.value = msg;
    if (toastRef.value) {
        toastRef.value.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0`;
        toastInstance?.show();
    }
    setTimeout(() => { if (toastMessage.value === msg) hideToast(); }, 4000);
};
const hideToast = () => toastInstance?.hide();

// ──────── API ────────
const buildQuery = () => ({
    ...filters.value,
    ...pagination.value,
    minPrice: filters.value.minPrice ?? undefined,
    maxPrice: filters.value.maxPrice ?? undefined,
});

const loadAddons = async () => {
    isLoading.value = true;
    try {
        const res = await api.get('/addons', { params: buildQuery() }) as AxiosResponse<{
            data: Addon[];
            meta: PaginationMeta;
        }>;
        addons.value = res.data.data;
        meta.value = res.data.meta;
    } catch (err: any) {
        console.error(err);
        showToast('Failed to load addons.', false);
    } finally {
        isLoading.value = false;
    }
};

const resetPageAndLoad = () => {
    pagination.value.page = 1;
    loadAddons();
};

// ──────── Pagination ────────
const goToPage = (page: number) => {
    if (page < 1 || page > meta.value.totalPages || page === meta.value.page) return;
    pagination.value.page = page;
    loadAddons();
};

// ──────── CRUD ────────
const openAddModal = () => {
    editingAddon.value = null;
    form.value = { name: '', description: '', price: 0, durationDays: 0, isActive: true };
    originalForm.value = { ...form.value };
    errors.value = {};
    modal?.show();
};

const editAddon = (addon: Addon) => {
    editingAddon.value = addon;
    form.value = { ...addon };
    originalForm.value = { ...addon };
    errors.value = {};
    modal?.show();
};

const closeModal = () => {
    modal?.hide();
    editingAddon.value = null;
    form.value = {};
    originalForm.value = {};
    errors.value = {};
};

const saveAddon = async () => {
    if (!isFormValid.value) return showToast('Please fill all required fields correctly.', false);

    const payload: any = {
        name: form.value.name!.trim(),
        description: form.value.description!.trim(),
        isActive: form.value.isActive ?? true,
    };
    if (!editingAddon.value) {
        payload.price = form.value.price!;
        payload.durationDays = form.value.durationDays!;
    }

    try {
        if (editingAddon.value) {
            await api.patch(`/addons/${editingAddon.value.id}`, payload);
            showToast('Addon updated successfully!');
        } else {
            const res = await api.post('/addons', payload);
            addons.value.unshift(res.data.data);
            showToast('Addon added successfully!');
        }
        await loadAddons();
        closeModal();
    } catch (err: any) {
        showToast(err?.response?.data?.message || 'Failed to save addon.', false);
    }
};

const toggleAddonStatus = async (id: number, event: Event) => {
    const checked = (event.target as HTMLInputElement).checked;
    isToggling.value = true;
    try {
        await api.patch(`/addons/${id}`, { isActive: checked });
        const addon = addons.value.find(a => a.id === id);
        if (addon) addon.isActive = checked;
        showToast(`Addon marked as ${checked ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
        showToast('Failed to update status.', false);
        (event.target as HTMLInputElement).checked = !checked;
    } finally {
        isToggling.value = false;
    }
};

// ──────── Delete ────────
const isConfirmOpen = ref(false);
let resolveConfirm: (v: boolean) => void = () => { };

const showConfirm = (): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
        isConfirmOpen.value = true;
        resolveConfirm = v => {
            isConfirmOpen.value = false;
            resolve(v);
        };
    });
};

const confirmDelete = async (id: number) => {
    const ok = await showConfirm();
    if (!ok) return;
    try {
        await api.delete(`/addons/${id}`);
        addons.value = addons.value.filter(a => a.id !== id);
        showToast('Addon deleted successfully!');
        // reload if current page becomes empty
        if (addons.value.length === 0 && meta.value.page > 1) goToPage(meta.value.page - 1);
    } catch (err: any) {
        showToast(err?.response?.data?.message || 'Failed to delete addon.', false);
    }
};

// ──────── Dropdown ────────
const toggleDropdown = (id: number) => {
    openDropdownId.value = openDropdownId.value === id ? null : id;
};
const handleClickOutside = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.dropdown')) openDropdownId.value = null;
};

// ──────── Lifecycle ────────
onMounted(async () => {
    if (modalRef.value) modal = new Modal(modalRef.value);
    if (toastRef.value) toastInstance = new Toast(toastRef.value);
    document.addEventListener('click', handleClickOutside);
    await loadAddons();
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.table td,
.table th {
    vertical-align: middle;
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

.modal-sm .modal-content {
    border-radius: .5rem;
}

input[readonly],
.form-control-plaintext {
    background-color: #f8f9fa !important;
}

.form-switch .form-check-input {
    cursor: pointer;
}

.card-body {
    overflow: visible !important;
}
</style>