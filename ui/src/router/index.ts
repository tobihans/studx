import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/stores/user";
import { whoAmI } from "@/services/auth";
import { beforeHomeEnter } from "@/router/guards";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/authenticate",
      name: "authenticate",
      component: () => import("@/views/AuthView.vue"),
      beforeEnter() {
        const userStore = useUserStore();

        if (userStore.token && userStore.user) {
          return { name: "home" };
        }
      },
    },
    {
      path: "/:dashboardContextOrgSlug?",
      component: () => import("@/views/home/HomeView.vue"),
      meta: {
        requiresAuth: true,
      },
      beforeEnter: [beforeHomeEnter],
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/views/events/IndexView.vue"),
        },
        {
          path: "new-org",
          name: "new-org",
          component: () => import("@/views/orgs/NewOrganizationView.vue"),
        },
        {
          path: "wikis",
          name: "wikis",
          component: () => import("@/views/wikis/IndexView.vue"),
        },
        {
          path: "meetings/:meetingId?",
          name: "meetings",
          component: () => import("@/views/meetings/IndexView.vue"),
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("@/views/orgs/SettingsView.vue"),
        },
      ],
    },
    {
      path: "/:path(.*)*",
      name: "404",
      component: () => import("@/views/404View.vue"),
    },
  ],
});

router.beforeEach(async (to) => {
  const userStore = useUserStore();
  const loginRoute = {
    name: "authenticate", query: {
      next: router.resolve(to).fullPath,
    }
  };

  if (to.meta.requiresAuth) {
    const token = userStore.token;

    if (!token) return loginRoute;

    try {
      userStore.user = await whoAmI();
      userStore.token = userStore.user ? userStore.token : "";

      return userStore.user ? true : loginRoute;
    } catch {
      return loginRoute;
    }
  }
});

export default router;
