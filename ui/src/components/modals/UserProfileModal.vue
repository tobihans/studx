<script lang="ts" setup>
import { computed, ref } from "vue";
import BaseModal from "@/components/modals/BaseModal.vue";
import PhX from "~icons/ph/x";
import PhClock from "~icons/ph/clock";
import type { User } from "@/schemas/auth";

defineProps({
  username: {
    type: String,
    required: true,
  },
});

const modal = ref<typeof BaseModal>();
const user = ref<User>();
const fullName = computed(() => {
  return user.value?.firstName! + user.value?.lastName!;
});

defineExpose({ modal });
</script>

<template>
  <BaseModal ref="modal">
    <slot></slot>
    <template #modal>
      <div
        class="container mx-auto grid w-full px-6 py-3 overflow-hidden bg-white rounded-t-lg dark:bg-gray-800 sm:rounded-lg sm:m-4 sm:max-w-xl"
        role="dialog"
        id="modal"
      >
        <header class="flex justify-end">
          <button
            @click="modal?.close()"
            class="inline-flex items-center justify-center w-6 h-6 text-gray-400 transition-colors duration-150 rounded dark:hover:text-gray-200 hover: hover:text-gray-700"
            aria-label="close"
          >
            <PhX class="w-4 h-4" />
          </button>
        </header>
        <!-- Modal body -->
        <div class="mt-4 mb-6 flex gap-5">
          <img
            class="object-cover w-22 h-22 md:(w-24 h-24) rounded"
            src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
            alt=""
            aria-hidden="true"
          />
          <div class="text-sm text-gray-700 dark:text-gray-400">
            <p class="font-semibold text-gray-700 dark:text-gray-300 my-2">
              {{ username }}
            </p>
            <p class="my-2">{{ fullName }}</p>
            <p class="my-2">{{ user?.email }}</p>
            <p class="my-2 flex items-center gap-2">
              <PhClock />
              <span>Account created {{ user?.createdAt }}</span>
              <span>
                <span
                  class="border border-purple-500 uppercase text-purple-500 dark:(border-purple-300 text-purple-300) inline-flex items-center px-1 py-0.5 text-xs font-semibold rounded-sm"
                >
                  <span>{{ user?.role ?? "student" }}</span>
                </span>
                since {{ user?.joinedAt }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped></style>
