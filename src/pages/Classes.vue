<template>
    <div class="container-fluid">
        <h2 class="mb-4">Classes</h2>

        <!-- Search & Add -->
        <div class="d-flex justify-content-between mb-3">
            <input
                type="text"
                class="form-control w-25"
                placeholder="Search by class name or trainer"
                v-model="searchTerm"
            />
            <button class="btn btn-primary" @click="openAddModal">Add Class</button>
        </div>

        <!-- Classes Table -->
        <table class="table table-striped table-hover">
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
import { ref, computed, onMounted } from "vue";
import { Modal } from "bootstrap";
import axios from "axios";

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

// ✅ Backend API URLs
const CLASSES_API = "http://localhost:3000/classes";
const TRAINERS_API = "http://localhost:3000/trainers";

const classes = ref<GymClass[]>([]);
const trainers = ref<Trainer[]>([]);
const searchTerm = ref("");

// Computed: filter classes by name or trainer
const filteredClasses = computed(() =>
    classes.value.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            `${c.trainer?.firstName ?? ""} ${c.trainer?.lastName ?? ""}`
                .toLowerCase()
                .includes(searchTerm.value.toLowerCase())
    )
);

// Modal handling
const modalRef = ref<HTMLElement | null>(null);
let editingClass: GymClass | null = null;

const form = ref({
    id: 0,
    name: "",
    startTime: "",
    endTime: "",
    trainerId: 0,
});

// 🟢 Load classes and trainers on mount
onMounted(async () => {
    await fetchTrainers();
    await fetchClasses();
});

// ========== API FUNCTIONS ==========

// GET all classes
async function fetchClasses() {
    try {
        const res = await axios.get(CLASSES_API);
        classes.value = res.data;
    } catch (err) {
        console.error("Error fetching classes:", err);
        alert("Failed to load classes.");
    }
}

// GET all trainers (for dropdown)
async function fetchTrainers() {
    try {
        const res = await axios.get(TRAINERS_API);
        trainers.value = res.data;
    } catch (err) {
        console.error("Error fetching trainers:", err);
        alert("Failed to load trainers.");
    }
}

// POST create new class
async function createClass() {
    try {
        const res = await axios.post(CLASSES_API, {
            name: form.value.name,
            trainer: { connect: { id: form.value.trainerId } },
            startTime: new Date(form.value.startTime).toISOString(),
            endTime: new Date(form.value.endTime).toISOString(),
        });
        classes.value.push(res.data);
        await fetchClasses();
    } catch (err) {
        console.error("Error creating class:", err);
        alert("Failed to create class.");
    }
}

// PUT update class
async function updateClass(id: number) {
    try {
        const res = await axios.put(`${CLASSES_API}/${id}`, {
            name: form.value.name,
            trainer: { connect: { id: form.value.trainerId } },
            startTime: new Date(form.value.startTime).toISOString(),
            endTime: new Date(form.value.endTime).toISOString(),
        });
        const index = classes.value.findIndex((c) => c.id === id);
        if (index !== -1) classes.value[index] = res.data;
    } catch (err) {
        console.error("Error updating class:", err);
        alert("Failed to update class.");
    }
}

// DELETE class
async function deleteClass(id: number) {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
        await axios.delete(`${CLASSES_API}/${id}`);
        classes.value = classes.value.filter((c) => c.id !== id);
    } catch (err) {
        console.error("Error deleting class:", err);
        alert("Failed to delete class.");
    }
}

// ========== MODAL FUNCTIONS ==========

function openAddModal() {
    editingClass = null;
    form.value = { id: 0, name: "", startTime: "", endTime: "", trainerId: 0 };
    if (modalRef.value) new Modal(modalRef.value).show();
}

function closeModal() {
    if (modalRef.value) Modal.getInstance(modalRef.value)?.hide();
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
    if (modalRef.value) new Modal(modalRef.value).show();
}

async function saveClass() {
    if (editingClass) {
        await updateClass(editingClass.id);
    } else {
        await createClass();
    }
    closeModal();
}

// ========== UTILITIES ==========
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}
</script>
