<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import BaseModal from "@/components/modals/BaseModal.vue";
import PhX from "~icons/ph/x";
import NotificationItem from "@/components/NotificationItem.vue";
import { useNotificationsStore } from "@/stores/notifications";
import { storeToRefs } from "pinia";
import EmptyBoxURL from "@/assets/img/undraw_empty_box.svg";

const modal = ref<InstanceType<typeof BaseModal>>();
const loadUnreadOnly = ref(true);
const { unread, all } = storeToRefs(useNotificationsStore());
const { loadUnread, loadAll } = useNotificationsStore();
const notifications = computed(() =>
  loadUnreadOnly.value ? unread.value : all.value
);

const close = () => {
  modal.value?.close();
};

watch(loadUnreadOnly, async (value) => {
  if (value) await loadUnread();
  else await loadAll();
});

defineExpose({ modal });
</script>

<template>
  <BaseModal ref="modal">
    <slot></slot>
    <template #modal>
      <div
        class="container mx-auto w-full px-6 py-3 overflow-hidden bg-white rounded-t-lg dark:bg-gray-800 sm:rounded-lg sm:m-4 sm:max-w-xl md:max-w-screen-xl h-10/12 overflow-y-auto"
        role="dialog"
        id="modal"
      >
        <header
          class="flex text-sm justify-between items-center sticky top-0 z-4000 p-2 bg-gray-100 rounded-md dark:bg-gray-700"
        >
          <!-- Modal title -->
          <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Notifications
          </p>
          <div class="mr-auto ml-2 flex justify-between items-center">
            <button
              @click="loadUnreadOnly = true"
              class="btn py-1 px-2 min-w-12 text-xs mx-0.5 rounded-full"
              :class="[
                loadUnreadOnly
                  ? 'text-white bg-purple-500'
                  : 'border-purple-500 bg-purple-500 bg-opacity-20 text-purple-600 dark:text-purple-300 hover:bg-opacity-50',
              ]"
            >
              Unread
            </button>
            <button
              @click="loadUnreadOnly = false"
              class="btn py-1 px-2 min-w-12 text-xs mx-0.5 rounded-full"
              :class="[
                !loadUnreadOnly
                  ? 'text-white bg-purple-500'
                  : 'border-purple-500 bg-purple-500 bg-opacity-20 text-purple-600 dark:text-purple-300 hover:bg-opacity-50',
              ]"
            >
              All
            </button>
          </div>
          <button
            @click="close()"
            class="inline-flex items-center justify-center w-6 h-6 text-gray-400 transition-colors duration-150 rounded dark:hover:text-gray-200 hover: hover:text-gray-700"
            aria-label="close"
          >
            <PhX class="w-4 h-4" />
          </button>
        </header>
        <!-- Modal body -->
        <div class="mt-4 mb-6">
          <!-- Modal description -->
          <!-- Modal title -->

          <ul
            :class="{
              relative: true,
              'border-l border-gray-200 dark:border-gray-700':
                notifications?.results.length !== 0,
            }"
          >
            <NotificationItem
              v-for="notification in notifications?.results"
              :key="notification.pk"
              :notification="notification"
            />
            <!-- TODO: Load more button -->
            <li
              v-if="notifications?.results.length === 0"
              class="p-4 flex flex-col justify-center items-center"
            >
              <img :src="EmptyBoxURL" class="max-w-4/12" />
              <p class="py-4 text-sm">Nothing for the moment, check later.</p>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped></style>
