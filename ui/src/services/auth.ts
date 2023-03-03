import type { SignInRequest, SignUpRequest } from "@/schemas/auth";
import { useUserStore } from "@/stores/user";
import { ofetch } from "ofetch";
import { apifetch } from "@/services";

export const signin = async (request: SignInRequest) => {
  const userStore = useUserStore();
  const { token } = await ofetch(
    `${import.meta.env.VITE_API_ENDPOINT}/auth/signin`,
    {
      method: "POST",
      body: request,
    }
  );

  userStore.token = token;
  localStorage.setItem("_tok", token);
};

export const signup = async (request: SignUpRequest) => {
  await ofetch(`${import.meta.env.VITE_API_ENDPOINT}/auth/signup`, {
    method: "POST",
    body: request,
  });
};

export const logout = async () => {
  await apifetch(`/auth/logout`, {
    method: "POST",
  });
  localStorage.removeItem("_tok");
};

export const logoutAll = async () => {
  await apifetch(`/auth/logout-all`, {
    method: "POST",
  });
  localStorage.removeItem("_tok");
};

export const whoAmI = async () => {
  return await apifetch(`/auth/whoami`);
};
