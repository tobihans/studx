<script lang="ts" setup>
import { inject, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useOrgsStore } from "@/stores/organization";
import InlineDropdown from "@/components/base/InlineDropdown.vue";
import PhArrowLineLeft from "~icons/ph/arrow-line-left";
import PhCaretDown from "~icons/ph/caret-down";
import PhPlusFill from "~icons/ph/plus-fill";
import PhCheckFill from "~icons/ph/check-fill";
import PhBuildings from "~icons/ph/buildings";
import PhGear from "~icons/ph/gear";
import PhCalendar from "~icons/ph/calendar";
import PhCircleWavyQuestion from "~icons/ph/circle-wavy-question";
import PhPhoneCall from "~icons/ph/phone-call";

defineEmits(["start-tour"]);

const isSidebarOpen = inject("isSidebarOpen");
const isSidebarMinimized = inject("isSidebarMinimized");

const {
  org,
  organizations,
  count: totalOrganizations,
} = storeToRefs(useOrgsStore());
const route = useRoute();
const mobileSidebar = ref<HTMLElement>();

watch(isSidebarMinimized as any, (val) => {
  localStorage.setItem("sidebarMinimized", JSON.stringify(val));
});

onMounted(() => {
  (isSidebarMinimized as any).value =
    localStorage.getItem("sidebarMinimized") != null;
});
</script>

<template>
  <!-- Desktop sidebar -->
  <!-- TODO: Correct colors to match those of the mobile sidebar  -->
  <aside
    id="app-sidebar"
    class="z-20 hidden overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-800 md:block flex-shrink-0 shadow-md"
    :class="[isSidebarMinimized ? 'w-auto' : 'w-64']"
  >
    <div
      class="h-full flex flex-col justify-start py-4 text-gray-800 dark:text-gray-200"
      :class="{ 'px-1.5': isSidebarMinimized }"
    >
      <RouterLink
        :to="{
          name: 'home',
          params: {
            dashboardContextOrgSlug: route.params.dashboardContextOrgSlug,
          },
        }"
        :class="[isSidebarMinimized ? 'text-center' : 'ml-6 ']"
        class="inline-block w-full text-lg font-bold"
      >
        {{ isSidebarMinimized ? "SX" : "StudX" }}
      </RouterLink>

      <ul class="mt-3 bg-transparent">
        <li
          class="bg-gray-100 dark:bg-gray-600"
          :class="[
            isSidebarMinimized
              ? 'w-10 h-10 rounded flex justify-center items-center'
              : 'px-6 py-3',
          ]"
        >
          <button
            class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:(text-gray-600 dark:text-gray-300)"
            :class="{ 'justify-center': isSidebarMinimized }"
            @click="isSidebarMinimized = !isSidebarMinimized"
          >
            <PhArrowLineLeft
              :class="{ 'transform -rotate-y-180': isSidebarMinimized }"
            />
            <span :class="['ml-4', isSidebarMinimized ? 'hidden' : '']"
              >Collapse</span
            >
          </button>
        </li>
      </ul>
      <ul>
        <li
          id="app-sidebar--events"
          class="my-2"
          :class="[
            isSidebarMinimized
              ? 'w-10 h-10 rounded flex justify-center items-center bg-gray-100 dark:bg-gray-600'
              : 'px-6 py-3',
            route.name === 'home'
              ? `active-link${isSidebarMinimized ? '-mini' : ''}`
              : '',
          ]"
        >
          <RouterLink
            class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:(text-gray-600 dark:text-gray-300)"
            :class="{ 'justify-center': isSidebarMinimized }"
            :to="{
              name: 'home',
              params: {
                dashboardContextOrgSlug: route.params.dashboardContextOrgSlug,
              },
            }"
          >
            <PhCalendar class="w-5 h-5" aria-hidden="true" />
            <span class="ml-4" v-show="!isSidebarMinimized">Events</span>
          </RouterLink>
        </li>
        <li
          id="app-sidebar--meetings"
          class="my-2"
          :class="[
            isSidebarMinimized
              ? 'w-10 h-10 rounded flex justify-center items-center bg-gray-100 dark:bg-gray-600'
              : 'px-6 py-3',
            route.name === 'meetings'
              ? `active-link${isSidebarMinimized ? '-mini' : ''}`
              : '',
          ]"
        >
          <RouterLink
            class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:(text-gray-600 dark:text-gray-300)"
            :class="{ 'justify-center': isSidebarMinimized }"
            :to="{
              name: 'meetings',
              params: {
                dashboardContextOrgSlug: route.params.dashboardContextOrgSlug,
              },
            }"
          >
            <PhPhoneCall class="w-5 h-5" aria-hidden="true" />
            <span class="ml-4" v-show="!isSidebarMinimized">Meetings</span>
          </RouterLink>
        </li>
        <li
          v-if="String(org?.role) === 'admin'"
          id="app-sidebar--settings"
          class="my-2"
          :class="[
            isSidebarMinimized
              ? 'w-10 h-10 rounded flex justify-center items-center bg-gray-100 dark:bg-gray-600'
              : 'px-6 py-3',
            route.name === 'settings'
              ? `active-link${isSidebarMinimized ? '-mini' : ''}`
              : '',
          ]"
        >
          <RouterLink
            class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:(text-gray-600 dark:text-gray-300)"
            :class="{ 'justify-center': isSidebarMinimized }"
            :to="{
              name: 'settings',
              params: {
                dashboardContextOrgSlug: route.params.dashboardContextOrgSlug,
              },
            }"
          >
            <PhGear class="w-5 h-5" aria-hidden="true" />
            <span class="ml-4" v-show="!isSidebarMinimized">Settings</span>
          </RouterLink>
        </li>
      </ul>
      <!-- Help -->
      <ul class="mt-auto">
        <li
          class="my-2"
          :class="[
            isSidebarMinimized
              ? 'w-10 h-10 rounded flex justify-center items-center bg-gray-100 dark:bg-gray-600'
              : 'px-6 py-3',
          ]"
        >
          <button
            @click="$emit('start-tour')"
            class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:(text-gray-600 dark:text-gray-300)"
            :class="{ 'justify-center': isSidebarMinimized }"
          >
            <PhCircleWavyQuestion class="w-5 h-5" aria-hidden="true" />
            <span class="ml-4" v-show="!isSidebarMinimized">Help</span>
          </button>
        </li>
      </ul>
    </div>
  </aside>
  <!-- Mobile sidebar -->
  <!-- Backdrop -->
  <Transition
    enter-active-class="transition ease-in-out duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in-out duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      @click="isSidebarOpen = false"
      v-show="isSidebarOpen"
      class="fixed inset-0 z-10 flex items-end bg-black bg-opacity-50 sm:items-center sm:justify-center md:hidden"
    ></div>
  </Transition>

  <Transition
    enter-active-class="transition ease-in-out duration-150"
    enter-from-class="opacity-0 transform -translate-x-20"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in-out duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0 transform -translate-x-20"
  >
    <aside
      ref="mobileSidebar"
      class="fixed inset-y-0 z-20 flex-shrink-0 w-64 mt-14 overflow-y-auto bg-white dark:bg-gray-800 md:hidden"
      v-show="isSidebarOpen"
    >
      <div class="h-full flex flex-col py-4 text-gray-500 dark:text-gray-400">
        <a
          class="ml-6 text-lg font-bold text-gray-800 dark:text-gray-200"
          href="#"
        >
          StudX
        </a>
        <ul class="mt-6">
          <li class="relative px-6 py-3">
            <InlineDropdown>
              <button
                class="w-full text-sm flex justify-start items-center rounded focus:shadow-outline-purple focus:outline-none"
                aria-label="Dashboard context"
                aria-haspopup="true"
              >
                <img
                  class="object-cover w-8 h-8 rounded"
                  src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
                  alt=""
                  aria-hidden="true"
                />
                <span class="inline-flex flex-1 px-2">
                  {{ org?.org?.name || "Loading..." }}
                </span>
                <PhCaretDown class="ml-auto" />
              </button>
              <template #dropdown>
                <ul
                  class="p-2 mt-2 space-y-2 overflow-hidden text-sm font-medium text-gray-500 rounded-md shadow-inner bg-gray-50 dark:text-gray-400 dark:bg-gray-900"
                  aria-label="submenu"
                >
                  <li
                    v-for="organization in organizations"
                    :key="organization.slug"
                  >
                    <a
                      :href="
                        $router.resolve({
                          name: 'home',
                          params: {
                            dashboardContextOrgSlug: organization.slug,
                          },
                        }).href
                      "
                      class="inline-flex items-center w-full px-2 py-2 text-sm font-semibold transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                      <img
                        class="object-cover w-4 h-4 rounded mr-3"
                        src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
                        alt=""
                        aria-hidden="true"
                      />
                      <span>{{ organization.name }}</span>
                      <PhCheckFill
                        v-if="organization.slug === org?.org?.slug"
                        class="ml-auto w-4 h-4"
                      />
                    </a>
                  </li>
                  <li v-if="totalOrganizations > 5">
                    <RouterLink
                      to="/orgs"
                      class="inline-flex items-center w-full px-2 py-1 text-sm font-semibold transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                      <PhBuildings class="w-4 h-4 mr-3" />
                      <span>View all</span>
                    </RouterLink>
                  </li>
                  <li v-if="org.role === 'admin'">
                    <RouterLink
                      :to="{
                        name: 'new-org',
                        params: {
                          dashboardContextOrgSlug:
                            route.params.dashboardContextOrgSlug,
                        },
                      }"
                      class="inline-flex items-center w-full px-2 py-1 text-sm font-semibold transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                      <PhPlusFill class="w-4 h-4 mr-3" />
                      <span>Create organization</span>
                    </RouterLink>
                  </li>
                </ul>
              </template>
            </InlineDropdown>
          </li>
        </ul>
        <ul>
          <li class="relative px-6 py-3">
            <RouterLink
              :to="{
                name: 'home',
                params: {
                  dashboardContextOrgSlug: route.params.dashboardContextOrgSlug,
                },
              }"
              class="inline-flex items-center w-full text-sm font-semibold text-gray-800 transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 dark:text-gray-100"
            >
              <PhCalendar class="w-5 h-5" aria-hidden="true" />
              <span class="ml-4">Events</span>
            </RouterLink>
          </li>
          <li class="relative px-6 py-3">
            <RouterLink
              :to="{
                name: 'meetings',
                params: {
                  dashboardContextOrgSlug: route.params.dashboardContextOrgSlug,
                },
              }"
              class="inline-flex items-center w-full text-sm font-semibold text-gray-800 transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 dark:text-gray-100"
            >
              <PhPhoneCall class="w-5 h-5" aria-hidden="true" />
              <span class="ml-4">Meetings</span>
            </RouterLink>
          </li>
          <li class="relative px-6 py-3" v-show="String(org?.role) === 'admin'">
            <RouterLink
              :to="{
                name: 'settings',
                params: {
                  dashboardContextOrgSlug: route.params.dashboardContextOrgSlug,
                },
              }"
              class="inline-flex items-center w-full text-sm font-semibold text-gray-800 transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 dark:text-gray-100"
            >
              <PhGear class="w-5 h-5" aria-hidden="true" />
              <span class="ml-4">Settings</span>
            </RouterLink>
          </li>
          <li></li>
        </ul>
        <!-- Help -->
        <ul class="mt-auto">
          <li class="relative px-6 py-3">
            <button
              @click="$emit('start-tour')"
              class="inline-flex items-center w-full text-sm font-semibold text-gray-800 transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 dark:text-gray-100"
            >
              <PhCircleWavyQuestion class="w-5 h-5" aria-hidden="true" />
              <span class="ml-4">Help</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.active-link > * {
  @apply text-purple-700;
}

.active-link-mini {
  @apply border-l border-2.5px border-purple-400;
}

.active-link-mini svg {
  @apply text-purple-500;
}
</style>
