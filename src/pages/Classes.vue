<template>
    <div class="container-fluid mt-4">
        <h3 class="mb-4">Classes Management</h3>

        <!-- ✅ Toast Container -->
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
        <div class="d-flex justify-content-between mb-3">
            <input type="text" class="form-control w-25" placeholder="Search by class name or trainer"
                v-model="searchTerm" />
            <button class="btn btn-primary" @click="openAddModal">Add Class</button>
        </div>

        <!-- Classes Table -->
        <div class="card shadow-sm">
            <div class="card-body table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th>Class Name</th>
                            <th>Trainer</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="cls in filteredClasses" :key="cls.id">
                            <td>{{ cls.name }}</td>
                            <td>{{ cls.trainer?.firstName }} {{ cls.trainer?.lastName }}</td>
                            <td>{{ formatDate(cls.startTime) }}</td>
                            <td>{{ formatDate(cls.endTime) }}</td>
                            <td>
                                <button class="btn btn-sm btn-info me-2" @click="editClass(cls)">Edit</button>
                                <button class="btn btn-sm btn-danger" @click="deleteClass(cls.id)">Delete</button>
                            </td>
                        </tr>
                        <tr v-if="filteredClasses.length === 0">
                            <td colspan="5" class="text-center text-muted">No classes found</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add/Edit Modal -->
        <div class="modal fade" id="classModal" tabindex="-1" aria-hidden="true" ref="modalRef">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ editingClass ? 'Edit Class' : 'Add Class' }}</h5>
                        <button type="button" class="btn-close" @click="closeModal"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="saveClass">
                            <div class="mb-3">
                                <label class="form-label">Class Name</label>
                                <input v-model="form.name" type="text" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Trainer</label>
                                <select v-model="form.trainerId" class="form-select" required>
                                    <option value="">Select Trainer</option>
                                    <option v-for="t in trainers" :key="t.id" :value="t.id">
                                        {{ t.firstName }} {{ t.lastName }}
                                    </option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Start Time</label>
                                <input v-model="form.startTime" type="datetime-local" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">End Time</label>
                                <input v-model="form.endTime" type="datetime-local" class="form-control" required />
                            </div>
                            <button class="btn btn-primary w-100" type="submit">
                                {{ editingClass ? 'Update' : 'Add' }}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { Modal, Toast } from "bootstrap";
import { API_BASE_URL } from "@/config"; // ✅ Base URL from config

interface Trainer {
    id: number;
    firstName: string;
    lastName: string;
}

interface GymClass {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    trainerId: number;
    trainer?: Trainer;
}

// ✅ API endpoints
const CLASSES_API = `${API_BASE_URL}/classes`;
const TRAINERS_API = `${API_BASE_URL}/trainers`;

const classes = ref<GymClass[]>([]);
const trainers = ref<Trainer[]>([]);
const searchTerm = ref("");

// Toast setup
const toastRef = ref<HTMLElement | null>(null);
let toastInstance: Toast;
const toastMessage = ref("");

function showToast(message: string, isSuccess = true) {
    toastMessage.value = message;
    if (toastRef.value) {
        toastRef.value.className = `toast align-items-center text-white ${isSuccess ? "bg-success" : "bg-danger"
            } border-0`;
        toastInstance.show();
    }
}
function hideToast() {
    toastInstance.hide();
}

// Computed: filter by class or trainer
const filteredClasses = computed(() =>
    classes.value.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            `${c.trainer?.firstName ?? ""} ${c.trainer?.lastName ?? ""}`
                .toLowerCase()
                .includes(searchTerm.value.toLowerCase())
    )
);

// Modal
const modalRef = ref<HTMLElement | null>(null);
let modal: Modal;
let editingClass: GymClass | null = null;

const form = ref({
    id: 0,
    name: "",
    startTime: "",
    endTime: "",
    trainerId: 0,
});

// On mounted
onMounted(async () => {
    if (modalRef.value) modal = new Modal(modalRef.value);
    if (toastRef.value) toastInstance = new Toast(toastRef.value);
    await Promise.all([fetchTrainers(), fetchClasses()]);
});

// =================== API FUNCTIONS ===================

// GET classes
async function fetchClasses() {
    try {
        const res = await axios.get(CLASSES_API);
        classes.value = res.data;
    } catch (err) {
        console.error(err);
        showToast("Failed to load classes.", false);
    }
}

// GET trainers
async function fetchTrainers() {
    try {
        const res = await axios.get(TRAINERS_API);
        trainers.value = res.data;
    } catch (err) {
        console.error(err);
        showToast("Failed to load trainers.", false);
    }
}

// POST new class
async function createClass() {
    try {
        await axios.post(CLASSES_API, {
            name: form.value.name,
            trainer: { connect: { id: form.value.trainerId } },
            startTime: new Date(form.value.startTime).toISOString(),
            endTime: new Date(form.value.endTime).toISOString(),
        });
        await fetchClasses();
        showToast("Class added successfully!");
    } catch (err) {
        console.error(err);
        showToast("Error creating class.", false);
    }
}

// PUT update class
async function updateClass(id: number) {
    try {
        await axios.put(`${CLASSES_API}/${id}`, {
            name: form.value.name,
            trainer: { connect: { id: form.value.trainerId } },
            startTime: new Date(form.value.startTime).toISOString(),
            endTime: new Date(form.value.endTime).toISOString(),
        });
        await fetchClasses();
        showToast("Class updated successfully!");
    } catch (err) {
        console.error(err);
        showToast("Error updating class.", false);
    }
}

// DELETE class
async function deleteClass(id: number) {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
        await axios.delete(`${CLASSES_API}/${id}`);
        await fetchClasses();
        showToast("Class deleted successfully!");
    } catch (err) {
        console.error(err);
        showToast("Error deleting class.", false);
    }
}

// =================== MODAL FUNCTIONS ===================

function openAddModal() {
    editingClass = null;
    form.value = { id: 0, name: "", startTime: "", endTime: "", trainerId: 0 };
    modal.show();
}

function closeModal() {
    modal.hide();
}

function editClass(cls: GymClass) {
    editingClass = cls;
    form.value = {
        id: cls.id,
        name: cls.name,
        startTime: cls.startTime.slice(0, 16),
        endTime: cls.endTime.slice(0, 16),
        trainerId: cls.trainerId,
    };
    modal.show();
}

async function saveClass() {
    if (editingClass) {
        await updateClass(editingClass.id);
    } else {
        await createClass();
    }
    closeModal();
}

// =================== UTILITIES ===================
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}
</script>

<style scoped>
.table td,
.table th {
    vertical-align: middle;
}
</style>
