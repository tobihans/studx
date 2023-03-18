import { apifetch } from "@/services";
import type { CreateEventRequest } from "@/schemas/events";

export const addEvent = async (org: string, request: CreateEventRequest) => {
  return await apifetch(`orgs/${org}/events/`, {
    method: "POST",
    body: request,
  });
};

export const listEvents = async (org: string) => {
  return await apifetch(`orgs/${org}/events/`);
};

export const getEvent = async (org: string, slug: string) => {
  return await apifetch(`orgs/${org}/events/by-id/${slug}/`);
};

export const updateEvent = async (org: string, id: number, request: any) => {
  return await apifetch(`orgs/${org}/events/${id}/`, {
    method: "PUT",
    body: request,
  });
};

export const removeEvent = async (org: string, id: number) => {
  return await apifetch(`orgs/${org}/events/${id}/`, {
    method: "DELETE",
  });
};
