<template>
    <div class="container-fluid">
        <h2 class="mb-4">Trainers</h2>

        <!-- Search & Add -->
        <div class="d-flex justify-content-between mb-3">
            <input type="text" class="form-control w-25" placeholder="Search by name or email" v-model="searchTerm" />
            <button class="btn btn-primary" @click="openAddModal">Add Trainer</button>
        </div>

        <!-- Trainers Table -->
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Specialty</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="trainer in filteredTrainers" :key="trainer.id">
                    <td>{{ trainer.name }}</td>
                    <td>{{ trainer.email }}</td>
                    <td>{{ trainer.phone }}</td>
                    <td>{{ trainer.specialty }}</td>
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
                                <label class="form-label">Name</label>
                                <input v-model="form.name" type="text" class="form-control" required />
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
                                <label class="form-label">Specialty</label>
                                <input v-model="form.specialty" type="text" class="form-control" />
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
import { ref, computed } from "vue";
import { Modal } from "bootstrap";

interface Trainer {
    id: number;
    name: string;
    email: string;
    phone: string;
    specialty: string;
}

const trainers = ref<Trainer[]>([
    { id: 1, name: "Mike Johnson", email: "mike@example.com", phone: "9876543210", specialty: "Yoga" },
    { id: 2, name: "Sara Lee", email: "sara@example.com", phone: "9876543211", specialty: "Weightlifting" },
]);

const searchTerm = ref("");

const filteredTrainers = computed(() => {
    return trainers.value.filter(
        (t) =>
            t.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            t.email.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
});

// Modal handling
const modalRef = ref<HTMLElement | null>(null);
let editingTrainer: Trainer | null = null;

const form = ref<Trainer>({
    id: 0,
    name: "",
    email: "",
    phone: "",
    specialty: "",
});

function openAddModal() {
    editingTrainer = null;
    form.value = { id: 0, name: "", email: "", phone: "", specialty: "" };
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

function saveTrainer() {
    if (editingTrainer) {
        Object.assign(editingTrainer, form.value);
    } else {
        const newId = trainers.value.length ? Math.max(...trainers.value.map((t) => t.id)) + 1 : 1;
        trainers.value.push({ ...form.value, id: newId });
    }
    closeModal();
}

function deleteTrainer(id: number) {
    if (confirm("Are you sure to delete this trainer?")) {
        trainers.value = trainers.value.filter((t) => t.id !== id);
    }
}
</script>
