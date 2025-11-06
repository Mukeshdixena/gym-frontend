<template>
  <div class="container mt-4">
    <h3 class="mb-4">Gym Dashboard</h3>

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

    <!-- Loading -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading dashboard data...</p>
    </div>

    <!-- Dashboard content -->
    <div v-else>
      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <StatCard title="Total Members" :value="summary.totalMembers" icon="bi-people-fill" color="primary" />
        <StatCard title="Active Members" :value="summary.activeMembers" icon="bi-person-check-fill" color="success" />
        <StatCard title="Revenue Today" :value="formatCurrency(summary.revenueToday)" icon="bi-currency-rupee"
          color="warning" />
        <StatCard title="Pending Dues" :value="formatCurrency(summary.pendingDues)" icon="bi-exclamation-triangle-fill"
          color="danger" />
      </div>

      <div class="row g-3 mb-4">
        <StatCard title="Revenue This Month" :value="formatCurrency(summary.revenueThisMonth)" icon="bi-graph-up-arrow"
          color="info" />
        <StatCard title="Upcoming Renewals (7 days)" :value="summary.upcomingRenewals" icon="bi-alarm"
          color="secondary" />
        <StatCard title="Active Trainers" :value="summary.activeTrainers" icon="bi-person-badge" color="dark" />
      </div>

      <!-- Alerts -->
      <div v-if="alerts.length" class="row g-3 mb-4">
        <div v-for="a in alertsSorted" :key="a.title" class="col-12 col-md-6 col-lg-4">
          <AlertCard :type="a.type" :title="a.title" :action="a.action" :link="a.link" @navigate="navigate" />
        </div>
      </div>

      <!-- Charts -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-lg-6">
          <ChartCard title="Revenue Trend (30 Days)">
            <canvas ref="revenueChart"></canvas>
          </ChartCard>
        </div>
        <div class="col-12 col-lg-6">
          <ChartCard title="Membership Status">
            <canvas ref="statusChart"></canvas>
          </ChartCard>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12 col-lg-6">
          <ChartCard title="Member Growth (6 Months)">
            <canvas ref="growthChart"></canvas>
          </ChartCard>
        </div>

        <div class="col-12 col-lg-6">
          <ChartCard title="Top Performing Plans">
            <ol class="list-group list-group-numbered">
              <li v-for="p in topPlans" :key="p.name"
                class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-bold">{{ p.name }}</div>
                  <small class="text-muted">{{ p.members }} members</small>
                </div>
                <span class="badge bg-primary rounded-pill">
                  {{ formatCurrency(p.revenue) }}
                </span>
              </li>
            </ol>
          </ChartCard>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
          Recent Activity
          <button @click="loadRecentActivity" class="btn btn-sm btn-outline-secondary">Refresh</button>
        </div>
        <div class="card-body p-0">
          <ul class="list-group list-group-flush">
            <li v-for="act in recentActivity" :key="act.id"
              class="list-group-item list-group-item-action d-flex align-items-center px-3 py-2"
              @click="navigate(act.link)" style="cursor:pointer">
              <div class="me-3 rounded-circle d-flex align-items-center justify-content-center text-white"
                :class="activityIconClass(act.icon)" style="width:36px;height:36px">
                <i :class="activityIcon(act.icon)" class="bi bi-xs"></i>
              </div>
              <div class="flex-grow-1">
                <p class="mb-1 small">{{ act.title }}</p>
                <p class="mb-0 text-muted x-small">{{ act.time }}</p>
              </div>
              <i class="bi bi-chevron-right text-muted"></i>
            </li>
            <li v-if="!recentActivity.length" class="list-group-item text-center text-muted py-3">
              No recent activity
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'bootstrap'
import api from '@/api/axios'
import Chart from 'chart.js/auto'

const router = useRouter()
const isLoading = ref(true)
const toastRef = ref<HTMLElement | null>(null)
let toast: Toast

/* ───────────── STATE ───────────── */
const summary = ref<any>({
  totalMembers: 0, activeMembers: 0, revenueToday: 0, pendingDues: 0,
  revenueThisMonth: 0, upcomingRenewals: 0, activeTrainers: 0
})
const alerts = ref<any[]>([])
const revenueTrend = ref<any[]>([])
const membershipStatus = ref<Record<string, number>>({})
const memberGrowth = ref<any[]>([])
const recentActivity = ref<any[]>([])
const topPlans = ref<any[]>([])

/* ───────────── CHART REFS ───────────── */
const revenueChart = ref<HTMLCanvasElement | null>(null)
const statusChart = ref<HTMLCanvasElement | null>(null)
const growthChart = ref<HTMLCanvasElement | null>(null)
let revInst: Chart | null = null
let statInst: Chart | null = null
let growInst: Chart | null = null

/* ───────────── TOAST ───────────── */
const toastMessage = ref('')
const showToast = (msg: string, ok = true) => {
  toastMessage.value = msg
  if (toastRef.value) {
    toastRef.value.className = `toast align-items-center text-white ${ok ? 'bg-success' : 'bg-danger'} border-0`
    toast?.show()
  }
  setTimeout(() => hideToast(), 4000)
}
const hideToast = () => toast?.hide()

/* ───────────── HELPERS ───────────── */
const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(v)

const navigate = (p: string) => router.push(p)

const activityIcon = (t: string) => ({
  cash: 'bi bi-currency-rupee',
  addon: 'bi bi-plus-circle',
  expense: 'bi bi-receipt',
  alert: 'bi bi-bell'
}[t] ?? 'bi bi-circle')

const activityIconClass = (t: string) => ({
  cash: 'bg-success',
  addon: 'bg-info',
  expense: 'bg-secondary',
  alert: 'bg-warning'
}[t] ?? 'bg-light text-dark')

const alertsSorted = computed(() =>
  alerts.value.slice().sort((a, b) => (a.priority || 99) - (b.priority || 99))
)

/* ───────────── API CALLS ───────────── */
const loadSummary = async () => summary.value = (await api.get('/api/dashboard/summary')).data
const loadAlerts = async () => alerts.value = (await api.get('/api/dashboard/alerts')).data
const loadRevenueTrend = async () => {
  const r = await api.get('/api/dashboard/revenue-trend?days=30')
  revenueTrend.value = r.data.map((i: any) => ({
    date: i.date.split('T')[0],
    income: i.income ?? 0,
    expense: Math.abs(i.expense ?? 0),
    net: i.net ?? 0
  }))
}
const loadMembershipStatus = async () => membershipStatus.value = (await api.get('/api/dashboard/membership-status')).data
const loadMemberGrowth = async () => {
  const r = await api.get('/api/dashboard/member-growth?months=6')
  memberGrowth.value = r.data.map((d: any) => ({
    month: d.name,
    newMembers: d.members
  }))
}
const loadRecentActivity = async () => recentActivity.value = (await api.get('/api/dashboard/recent-activity?limit=10')).data
const loadTopPlans = async () => topPlans.value = (await api.get('/api/dashboard/top-plans?limit=5')).data

/* ───────────── CHARTS ───────────── */
const initCharts = () => {
  revInst?.destroy()
  statInst?.destroy()
  growInst?.destroy()

  if (revenueChart.value && revenueTrend.value.length) {
    revInst = new Chart(revenueChart.value, {
      type: 'line',
      data: {
        labels: revenueTrend.value.map(d => d.date),
        datasets: [
          { label: 'Income (₹)', data: revenueTrend.value.map(d => d.income), borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.15)', tension: 0.4, fill: true },
          { label: 'Expense (₹)', data: revenueTrend.value.map(d => d.expense), borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.15)', tension: 0.4, fill: true },
          { label: 'Net (₹)', data: revenueTrend.value.map(d => d.net), borderColor: '#0d6efd', borderDash: [5, 5], fill: false, tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    })
  }

  if (statusChart.value && Object.keys(membershipStatus.value).length) {
    statInst = new Chart(statusChart.value, {
      type: 'doughnut',
      data: { labels: Object.keys(membershipStatus.value), datasets: [{ data: Object.values(membershipStatus.value), backgroundColor: ['#198754', '#ffc107', '#dc3545', '#6c757d', '#343a40'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    })
  }

  if (growthChart.value && memberGrowth.value.length) {
    growInst = new Chart(growthChart.value, {
      type: 'bar',
      data: { labels: memberGrowth.value.map(d => d.month), datasets: [{ label: 'New Members', data: memberGrowth.value.map(d => d.newMembers), backgroundColor: '#0d6efd' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    })
  }
}

/* ───────────── LIFECYCLE ───────────── */
onMounted(async () => {
  if (toastRef.value) toast = new Toast(toastRef.value)
  try {
    await Promise.all([
      loadSummary(),
      loadAlerts(),
      loadRevenueTrend(),
      loadMembershipStatus(),
      loadMemberGrowth(),
      loadRecentActivity(),
      loadTopPlans()
    ])
    setTimeout(() => initCharts(), 300)
  } catch (e: any) {
    showToast('Failed to load dashboard.', false)
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  revInst?.destroy()
  statInst?.destroy()
  growInst?.destroy()
})

/* ───────────── COMPONENTS ───────────── */
const StatCard = (props: { title: string; value: string | number; icon: string; color: string }) => h(
  'div', { class: 'col' },
  h('div', { class: 'card border-0 shadow-sm h-100' },
    h('div', { class: 'card-body d-flex align-items-center' }, [
      h('div', { class: 'flex-grow-1' }, [
        h('p', { class: 'text-muted small mb-1' }, props.title),
        h('h4', { class: 'mb-0' }, props.value)
      ]),
      h('i', { class: `bi ${props.icon} fa-2x text-${props.color}` })
    ])
  )
)

const AlertCard = (props: { type: string; title: string; action: string; link: string }, { emit }: any) => h(
  'div', {
  class: [
    'card border-0 shadow-sm',
    { 'border-start border-4 border-success': props.type === 'success' },
    { 'border-start border-4 border-warning': props.type === 'warning' },
    { 'border-start border-4 border-danger': props.type === 'danger' }
  ]
},
  h('div', { class: 'card-body' }, [
    h('div', { class: 'd-flex justify-content-between align-items-start' }, [
      h('div', {}, [
        h('h6', { class: 'card-title mb-1' }, props.title),
        h('p', { class: 'card-text small text-muted mb-2' }, props.action)
      ]),
      h('i', {
        class:
          props.type === 'success' ? 'bi bi-check-circle text-success'
            : props.type === 'warning' ? 'bi bi-exclamation-triangle text-warning'
              : 'bi bi-x-circle text-danger'
      })
    ]),
    h('button', {
      class: 'btn btn-sm btn-outline-primary w-100 mt-2',
      onClick: () => emit('navigate', props.link)
    }, 'View')
  ])
)

const ChartCard = (props: { title: string }, { slots }: any) => h(
  'div', { class: 'card border-0 shadow-sm h-100' },
  [
    h('div', { class: 'card-header bg-white fw-bold' }, props.title),
    h('div', { class: 'card-body', style: 'height:320px;' }, slots.default?.())
  ]
)
</script>

<style scoped>
.x-small {
  font-size: .7rem;
}

.list-group-item:hover {
  background: #f8f9fa;
}
</style>
