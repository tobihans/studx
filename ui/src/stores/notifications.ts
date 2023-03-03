import { ref } from "vue";
import { defineStore } from "pinia";
import {
  getAllNotifications,
  getUnreadNotifications,
} from "@/services/notifications";
import type { Page } from "@/schemas";
import type { Notification } from "@/schemas/notifications";
import { notify } from "@kyvg/vue3-notification";

export const useNotificationsStore = defineStore("notifications", () => {
  const unread = ref<Page<Notification>>();

  const all = ref<Page<Notification>>();

  const loadUnread = () =>
    new Promise((resolve, reject) => {
      getUnreadNotifications()
        .then((page) => {
          unread.value = page;
          resolve(page);
        })
        .catch((error) => reject(error));
    });

  const loadMoreUnread = () => {};

  const loadAll = () =>
    new Promise((resolve, reject) => {
      getAllNotifications()
        .then((page) => {
          all.value = page;
          resolve(page);
        })
        .catch((error) => reject(error));
    });

  const loadMoreAll = () => {};

  loadUnread().catch(() =>
    notify({ title: "Error", text: "A network error happened.", type: "error" })
  ); // Default

  const removeUnread = (pk: number) => {
    if (unread.value) {
      const length = unread.value.results.length;

      unread.value.results = unread.value.results.filter(
        (notification) => notification.pk != pk
      );

      if (length > unread.value.results.length)
        unread.value.count -= length - unread.value.results.length;
    }
  };

  const remove = (pk: number) => {
    if (all.value) {
      const length = all.value.results.length;

      all.value.results = all.value.results.filter(
        (notification) => notification.pk != pk
      );

      if (length > all.value.results.length)
        all.value.count -= length - all.value.results.length;
    }
  };

  return {
    all,
    unread,
    loadUnread,
    loadMoreUnread,
    removeUnread,
    loadAll,
    loadMoreAll,
    remove,
  };
});
