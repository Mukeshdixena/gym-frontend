<template>
    <div class="container-fluid">
        <h2 class="mb-4">Classes</h2>

        <!-- Search & Add -->
        <div class="d-flex justify-content-between mb-3">
            <input type="text" class="form-control w-25" placeholder="Search by class name or trainer"
                v-model="searchTerm" />
            <button class="btn btn-primary" @click="openAddModal">Add Class</button>
        </div>

        <!-- Classes Table -->
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th>Class Name</th>
                    <th>Trainer</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="cls in filteredClasses" :key="cls.id">
                    <td>{{ cls.name }}</td>
                    <td>{{ cls.trainer }}</td>
                    <td>{{ cls.date }}</td>
                    <td>{{ cls.time }}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-2" @click="editClass(cls)">Edit</button>
                        <button class="btn btn-sm btn-danger" @click="deleteClass(cls.id)">Delete</button>
                    </td>
                </tr>
            </tbody>
        </table>

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
                                <input v-model="form.trainer" type="text" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Date</label>
                                <input v-model="form.date" type="date" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Time</label>
                                <input v-model="form.time" type="time" class="form-control" required />
                            </div>
                            <button class="btn btn-primary" type="submit">
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
import { ref, computed } from "vue";
import { Modal } from "bootstrap";

interface GymClass {
    id: number;
    name: string;
    trainer: string;
    date: string;
    time: string;
}

// Sample classes
const classes = ref<GymClass[]>([
    { id: 1, name: "Yoga", trainer: "Mike Johnson", date: "2025-09-29", time: "08:00" },
    { id: 2, name: "Weightlifting", trainer: "Sara Lee", date: "2025-09-29", time: "10:00" },
]);

const searchTerm = ref("");

const filteredClasses = computed(() =>
    classes.value.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            c.trainer.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
);

// Modal handling
const modalRef = ref<HTMLElement | null>(null);
let editingClass: GymClass | null = null;

const form = ref<GymClass>({
    id: 0,
    name: "",
    trainer: "",
    date: "",
    time: "",
});

function openAddModal() {
    editingClass = null;
    form.value = { id: 0, name: "", trainer: "", date: "", time: "" };
    if (modalRef.value) new Modal(modalRef.value).show();
}

function closeModal() {
    if (modalRef.value) Modal.getInstance(modalRef.value)?.hide();
}

function editClass(cls: GymClass) {
    editingClass = cls;
    form.value = { ...cls };
    if (modalRef.value) new Modal(modalRef.value).show();
}

function saveClass() {
    if (editingClass) {
        Object.assign(editingClass, form.value);
    } else {
        const newId = classes.value.length ? Math.max(...classes.value.map((c) => c.id)) + 1 : 1;
        classes.value.push({ ...form.value, id: newId });
    }
    closeModal();
}

function deleteClass(id: number) {
    if (confirm("Are you sure to delete this class?")) {
        classes.value = classes.value.filter((c) => c.id !== id);
    }
}
</script>
