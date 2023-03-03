import type { User } from "@/schemas/auth";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const token = ref(localStorage.getItem("_tok") ?? null);
  const user = ref<User>();

  return { token, user };
});
