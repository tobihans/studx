import type { CreateOrganizationRequest } from "@/schemas/organization";
import { apifetch } from "@/services";

export const createOrganization = async (
  request: CreateOrganizationRequest
) => {
  return await apifetch("orgs/", {
    method: "POST",
    body: request,
  });
};

export const updateOrganization = async (
  org: string,
  request: Partial<CreateOrganizationRequest>
) => {
  return await apifetch(`orgs/${org}/`, {
    method: "PUT",
    body: request,
  });
};

export const getUserOrganizations = async ({ limit }: any) => {
  return await apifetch("orgs/", {
    query: { limit: limit ?? 0 },
  });
};

export const getUserMembership = async (slug: string, username: string) => {
  return await apifetch(`orgs/${slug}/membership/${username}`);
};

export const getOrganizationMembers = async (slug: string) => {
  return await apifetch(`/orgs/${slug}/members/`);
};

export const addUsertoOrganization = async (
  slug: string,
  request: {
    username: string;
    role: string;
  }
) => {
  return await apifetch(`orgs/${slug}/members/`, {
    method: "POST",
    body: request,
  });
};

export const removeUserFromOrganization = async (
  slug: string,
  username: string
) => {
  return await apifetch(`orgs/${slug}/membership/${username}`, {
    method: "DELETE",
  });
};

export const updateOrgPicture = async (slug: string, form: FormData) => {
  return apifetch(`orgs/${slug}/picture/`, {
    method: "POST",
    body: form,
  });
};
