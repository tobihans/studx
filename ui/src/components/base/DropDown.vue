<script lang="ts" setup>
import { onMounted, ref } from "vue";
import tippy, { sticky } from "tippy.js";

// INFO: Thinking that details and summary tags plus some customizations will do the job

const trigger = ref();
const dropdown = ref();
const props = defineProps<{
  placement?: any;
  offset?: [number, number];
}>();

onMounted(() => {
  tippy(trigger.value as Element, {
    content: dropdown.value,
    hideOnClick: true,
    interactive: true,
    offset: props.offset ?? [0, 5],
    placement: props.placement ?? "right",
    plugins: [sticky],
    sticky: true,
    trigger: "click",
  });
});
</script>

<template>
  <div>
    <div class="inline-flex" ref="trigger">
      <slot></slot>
    </div>
    <div class="inline-flex" ref="dropdown">
      <slot name="dropdown"></slot>
    </div>
  </div>
</template>

<style scoped></style>
