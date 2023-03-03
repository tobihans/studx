<script setup lang="ts">
import { provide, ref } from "vue";
import { useTour } from "@/utils/composables";
import HeaderView from "./HeaderView.vue";
import SidebarView from "./SidebarView.vue";

import "@/assets/css/shepherd.css";

const isSidebarOpen = ref(false);
const isSidebarMinimized = ref(false);

provide("isSidebarOpen", isSidebarOpen);
provide("isSidebarMinimized", isSidebarMinimized);

const tour = useTour();
</script>

<template>
  <SidebarView @start-tour="() => tour.start()" />
  <div class="flex flex-col flex-1 w-full">
    <HeaderView />
    <RouterView name="default" />
  </div>
</template>

<style scoped></style>
