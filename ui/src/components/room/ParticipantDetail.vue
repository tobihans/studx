<script lang="ts" setup>
import PhUser from "~icons/ph/user";
import PhDotsThreeVerticalFill from "~icons/ph/dots-three-vertical-fill";
import { onMounted, ref } from "vue";
import tippy, { sticky } from "tippy.js";

defineProps({
  name: String,
});

const optionsBtn = ref<HTMLButtonElement>();
const options = ref<HTMLDivElement>();

onMounted(() => {
  tippy(optionsBtn.value as HTMLButtonElement, {
    content: options.value,
    hideOnClick: true,
    interactive: true,
    offset: [0, 5],
    placement: "bottom-end",
    plugins: [sticky],
    sticky: true,
    trigger: "click",
  });
});
</script>

<template>
  <div class="h-10 my-1.5 w-full bg-white flex">
    <div
      class="w-10 h-full flex justify-center items-center bg-gray-100 rounded"
    >
      <PhUser class="text-lg text-gray-700" />
    </div>
    <div
      style="flex-grow: 1"
      class="px-1 py-0.5 flex justify-start items-center"
    >
      <span>{{ name }}</span>
      <!--      <PhMicrophoneLight v-if="1" class="ml-1 text-red-500" />-->
      <!--      <PhMicrophoneSlashLight v-else class="ml-1 text-red-500" />-->
    </div>
    <button
      type="button"
      class="w-12 h-full flex justify-center items-center"
      ref="optionsBtn"
    >
      <PhDotsThreeVerticalFill class="text-lg text-gray-700" />
    </button>
    <div
      ref="options"
      class="w-40 min-h-10 rounded-sm shadow border bg-white divider-y divider-gray-500 text-sm"
    >
      <!-- Actions are hidden for the moment -->
      <button
        class="hidden text-left px-1 h-10 w-full bg-gray-100 hover:bg-gray-200"
      >
        Mute
      </button>
      <button
        class="hidden text-left px-1 h-10 w-full bg-gray-100 hover:bg-gray-200 text-red-500"
      >
        Remove from call
      </button>
    </div>
  </div>
</template>

<style scoped></style>
