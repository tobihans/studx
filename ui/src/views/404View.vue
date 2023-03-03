<script lang="ts" setup></script>

<template>
  <main class="h-screen w-full flex flex-col justify-center items-center">
    <h1 class="text-9xl font-extrabold text-gray-900 dark:text-white">404</h1>
    <div
      class="text-white bg-purple-600 px-2 text-sm rounded transform rotate-12 absolute"
    >
      Page Not Found
    </div>
    <button class="mt-5">
      <a
        class="relative inline-block text-sm font-medium text-purple-600 group active:text-orange-500 focus:outline-none focus:ring"
      >
        <span
          class="absolute inset-0 transition-transform translate-x-0.5 translate-y-0.5 bg-purple-600 group-hover:translate-y-0 group-hover:translate-x-0"
        ></span>

        <span
          class="rounded relative block px-6 py-3 text-gray-100 bg-purple-600 border border-current"
        >
          <RouterLink to="/">Go Home</RouterLink>
        </span>
      </a>
    </button>
  </main>
</template>

<style scoped></style>
