<script lang="ts" setup>
import { ref } from "vue";

const visible = ref(false);
const dropdown = ref();
</script>

<template>
  <div>
    <div class="inline-block w-full" @click="visible = !visible">
      <slot></slot>
    </div>
    <Transition
      enter-active-class="transition-all ease-in-out duration-300"
      enter-from-class="opacity-25 max-h-0"
      enter-to-class="opacity-100 max-h-xl"
      leave-active-class="transition-all ease-in-out duration-300"
      leave-from-class="opacity-100 max-h-xl"
      leave-to-class="opacity-0 max-h-0"
      :duration="0.2"
    >
      <div class="inline-block w-full" ref="dropdown" v-show="visible">
        <slot name="dropdown"></slot>
      </div>
    </Transition>
  </div>
</template>

<style scoped></style>
