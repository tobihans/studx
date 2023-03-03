<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoomStore } from "@/stores/room";

const { screenStream } = storeToRefs(useRoomStore());

const screen = ref<HTMLVideoElement>();

watch(screenStream, (newVal) => {
  if (newVal) screen.value!.srcObject = newVal as MediaStream;
});

onMounted(() => {
  screen.value!.onloadedmetadata = () => screen.value!.play();

  if (screenStream) {
    screen.value!.srcObject = screenStream.value as MediaStream;
  }
});
</script>

<template>
  <video
    ref="screen"
    muted
    class="w-full md:max-w-8/12 h-auto mx-auto mt-6 rounded shadow-md border"
  ></video>
</template>

<style scoped></style>
