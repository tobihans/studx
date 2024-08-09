<script lang="ts" setup>
import PhUserDuotone from "~icons/ph/user-duotone";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRoomStore } from "@/stores/room";
import { useUserStore } from "@/stores/user";

const { user } = storeToRefs(useUserStore());
const { participants } = storeToRefs(useRoomStore());
const list = computed(() => [
  { name: `${user.value?.username} (you)`, sessionId: null },
  ...participants.value,
]);
const count = computed(() => participants.value.length);
</script>

<template>
  <div
    class="p-1 h-full w-full flex flex-wrap overflow-y-auto"
    :class="{
      'justify-center items-center': count <= 10,
      'justify-start items-center p-3': count > 10,
    }"
  >
    <div
      v-for="participant in list"
      :key="participant.sessionId ?? ''"
      class="mx-3 flex flex-col items-center"
    >
      <!-- HACK: ?? ''  is a quickfix to avoid ts compiler warnings during builds.-->
      <PhUserDuotone
        class="text-gray-700 dark:text-gray-200"
        :class="{
          'w-20 h-20': count <= 10,
          'w-14 h-14': count > 10,
          'w-10 h-10': count > 20,
        }"
      />
      <p class="my-3 text-sm">{{ participant.name }}</p>
    </div>
  </div>
</template>

<style scoped></style>
