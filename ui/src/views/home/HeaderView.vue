<script lang="ts" setup>
import { inject, ref } from "vue";
import { setThemeToLocalStorage, useResetStore } from "@/utils";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { logout } from "@/services/auth";
import { useOrgsStore } from "@/stores/organization";
import DropDown from "@/components/base/DropDown.vue";
import PhCaretDown from "~icons/ph/caret-down";
import PhPlusFill from "~icons/ph/plus-fill";
import PhCheckFill from "~icons/ph/check-fill";
import PhBuildings from "~icons/ph/buildings";
import PhMenu from "~icons/ph/list";
import PhX from "~icons/ph/x";
import PhBell from "~icons/ph/bell";
import PhCloudSun from "~icons/ph/cloud-sun";
import PhCloudMoon from "~icons/ph/cloud-moon";
import PhSignOut from "~icons/ph/sign-out";
import PhUser from "~icons/ph/user";
import PhMagnifyingGlass from "~icons/ph/magnifying-glass";
import NotificationsModal from "@/components/modals/NotificationsModal.vue";
import UserPlaceholderURL from "@/assets/img/user.svg";
import OrganizationPlaceholderURL from "@/assets/img/organization.svg";
import { useUserStore } from "@/stores/user";
import { useNotificationsStore } from "@/stores/notifications";

const isSidebarOpen = inject("isSidebarOpen");
const theme = inject("theme");
const dark = inject("dark");

const {
  org,
  organizations,
  count: totalOrganizations,
} = storeToRefs(useOrgsStore());
const { unread } = storeToRefs(useNotificationsStore());
const { user } = storeToRefs(useUserStore());
const desktopNotifications = ref<typeof NotificationsModal>();
const mobileNotifications = ref<typeof NotificationsModal>();

const route = useRoute();

const toggleTheme = () => {
  (theme as any).value = (dark as any).value ? "light" : "dark";
  setThemeToLocalStorage((theme as any).value);
};

const signOut = () => {
  logout()
    .then(() => {
      useResetStore()?.all();
      location.href = "/";
    })
    .catch(() => {
      alert("An error occured");
    });
};
</script>

<template>
  <header id="app-header" class="z-10 py-2 bg-white shadow-md dark:bg-gray-800">
    <div
      class="container flex items-center justify-between h-full px-3 md:px-6 mx-auto"
    >
      <!-- Mobile hamburger -->
      <button
        class="p-1 mr-5 -ml-1 rounded-md md:hidden focus:outline-none focus:shadow-outline-purple"
        @click="isSidebarOpen = !isSidebarOpen"
        aria-label="Menu"
      >
        <Component :is="isSidebarOpen ? PhX : PhMenu" class="w-6 h-6" />
      </button>
      <div class="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Hi {{ user?.username ?? "" }} !
      </div>
      <!-- Search input -->
      <div class="flex justify-center flex-1 lg:mr-32">
        <div
          class="hidden relative w-full max-w-xl mr-6 focus-within:text-purple-500"
        >
          <div class="absolute inset-y-0 flex items-center pl-2">
            <PhMagnifyingGlass
              class="w-4 h-4 text-purple-600 dark:text-purple-300"
            />
          </div>
          <input
            class="w-full pl-8 pr-2 text-sm text-gray-700 placeholder-gray-600 bg-gray-100 border-0 rounded-md dark:placeholder-gray-500 dark:focus:shadow-outline-gray dark:focus:placeholder-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:placeholder-gray-500 focus:bg-white focus:border-purple-300 focus:outline-none focus:shadow-outline-purple form-input"
            type="text"
            placeholder="Search ..."
            aria-label="Search"
          />
        </div>
      </div>
      <ul class="flex items-center flex-shrink-0 md:space-x-6">
        <li class="hidden md:flex items-center" v-if="org">
          <DropDown placement="bottom">
            <button
              id="app-header--context-switcher"
              class="max-w-48 text-xs flex justify-center items-center rounded focus:shadow-outline-purple focus:outline-none"
              aria-label="Dashboard context"
              aria-haspopup="true"
            >
              <img
                class="object-cover w-8 h-8 rounded"
                :src="org?.org?.picture || OrganizationPlaceholderURL"
                alt=""
                aria-hidden="true"
              />
              <span class="inline-flex flex-1 justify-center items-center px-2">
                {{ org?.org?.name || "Loading..." }}
              </span>
              <PhCaretDown />
            </button>
            <template #dropdown>
              <ul
                class="w-56 p-2 space-y-2 text-gray-600 bg-white border border-gray-100 rounded-md shadow-md dark:border-gray-700 dark:text-gray-300 dark:bg-gray-700"
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
                        params: { dashboardContextOrgSlug: organization.slug },
                      }).href
                    "
                    class="inline-flex items-center w-full px-2 py-1 text-sm font-semibold transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <img
                      class="object-cover w-4 h-4 rounded mr-3"
                      :src="organization.picture || OrganizationPlaceholderURL"
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
                  <!-- 5 being the default limit fetched -->
                  <!-- TODO: Modal to show all available orgs -->
                  <button
                    class="inline-flex items-center w-full px-2 py-1 text-sm font-semibold transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <PhBuildings class="w-4 h-4 mr-3" />
                    <span>View all</span>
                  </button>
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
          </DropDown>
        </li>
        <!-- Notifications menu -->
        <li class="hidden md:block">
          <NotificationsModal ref="desktopNotifications">
            <button
              id="app-header--notifications"
              @click="desktopNotifications?.modal.open()"
              class="relative inline-block align-middle rounded-md focus:outline-none focus:shadow-outline-purple"
              aria-label="Notifications"
            >
              <PhBell class="w-5 h-5" />
              <!-- Notification badge -->
              <span
                aria-hidden="true"
                v-show="(unread?.count ?? 0) > 0"
                class="absolute top-0 right-0 inline-block w-2.5 h-2.5 transform translate-x-0.25 -translate-y-0.5 bg-purple-600 border-2 border-white rounded-full dark:border-gray-800"
              ></span>
            </button>
          </NotificationsModal>
        </li>
        <!-- Profile menu -->
        <li>
          <DropDown placement="bottom-end" :offset="[0, 10]">
            <button
              id="app-header--user-profile"
              class="align-middle rounded focus:shadow-outline-purple focus:outline-none"
              aria-label="Account"
              aria-haspopup="true"
            >
              <img
                class="object-cover w-8 h-8 rounded"
                :src="user?.picture || UserPlaceholderURL"
                alt=""
                aria-hidden="true"
              />
            </button>

            <template #dropdown>
              <ul
                class="w-56 p-2 space-y-2 text-gray-600 bg-white border border-gray-100 rounded-md shadow-md dark:border-gray-700 dark:text-gray-300 dark:bg-gray-700"
                aria-label="submenu"
              >
                <!-- User role in current org -->
                <li class="flex float-right">
                  <div
                    class="border border-purple-500 uppercase text-purple-500 dark:(border-purple-300 text-purple-300) inline-flex items-center px-1 py-0.5 text-xs font-semibold rounded-sm"
                  >
                    <span>{{ org?.role }}</span>
                  </div>
                </li>
                <li class="flex md:hidden">
                  <NotificationsModal ref="mobileNotifications">
                    <button
                      @click="mobileNotifications?.modal.open()"
                      class="relative inline-flex items-center w-full px-2 py-1 text-sm font-semibold transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                      aria-label="Notifications"
                    >
                      <span class="relative mr-3">
                        <PhBell class="w-4 h-4" />
                        <span
                          aria-hidden="true"
                          class="absolute top-0 right-0 inline-block w-2.5 h-2.5 transform translate-x-0.25 -translate-y-0.25 bg-purple-500 border-2 border-white rounded-full dark:border-gray-800"
                        ></span>
                      </span>
                      <span>Notifications</span>
                    </button>
                  </NotificationsModal>
                </li>
                <li class="flex">
                  <button
                    class="inline-flex items-center w-full px-2 py-1 text-sm font-semibold transition-colors duration-150 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <PhUser class="w-4 h-4 mr-3" />
                    <span>Profile</span>
                  </button>
                </li>
                <!-- Theme toggle -->
                <li class="flex">
                  <button
                    @click="toggleTheme"
                    aria-label="Toggle color mode"
                    class="inline-flex items-center w-full px-2 py-1 text-sm font-semibold transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <PhCloudMoon
                      :class="['w-4', 'h-4', 'mr-3', dark ? 'hidden' : '']"
                    />
                    <PhCloudSun
                      :class="['w-4', 'h-4', 'mr-3', !dark ? 'hidden' : '']"
                    />
                    <span>{{ dark ? "Light theme" : "Dark theme" }}</span>
                  </button>
                </li>
                <li class="flex">
                  <button
                    @click="signOut"
                    class="inline-flex items-center w-full px-2 py-1 text-sm font-semibold transition-colors duration-150 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <PhSignOut class="w-4 h-4 mr-3" />
                    <span>Log out</span>
                  </button>
                </li>
              </ul>
            </template>
          </DropDown>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped></style>
