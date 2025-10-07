import { createRouter, createWebHistory } from "vue-router";

// Pages
import Dashboard from "@/pages/Dashboard.vue";
import Members from "@/pages/Members.vue";
import Trainers from "@/pages/Trainers.vue";
import Classes from "@/pages/Classes.vue";
import Plans from "@/pages/Plans.vue";
import Billing from "@/pages/Billing.vue";

const routes = [
  { path: "/", name: "Dashboard", component: Dashboard },
  { path: "/billing", name: "Billing", component: Billing },
  { path: "/members", name: "Members", component: Members },
  { path: "/trainers", name: "Trainers", component: Trainers },
  { path: "/classes", name: "Classes", component: Classes },
  { path: "/plans", name: "Plans", component: Plans },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
