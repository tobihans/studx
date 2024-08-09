<script lang="ts" setup>
defineProps<{
  icon?: object;
  title?: string;
  action?: () => void;
  isActive?: () => boolean;
}>();
</script>

<template>
  <button
    class="menu-item"
    :class="{ 'is-active': isActive ? isActive() : null }"
    @click="action"
    :title="title"
  >
    <Component :is="icon"></Component>
  </button>
</template>

<style lang="scss">
.menu-item {
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background-color: transparent;
  border-radius: 0.4rem;
  padding: 0.25rem;
  margin-right: 0.25rem;

  @apply text-gray-800;

  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  &.is-active,
  &:hover {
    @apply bg-orange-400 text-gray-800;
  }
}
</style>
