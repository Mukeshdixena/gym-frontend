<template>
    <div class="container-fluid">
        <h2 class="mb-4">Plans</h2>

        <!-- Search & Add -->
        <div class="d-flex justify-content-between mb-3">
            <input type="text" class="form-control w-25" placeholder="Search by plan name" v-model="searchTerm" />
            <button class="btn btn-primary" @click="openAddModal">Add Plan</button>
        </div>

        <!-- Plans Table -->
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th>Plan Name</th>
                    <th>Description</th>
                    <th>Price (₹)</th>
                    <th>Duration (Days)</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="plan in filteredPlans" :key="plan.id">
                    <td>{{ plan.name }}</td>
                    <td>{{ plan.description || '-' }}</td>
                    <td>{{ plan.price.toFixed(2) }}</td>
                    <td>{{ plan.durationDays }}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-2" @click="editPlan(plan)">Edit</button>
                        <button class="btn btn-sm btn-danger" @click="deletePlan(plan.id)">Delete</button>
                    </td>
                </tr>
                <tr v-if="filteredPlans.length === 0">
                    <td colspan="5" class="text-center text-muted">No plans found</td>
                </tr>
            </tbody>
        </table>

        <!-- Add/Edit Modal -->
        <div class="modal fade" id="planModal" tabindex="-1" aria-hidden="true" ref="modalRef">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ editingPlan ? "Edit Plan" : "Add Plan" }}</h5>
                        <button type="button" class="btn-close" @click="closeModal"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="savePlan">
                            <div class="mb-3">
                                <label class="form-label">Plan Name</label>
                                <input v-model="form.name" type="text" class="form-control" required />
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea v-model="form.description" class="form-control" rows="2"></textarea>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Price (₹)</label>
                                <input v-model.number="form.price" type="number" step="0.01" min="0"
                                    class="form-control" required />
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Duration (Days)</label>
                                <input v-model.number="form.durationDays" type="number" min="1" class="form-control"
                                    required />
                            </div>

                            <button class="btn btn-primary" type="submit">
                                {{ editingPlan ? "Update" : "Add" }}
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

interface Plan {
    id: number;
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    createdAt?: string;
    updatedAt?: string;
}

// Base API URL
const API_URL = "http://localhost:3000/plans"; // change if backend uses another port

const plans = ref<Plan[]>([]);
const searchTerm = ref("");

// Modal & Form Handling
const modalRef = ref<HTMLElement | null>(null);
let editingPlan: Plan | null = null;

const form = ref<Plan>({
    id: 0,
    name: "",
    description: "",
    price: 0,
    durationDays: 30,
});

// Computed Filter
const filteredPlans = computed(() =>
    plans.value.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
);

// 🟢 Load all plans on mount
onMounted(async () => {
    await fetchPlans();
});

// ========== API FUNCTIONS ==========

// GET all plans
async function fetchPlans() {
    try {
        const res = await axios.get(API_URL);
        plans.value = res.data;
    } catch (err) {
        console.error("Failed to fetch plans:", err);
        alert("Error loading plans!");
    }
}

// POST new plan
async function createPlan() {
    try {
        const res = await axios.post(API_URL, {
            name: form.value.name,
            description: form.value.description,
            price: form.value.price,
            durationDays: form.value.durationDays,
        });
        plans.value.push(res.data);
    } catch (err) {
        console.error("Failed to create plan:", err);
        alert("Error creating plan!");
    }
}

// PUT update plan
async function updatePlan(id: number) {
    try {
        const res = await axios.put(`${API_URL}/${id}`, {
            name: form.value.name,
            description: form.value.description,
            price: form.value.price,
            durationDays: form.value.durationDays,
        });
        const index = plans.value.findIndex((p) => p.id === id);
        if (index !== -1) plans.value[index] = res.data;
    } catch (err) {
        console.error("Failed to update plan:", err);
        alert("Error updating plan!");
    }
}

// DELETE plan
async function deletePlan(id: number) {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
        await axios.delete(`${API_URL}/${id}`);
        plans.value = plans.value.filter((p) => p.id !== id);
    } catch (err) {
        console.error("Failed to delete plan:", err);
        alert("Error deleting plan!");
    }
}

// ========== MODAL FUNCTIONS ==========

function openAddModal() {
    editingPlan = null;
    form.value = { id: 0, name: "", description: "", price: 0, durationDays: 30 };
    if (modalRef.value) new Modal(modalRef.value).show();
}

function closeModal() {
    if (modalRef.value) Modal.getInstance(modalRef.value)?.hide();
}

function editPlan(plan: Plan) {
    editingPlan = plan;
    form.value = { ...plan };
    if (modalRef.value) new Modal(modalRef.value).show();
}

async function savePlan() {
    if (editingPlan) {
        await updatePlan(editingPlan.id);
    } else {
        await createPlan();
    }
    closeModal();
}
</script>


<style scoped></style>
