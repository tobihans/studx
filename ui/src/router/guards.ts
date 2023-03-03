import { useOrgsStore } from "@/stores/organization";
import { getUserMembership } from "@/services/organization";
import { useUserStore } from "@/stores/user";
import type { RouteLocationNormalized } from "vue-router";
import { notifyError } from "@/utils";

export const beforeHomeEnter = async (to: RouteLocationNormalized) => {
  const orgStore = useOrgsStore();
  const userStore = useUserStore();
  let dashboardContextOrgSlug = to.params.dashboardContextOrgSlug;

  try {
    if (dashboardContextOrgSlug) {
      const org = await getUserMembership(
        dashboardContextOrgSlug as string,
        userStore.user?.username!
      );

      if (org) {
        orgStore.org = org;
        localStorage.setItem("org_slug", dashboardContextOrgSlug as string);
      } else {
        return { name: "404", params: { path: dashboardContextOrgSlug } };
      }
      return;
    } else {
      dashboardContextOrgSlug =
        localStorage.getItem("org_slug") ??
        orgStore.organizations.at(0)?.slug ??
        "";
      const org = await getUserMembership(
        dashboardContextOrgSlug as string,
        userStore.user?.username!
      );

      if (org) {
        orgStore.org = org;
        return {
          name: "home",
          params: { dashboardContextOrgSlug: dashboardContextOrgSlug },
        };
      }

      return { name: "404", params: { path: "" } };
    }
  } catch {
    notifyError();
    return { name: "404", params: { path: dashboardContextOrgSlug } };
  }
};
