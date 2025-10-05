<template>
    <div class="container-fluid">
        <h2 class="mb-4">Trainers</h2>

        <!-- Search & Add -->
        <div class="d-flex justify-content-between mb-3">
            <input
                type="text"
                class="form-control w-25"
                placeholder="Search by name or email"
                v-model="searchTerm"
            />
            <button class="btn btn-primary" @click="openAddModal">Add Trainer</button>
        </div>

        <!-- Trainers Table -->
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Speciality</th>
                    <th>Classes</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="trainer in filteredTrainers" :key="trainer.id">
                    <td>{{ trainer.firstName }} {{ trainer.lastName }}</td>
                    <td>{{ trainer.email }}</td>
                    <td>{{ trainer.phone }}</td>
                    <td>{{ trainer.speciality }}</td>
                    <td>{{ trainer.classes?.length || 0 }}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-2" @click="editTrainer(trainer)">Edit</button>
                        <button class="btn btn-sm btn-danger" @click="deleteTrainer(trainer.id)">Delete</button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Add/Edit Modal -->
        <div class="modal fade" id="trainerModal" tabindex="-1" aria-hidden="true" ref="modalRef">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ editingTrainer ? 'Edit Trainer' : 'Add Trainer' }}</h5>
                        <button type="button" class="btn-close" @click="closeModal"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="saveTrainer">
                            <div class="mb-3">
                                <label class="form-label">First Name</label>
                                <input v-model="form.firstName" type="text" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Last Name</label>
                                <input v-model="form.lastName" type="text" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input v-model="form.email" type="email" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phone</label>
                                <input v-model="form.phone" type="text" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Speciality</label>
                                <input v-model="form.speciality" type="text" class="form-control" />
                            </div>
                            <button class="btn btn-primary" type="submit">
                                {{ editingTrainer ? 'Update' : 'Add' }}
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
import { Modal } from "bootstrap";
import axios from "axios";

interface GymClass {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
}

interface Trainer {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    speciality: string;
    classes?: GymClass[];
}

// ✅ Backend API base URL
const API_URL = "http://localhost:3000/trainers"; // Update if needed

const trainers = ref<Trainer[]>([]);
const searchTerm = ref("");

// Computed: filter trainers by name or email
const filteredTrainers = computed(() =>
    trainers.value.filter(
        (t) =>
            `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            t.email.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
);

// Modal management
const modalRef = ref<HTMLElement | null>(null);
let editingTrainer: Trainer | null = null;

const form = ref<Trainer>({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    speciality: "",
    classes: [],
});

// 🟢 Load trainers on mount
onMounted(async () => {
    await fetchTrainers();
});

// ========== API FUNCTIONS ==========

// GET all trainers
async function fetchTrainers() {
    try {
        const res = await axios.get(API_URL);
        trainers.value = res.data;
    } catch (err) {
        console.error("Error fetching trainers:", err);
        alert("Failed to load trainers.");
    }
}

// POST new trainer
async function createTrainer() {
    try {
        const res = await axios.post(API_URL, {
            firstName: form.value.firstName,
            lastName: form.value.lastName,
            email: form.value.email,
            phone: form.value.phone,
            speciality: form.value.speciality,
        });
        trainers.value.push(res.data);
    } catch (err) {
        console.error("Error creating trainer:", err);
        alert("Failed to create trainer.");
    }
}

// PUT update trainer
async function updateTrainer(id: number) {
    try {
        const res = await axios.put(`${API_URL}/${id}`, {
            firstName: form.value.firstName,
            lastName: form.value.lastName,
            email: form.value.email,
            phone: form.value.phone,
            speciality: form.value.speciality,
        });
        const index = trainers.value.findIndex((t) => t.id === id);
        if (index !== -1) trainers.value[index] = res.data;
    } catch (err) {
        console.error("Error updating trainer:", err);
        alert("Failed to update trainer.");
    }
}

// DELETE trainer
async function deleteTrainer(id: number) {
    if (!confirm("Are you sure you want to delete this trainer?")) return;
    try {
        await axios.delete(`${API_URL}/${id}`);
        trainers.value = trainers.value.filter((t) => t.id !== id);
    } catch (err) {
        console.error("Error deleting trainer:", err);
        alert("Failed to delete trainer.");
    }
}

// ========== MODAL FUNCTIONS ==========

function openAddModal() {
    editingTrainer = null;
    form.value = { id: 0, firstName: "", lastName: "", email: "", phone: "", speciality: "", classes: [] };
    if (modalRef.value) new Modal(modalRef.value).show();
}

function closeModal() {
    if (modalRef.value) Modal.getInstance(modalRef.value)?.hide();
}

function editTrainer(trainer: Trainer) {
    editingTrainer = trainer;
    form.value = { ...trainer };
    if (modalRef.value) new Modal(modalRef.value).show();
}

async function saveTrainer() {
    if (editingTrainer) {
        await updateTrainer(editingTrainer.id);
    } else {
        await createTrainer();
    }
    closeModal();
}
</script>
