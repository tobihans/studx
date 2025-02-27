import { useUserStore } from "@/stores/user";
import { ofetch } from "ofetch";

import.meta.env.STUDX_UI_API_ENDPOINT =
  import.meta.env.STUDX_UI_API_ENDPOINT ?? "/api";

const baseURL = import.meta.env.STUDX_UI_API_ENDPOINT.endsWith("/")
  ? import.meta.env.STUDX_UI_API_ENDPOINT
  : import.meta.env.STUDX_UI_API_ENDPOINT + "/";

export const apifetch = ofetch.create({
  baseURL,
  onRequest({ options }) {
    const userStore = useUserStore();
    const headers = options?.headers
      ? new Headers(options.headers)
      : new Headers();

    if (!headers.has("Authorization") && userStore.token)
      headers.set("Authorization", `Token ${userStore.token}`);

    options.headers = headers;
  },
});
