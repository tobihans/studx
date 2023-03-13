<script setup lang="ts">
import { Field, Form } from "vee-validate";
import FormField from "@/components/base/forms/FormField.vue";
import {
  addUsertoOrganization,
  getOrganizationMembers,
  removeUserFromOrganization,
  updateOrganization,
  updateOrgPicture,
  addUsersInBulktoOrganization
} from "@/services/organization";
import { notifyError } from "@/utils";
import { useOrgsStore } from "@/stores/organization";
import {
  type CreateOrganizationRequest,
  CreateOrganizationSchema,
} from "@/schemas/organization";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { format as formatTime } from "timeago.js";
import PhTrash from "~icons/ph/trash";
import PhClock from "~icons/ph/clock";
import { useFileDialog } from "@vueuse/core";
import OrganizationPlaceholderURL from "@/assets/img/organization.svg";
import UserPlaceholderURL from "@/assets/img/user.svg";

const { org } = storeToRefs(useOrgsStore());
const members = ref();
const users = computed(() =>
  members.value?.results.map((membership: any) => {
    // Flat the object
    const result = {
      ...membership.user,
      ...membership,
      joinedAt: formatTime(membership.joinedAt),
    };
    delete result["user"];

    return result;
  })
);

const { files: profilePicture, open: openProfilePicker } = useFileDialog({
  accept: "image/png,image/jpeg,image/bmp",
});

watch(profilePicture, (files) => {
  if (files) {
    const formData = new FormData();
    formData.append("image", files[0]);
    updateOrgPicture(org.value?.org?.slug, formData).then(() =>
      location.reload()
    );
  }
});

const onUpdateOrgParams = async (request: unknown) => {
  try {
    await updateOrganization(
      org.value?.org.slug,
      request as Partial<CreateOrganizationRequest>
    );
  } catch {
    notifyError();
  }
};

const addMember = async (request: unknown) => {
  try {
    members.value?.results.push(
      await addUsertoOrganization(
        org.value.org?.slug,
        request as { username: string; role: string }
      )
    );
    members.value.count++;
  } catch {
    notifyError();
  }
};

const removeMember = async (username: string) => {
  try {
    await removeUserFromOrganization(org.value?.org?.slug, username);
    const index = members.value?.results.findIndex(
      (membership: any) => membership.username != username
    );

    if (index > -1) members.value?.results.splice(index, 1);
    members.value.count--;
  } catch {
    notifyError();
  }
};

// Add members in bulk
const { files: usersCSVFiles, open: openCSVPicker } = useFileDialog({
  accept: "text/csv",
});

watch(usersCSVFiles, async (files) => {
  if (files) {
    const form = new FormData();
    form.append("file", files[0]);
    try {
      await addUsersInBulktoOrganization(org.value?.org?.slug, form);
    }
    catch {
        notifyError();
    }
  }
});

onMounted(async () => {
  members.value = await getOrganizationMembers(org.value.org?.slug);
});
</script>
<template>
  <div class="w-full overflow-y-auto">
    <div class="md:(mx-auto max-w-6/12) my-8 px-4">
      <header class="py-4">
        <h1 class="text-xl font-medium">Settings</h1>
        <p class="py-2">
          Configure all the essential aspects of your organization.
        </p>
      </header>
      <div class="mt-2 mb-4">
        <h2>General</h2>
        <hr class="my-2" />
      </div>
      <Form
        @submit="onUpdateOrgParams"
        :validation-schema="CreateOrganizationSchema"
      >
        <div class="my-4 flex gap-3 items-end">
          <img
            class="object-cover w-24 h-24 rounded"
            :src="org?.org?.picture || OrganizationPlaceholderURL"
            alt=""
            aria-hidden="true"
          />
          <button
            @click="() => openProfilePicker()"
            type="button"
            class="btn h-auto bg-transparent text-purple-600 border-purple-600 focus:bg-transparent px-3 py-1.5 hover:text-white"
          >
            Change
          </button>
        </div>
        <FormField
          class="my-4"
          name="name"
          label="Name"
          placeholder="beautiful-dolphin"
          :value="org.org?.name"
        />
        <FormField
          class="my-4"
          name="about"
          label="Description"
          :value="org.org?.about"
          :required="false"
        />
        <span>
          <button @submit.prevent class="btn">Save</button>
        </span>
      </Form>
      <div class="mt-8 mb-4">
        <h2>Members {{ `(${members?.count})` }}</h2>
        <hr class="my-2" />
      </div>
      <p class="text-sm">Add a new member</p>
      <Form
        @submit="addMember"
        class="my-4 flex gap-3 justify-between items-end"
      >
        <FormField
          name="username"
          label="Username"
          placeholder="cxx-qt"
          style="flex-grow: 2"
        />
        <Field
          as="select"
          name="role"
          value="student"
          class="flex-1 block mt-1 text-sm dark:text-gray-300 dark:border-gray-600 dark:bg-gray-700 form-select focus:border-purple-400 focus:outline-none focus:shadow-outline-purple dark:focus:shadow-outline-gray"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </Field>
        <span>
          <button @submit.prevent class="btn">Add</button>
        </span>
      </Form>
      <button
        type="button"
        class="btn h-auto bg-transparent text-purple-600 border-purple-600 focus:bg-transparent px-3 py-1.5 hover:text-white"
        @click.prevent="() => openCSVPicker()"
      >
        Add in bulk
      </button>
      <div>
        <div v-for="user in users" :key="user">
          <div
            class="my-4 flex justify-between items-center p-2 bg-white rounded shadow-xs dark:bg-gray-700"
          >
            <div class="mr-4 bg-gray-100 rounded dark:bg-gray-500">
              <img
                class="object-cover w-12 h-12 rounded"
                :src="UserPlaceholderURL"
                alt=""
                aria-hidden="true"
              />
            </div>
            <div class="flex-1">
              <p class="mb-1 font-medium text-gray-600 dark:text-gray-400">
                <span class="mr-3">{{ user.username }}</span>
                <span
                  class="border border-purple-500 uppercase text-purple-500 dark:(border-purple-300 text-purple-300) inline-flex items-center px-1 py-0.5 text-xs font-semibold rounded-sm"
                >
                  {{ user?.role }}
                </span>
              </p>
              <div
                class="flex items-center text-sm text-gray-700 dark:text-gray-200"
              >
                <PhClock class="w-4 h-4 mr-1" />
                <span>Joined {{ user.joinedAt }}</span>
              </div>
            </div>
            <button
              @click.prevent="removeMember(user.username)"
              class="p-2 ml-4 text-red-500 rounded-sm dark:text-red-100"
            >
              <PhTrash class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div class="text-red-600 dark:text-red-500 mt-8 mb-4">
        <h2>Danger Zone</h2>
        <hr class="my-2" />
      </div>
      <p class="text-sm">
        This actions cannot be undone. Please, think carefully before.
      </p>
      <div class="my-6 flex gap-3">
        <button
          type="button"
          class="btn h-auto bg-transparent text-red-600 border-red-600 focus:bg-transparent px-3 py-1.5"
        >
          Archive organization
        </button>
        <button
          type="button"
          class="btn h-auto bg-transparent text-red-600 border-red-600 focus:bg-transparent px-3 py-1.5"
        >
          Delete organization
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
