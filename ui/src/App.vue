<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from "vue";
import { getThemeFromLocalStorage } from "./utils";

const theme = ref<"light" | "dark">("light");
const dark = computed(() => theme.value == "dark");

provide("theme", theme);
provide("dark", dark);

watch(dark, (dark) =>
  dark
    ? document.documentElement.classList.add("dark")
    : document.documentElement.classList.remove("dark")
);

onMounted(() => {
  theme.value = getThemeFromLocalStorage();
});
</script>

<template>
  <RouterView name="default" />
  <div id="modal-view"></div>
  <notifications position="bottom right" width="100%" class="" />
</template>

<style src="@/assets/css/base.css"></style>
<style src="@/assets/css/components.css"></style>
