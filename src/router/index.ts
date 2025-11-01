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
import Login from "@/pages/Login.vue";
import PaymentHistory from "@/pages/PaymentHistory.vue";

// --- Routes ---
const routes = [
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

  {
    path: "/admin/approvals",
    name: "AdminApprovals",
    component: () => import("@/pages/AdminApprovals.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (to.meta.requiresAuth && !token) {
    return next({ name: "Login", query: { redirect: to.fullPath } });
  }

  if (to.name === "Login" && token) {
    return next({ name: "Dashboard" });
  }

  if (to.meta.requiresAdmin && role !== "ADMIN") {
    return next({ name: "Dashboard" });
  }

  next();
});

export default router;
