<script setup lang="ts">
import { ref } from "vue";

const visible = ref(false);

const open = () => {
  visible.value = true;
};
const close = () => {
  visible.value = false;
};

const onBackdropClick = (e: Event) => {
  if (e.target === e.currentTarget) close();
};

defineExpose({ visible, open, close });
</script>

<template>
  <slot></slot>
  <Transition
    enter-active-class="transition ease-out duration-150"
    enter-from-class="opacity-0 transform translate-y-1/2"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0  transform translate-y-1/2"
  >
    <Teleport to="#modal-view">
      <div
        v-show="visible"
        @click="onBackdropClick"
        class="fixed inset-0 z-30 flex items-end bg-black bg-opacity-50 sm:items-center sm:justify-center"
      >
        <slot name="modal"></slot>
      </div>
    </Teleport>
  </Transition>
</template>

<style scoped></style>
