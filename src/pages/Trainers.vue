<template>
    <div class="container-fluid mt-4">
        <h2 class="mb-4">Trainers</h2>

        <!-- Toast -->
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
            <input type="text" class="form-control w-25" placeholder="Search by name or email" v-model="searchTerm"
                :disabled="isLoading" />
            <button class="btn btn-primary" @click="openAddModal" :disabled="isLoading">
                Add Trainer
            </button>
        </div>

        <!-- Trainers Table -->
        <div class="table-responsive">
            <table class="table table-striped table-hover align-middle">
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
                        <td>
                            <span class="badge bg-info text-dark" v-if="trainer.speciality">
                                {{ trainer.speciality }}
                            </span>
                            <span class="text-muted" v-else>—</span>
                        </td>
                        <td>{{ trainer.classes?.length ?? 0 }}</td>
                        <td>
                            <button class="btn btn-sm btn-info me-2" @click="editTrainer(trainer)"
                                :disabled="isLoading">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-danger" @click="deleteTrainer(trainer.id)"
                                :disabled="isLoading">
                                Delete
                            </button>
                        </td>
                    </tr>
                    <tr v-if="filteredTrainers.length === 0">
                        <td colspan="6" class="text-center text-muted py-4">
                            {{ isLoading ? 'Loading trainers...' : 'No trainers found' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Add/Edit Modal -->
        <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            {{ editingTrainer ? 'Edit Trainer' : 'Add New Trainer' }}
                        </h5>
                        <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="saveTrainer">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">First Name</label>
                                    <input v-model="form.firstName" type="text" class="form-control" required
                                        :disabled="isSubmitting" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Last Name</label>
                                    <input v-model="form.lastName" type="text" class="form-control" required
                                        :disabled="isSubmitting" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Email</label>
                                    <input v-model="form.email" type="email" class="form-control" required
                                        :disabled="isSubmitting" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Phone</label>
                                    <input v-model="form.phone" type="text" class="form-control" required
                                        :disabled="isSubmitting" />
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Speciality (Optional)</label>
                                    <input v-model="form.speciality" type="text" class="form-control"
                                        placeholder="e.g., Yoga, Zumba, Strength Training" :disabled="isSubmitting" />
                                </div>
                            </div>

                            <div class="d-grid mt-4">
                                <button type="submit" class="btn btn-primary" :disabled="isSubmitting || !isFormValid">
                                    <span v-if="isSubmitting" class="d-flex align-items-center justify-content-center">
                                        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
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
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/api/axios'
import type { AxiosResponse } from 'axios'

// --- Interfaces ---
interface GymClass {
    id: number
    name: string
    startTime: string
    endTime: string
}

interface Trainer {
    id: number
    firstName: string
    lastName: string
    email: string
    phone: string
    speciality: string
    classes?: GymClass[]
}

// --- State ---
const trainers = ref<Trainer[]>([])
const searchTerm = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)

const modalRef = ref<HTMLElement | null>(null)
const toastRef = ref<HTMLElement | null>(null)

let modal: Modal
let toastInstance: Toast

const editingTrainer = ref<Trainer | null>(null)
const toastMessage = ref('')

// --- Form ---
const form = ref<Partial<Trainer>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    speciality: '',
    classes: []
})

// --- Computed ---
const filteredTrainers = computed(() => {
    const term = searchTerm.value.toLowerCase().trim()
    if (!term) return trainers.value

    return trainers.value.filter((t) => {
        const fullName = `${t.firstName} ${t.lastName}`.toLowerCase()
        return fullName.includes(term) || t.email.toLowerCase().includes(term)
    })
})

const isFormValid = computed(() => {
    return (
        form.value.firstName?.trim() &&
        form.value.lastName?.trim() &&
        form.value.email?.includes('@') &&
        (form.value.phone?.trim()?.length ?? 0) >= 10
    )
})

// --- Toast ---
const showToast = (message: string, isSuccess = true) => {
    toastMessage.value = message
    if (toastRef.value) {
        toastRef.value.className = `toast align-items-center text-white ${isSuccess ? 'bg-success' : 'bg-danger'
            } border-0`
        toastInstance?.show()
    }
    setTimeout(() => {
        if (toastMessage.value === message) hideToast()
    }, 4000)
}
const hideToast = () => toastInstance?.hide()

// --- API ---
const fetchTrainers = async () => {
    try {
        // Explicitly type the response
        const res: AxiosResponse<Trainer[] | { data: Trainer[] }> = await api.get('/trainers')

        // Normalize response
        const data = 'data' in res.data ? res.data.data : res.data
        trainers.value = Array.isArray(data) ? data : []
    } catch (err: any) {
        console.error('Fetch trainers error:', err)
        showToast('Failed to load trainers.', false)
    }
}

const createTrainer = async () => {
    const payload = {
        firstName: form.value.firstName!.trim(),
        lastName: form.value.lastName!.trim(),
        email: form.value.email!.trim(),
        phone: form.value.phone!.trim(),
        speciality: form.value.speciality?.trim() || null,
    }

    const res = await api.post('/trainers', payload)
    trainers.value.push(res.data)
    showToast('Trainer added successfully!')
}

const updateTrainer = async (id: number) => {
    const payload = {
        firstName: form.value.firstName!.trim(),
        lastName: form.value.lastName!.trim(),
        email: form.value.email!.trim(),
        phone: form.value.phone!.trim(),
        speciality: form.value.speciality?.trim() || null,
    }

    const res = await api.put(`/trainers/${id}`, payload)
    const index = trainers.value.findIndex(t => t.id === id)
    if (index !== -1) trainers.value[index] = res.data
    showToast('Trainer updated successfully!')
}

const deleteTrainer = async (id: number) => {
    if (!confirm('Delete this trainer permanently?')) return

    try {
        await api.delete(`/trainers/${id}`)
        trainers.value = trainers.value.filter(t => t.id !== id)
        showToast('Trainer deleted.')
    } catch (err: any) {
        showToast('Delete failed.', false)
    }
}

// --- Modal ---
const openAddModal = () => {
    editingTrainer.value = null
    form.value = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        speciality: '',
        classes: []
    }
    modal?.show()
}

const editTrainer = (trainer: Trainer) => {
    editingTrainer.value = trainer
    form.value = { ...trainer }
    modal?.show()
}

const closeModal = () => {
    modal?.hide()
    editingTrainer.value = null
}

const saveTrainer = async () => {
    if (!isFormValid.value) return
    isSubmitting.value = true

    try {
        if (editingTrainer.value) {
            await updateTrainer(editingTrainer.value.id)
        } else {
            await createTrainer()
        }
        closeModal()
    } catch (err: any) {
        console.error(err)
        showToast(err.response?.data?.message || 'Save failed.', false)
    } finally {
        isSubmitting.value = false
    }
}

// --- Lifecycle ---
onMounted(async () => {
    if (modalRef.value) modal = new Modal(modalRef.value)
    if (toastRef.value) toastInstance = new Toast(toastRef.value)

    isLoading.value = true
    await fetchTrainers()
    isLoading.value = false
})
</script>

<style scoped>
.table td,
.table th {
    vertical-align: middle;
}

.badge {
    font-size: 0.75rem;
}

.spinner-border-sm {
    width: 1rem;
    height: 1rem;
}
</style>