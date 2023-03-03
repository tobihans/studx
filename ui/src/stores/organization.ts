import { getUserOrganizations } from "@/services/organization";
import { defineStore } from "pinia";
import { ref } from "vue";
import type { Page } from "@/schemas";
import type { Organization } from "@/schemas/organization";

export const useOrgsStore = defineStore("orgs", () => {
  // The current organization for the dashboard context
  const org = ref();
  const count = ref(0); // The total number of orgs the user belongs to
  const organizations = ref<Organization[]>([]); // The 5 recent organizations for the current user

  getUserOrganizations({ limit: 5 }).then(
    ({ results: orgs, count: total }: Page<Organization>) => {
      count.value = total;
      organizations.value = orgs;
    }
  );

  return { org, count, organizations };
});
