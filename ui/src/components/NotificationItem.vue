<script lang="ts" setup>
import { computed } from "vue";
import { format as formatTime } from "timeago.js";
import type { Notification } from "@/schemas/notifications";
import EmptyImgUrl from "@/assets/img/empty.svg?url";
import PhDotsThree from "~icons/ph/dots-three";
import DropDown from "@/components/base/DropDown.vue";
import {
  deleteAll,
  deleteNotification,
  markAllAsRead,
  markAsRead,
} from "@/services/notifications";
import { storeToRefs } from "pinia";
import { useNotificationsStore } from "@/stores/notifications";

const props = defineProps<{ notification: Notification }>();
const { unread, all } = storeToRefs(useNotificationsStore());
const { remove, removeUnread } = useNotificationsStore();
const actions = ["Mark as read", "Mark all as read", "Delete", "Delete all"];

const actorName = computed(() => {
  const actor = props.notification.actor;

  return actor.type == "User" ? actor.username : actor.name;
});

const actionObjectName = computed(() => {
  const actionObject = props.notification.actionObject;
  console.log({ actionObject });

  return actionObject
    ? actionObject?.type == "User"
      ? actionObject.username
      : actionObject.name
    : "";
});

const prefix = computed(() => {
  let pre = "";

  switch (props.notification.verb) {
    case "changed the status":
      pre = "of";
      break;
  }

  return pre;
});

const onAction = async (action: string) => {
  switch (action) {
    case "Mark as read":
      await markAsRead(props.notification.pk);
      removeUnread(props.notification.pk);
      break;
    case "Mark all as read":
      await markAllAsRead();
      unread.value = { count: 0, previous: 0, next: 0, results: [] };
      break;
    case "Delete":
      await deleteNotification(props.notification.pk);
      removeUnread(props.notification.pk);
      await remove(props.notification.pk);
      break;
    case "Delete all":
      await deleteAll();
      all.value = { count: 0, previous: 0, next: 0, results: [] };
      unread.value = { count: 0, previous: 0, next: 0, results: [] };
      break;
  }
};
</script>

<template>
  <li class="mb-10 ml-6">
    <span
      class="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900"
    >
      <img
        class="rounded w-full h-full shadow-md"
        :src="notification.target.picture || EmptyImgUrl"
        alt="Thomas Lean image"
      />
    </span>
    <div
      class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600"
    >
      <!--      <div class="flex justify-end">-->
      <DropDown class="float-right">
        <button class="px-1"><PhDotsThree /></button>
        <template #dropdown>
          <ul
            class="w-56 p-2 space-y-2 text-gray-600 bg-white border border-gray-100 rounded-md shadow-md dark:border-gray-700 dark:text-gray-300 dark:bg-gray-700"
            aria-label="submenu"
          >
            <li v-for="action in actions" :key="action">
              <button
                @click="onAction(action)"
                :class="{
                  'text-red-500 dark:text-red-400 hover:(text-red-800 dark:text-red-200)':
                    /delete/i.test(action),
                }"
                class="inline-flex items-center w-full px-2 py-1 text-sm transition-colors duration-150 rounded-md hover:(bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200)"
              >
                {{ action }}
              </button>
            </li>
          </ul>
        </template>
      </DropDown>
      <!--      </div>-->
      <div class="items-center justify-between mb-3 sm:flex">
        <time
          class="mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0"
        >
          {{ formatTime(notification.timestamp) }}
        </time>
        <div
          class="flex items-center text-sm font-normal text-gray-500 lex dark:text-gray-300"
        >
          <span class="text-gray-900 dark:text-white">
            <strong class="font-semibold">{{ actorName }}</strong>
            &nbsp; {{ notification.verb }}&nbsp;
            {{ prefix ? `${prefix}&nbsp;` : "" }}
            <strong class="font-semibold">{{ actionObjectName }}</strong>
          </span>
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped></style>
