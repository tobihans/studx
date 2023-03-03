import { onBeforeUnmount, onMounted } from "vue";
import { getActivePinia } from "pinia";
import type { Pinia, Store } from "pinia";
import { notify } from "@kyvg/vue3-notification";

export const getThemeFromLocalStorage = (): "light" | "dark" => {
  if (window.localStorage.getItem("theme")) {
    return <"light" | "dark">window.localStorage.getItem("theme");
  }

  return !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const setThemeToLocalStorage = (value: "light" | "dark") => {
  window.localStorage.setItem("theme", value);
};

export const useClickOutside = (element: Element, callback: () => void) => {
  const listener = (event: Event) => {
    if (
      !event.composedPath().includes(element) &&
      typeof callback === "function"
    )
      callback();
  };

  onMounted(() => {
    window.addEventListener("click", listener);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("click", listener);
  });
};

interface ExtendedPinia extends Pinia {
  _s: Map<string, Store>;
}

// Reset Pinia stores
// See https://lobotuerto.com/notes/til-how-to-reset-all-stores-in-pinia
export const useResetStore = () => {
  const pinia = getActivePinia() as ExtendedPinia;

  // Fails silently if there is no store
  if (!pinia) {
    return;
  }

  const resetStores: Record<string, () => void> = {};

  pinia._s.forEach((store, name) => {
    resetStores[name] = () => {
      store.$dispose();
      delete pinia.state.value[store.$id];
    };
  });

  resetStores.all = () =>
    pinia._s.forEach((store) => {
      store.$dispose();
      delete pinia.state.value[store.$id];
    });

  return resetStores;
};

export const notifyError = () =>
  notify({
    title: "Error",
    text: "An error occured. Please, try later.",
    type: "error",
  });
