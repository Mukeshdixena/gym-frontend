// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";

// Pages
import Dashboard from "@/pages/Dashboard.vue";
import Members from "@/pages/Members.vue";
import AssignMembershipPlan from "@/pages/AssignMembershipPlan.vue";
import Trainers from "@/pages/Trainers.vue";
import Classes from "@/pages/Classes.vue";
import Plans from "@/pages/Plans.vue";
import Billing from "@/pages/Billing.vue";
import Login from "@/pages/Login.vue"; // ← Your Login Page
import PaymentHistory from "@/pages/PaymentHistory.vue"; // ← New Payment History Page

// --- Routes ---
const routes = [
  // Public Route
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false },
  },

  // Protected Routes
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/billing",
    name: "Billing",
    component: Billing,
    meta: { requiresAuth: true },
  },
  {
    path: "/assign-membership-plan",
    name: "AssignMembershipPlan",
    component: AssignMembershipPlan,
    meta: { requiresAuth: true },
  },
  {
    path: "/members",
    name: "Members",
    component: Members,
    meta: { requiresAuth: true },
  },
  {
    path: "/trainers",
    name: "Trainers",
    component: Trainers,
    meta: { requiresAuth: true },
  },
  {
    path: "/classes",
    name: "Classes",
    component: Classes,
    meta: { requiresAuth: true },
  },
  {
    path: "/plans",
    name: "Plans",
    component: Plans,
    meta: { requiresAuth: true },
  },
  {
    path: "/payment-history",
    name: "paymentHistory",
    component: PaymentHistory,
    meta: { requiresAuth: true },
  },

  // Catch-all: Redirect to login
  {
    path: "/:pathMatch(.*)*",
    redirect: "/login",
  },
];

// --- Router ---
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --- Route Guard ---
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("token");

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Not logged in → go to login
    next({ name: "Login", query: { redirect: to.fullPath } });
  } else if (to.name === "Login" && isAuthenticated) {
    // Already logged in → go to dashboard
    next({ name: "Dashboard" });
  } else {
    next();
  }
});

export default router;
