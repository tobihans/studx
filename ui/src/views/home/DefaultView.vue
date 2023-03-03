<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user";

const { user } = storeToRefs(useUserStore());
</script>

<template>
  <main class="h-full overflow-y-auto">
    <!--    <md:mx-auto -->
    <div class="container px-6 mx-auto grid">
      <h2 class="my-6 text-2xl font-semibold text-gray-700 dark:text-gray-200">
        Welcome {{ user?.username ?? "" }}
      </h2>
    </div>
  </main>
</template>
