<script lang="ts" setup>
const props = defineProps({
  title: {
    type: String,
    required: false,
  },
  wid: String,
});

const src = `${import.meta.env.VITE_WHITEBOARD_ENDPOINT}?whiteboardid=${
  props.wid ?? "822f1c42-faa2-4fea-9807-680709d65045"
}`;
</script>

<template>
  <iframe
    :title="title ?? 'Whiteboard'"
    :src="src"
    class="border-3 border-gray-800 rounded-md outline-none w-full md:max-w-8/12 mx-auto mt-4 shadow-lg"
    style="aspect-ratio: 2 / 1.2"
  ></iframe>
</template>

<style scoped></style>
