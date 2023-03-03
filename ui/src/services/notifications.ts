import { apifetch } from "@/services";
import type { Notification } from "@/schemas/notifications";
import type { Page } from "@/schemas";

export const getUnreadNotifications = async (
  limit?: number,
  offset?: number
): Promise<Page<Notification>> => {
  const query: { limit?: number; offset?: number } = {};
  if (limit) query["limit"] = limit;
  if (offset) query["offset"] = offset;

  return await apifetch<Page<Notification>>("/notifications/unread/", {
    query,
  });
};

export const getAllNotifications = async (limit?: number, offset?: number) => {
  const query: { limit?: number; offset?: number } = {};
  if (limit) query["limit"] = limit;
  if (offset) query["offset"] = offset;

  return await apifetch<Page<Notification>>("/notifications/");
};

export const markAsRead = async (id: number) => {
  await apifetch(`/notifications/${id}/mark_as_read/`, {
    method: "POST",
  });
};

export const markAllAsRead = async () => {
  await apifetch("/notifications/mark_all_as_read/", {
    method: "POST",
  });
};

export const deleteNotification = async (id: number) => {
  await apifetch(`/notifications/${id}/`, {
    method: "DELETE",
  });
};

export const deleteAll = async () => {
  await apifetch("/notifications/delete_all", {
    method: "DELETE",
  });
};
