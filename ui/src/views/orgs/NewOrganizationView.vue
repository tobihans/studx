<script setup lang="ts">
import { Form } from "vee-validate";
import FormField from "@/components/base/forms/FormField.vue";
import { createOrganization } from "@/services/organization";
import { notify } from "@kyvg/vue3-notification";
import {
  CreateOrganizationSchema,
  type CreateOrganizationRequest,
} from "@/schemas/organization";
import { useRouter } from "vue-router";

const router = useRouter();

const onSubmit = async (request: unknown) => {
  try {
    const org = await createOrganization(request as CreateOrganizationRequest);

    location.assign(
      router.resolve({
        name: "home",
        params: { dashboardContextOrgSlug: org.slug },
      }).href
    );
  } catch (error) {
    console.log(error);
    notify({
      title: "Error",
      text: "An error occured. Please, try later.",
      type: "error",
    });
  }
};
</script>

<template>
  <div class="w-full overflow-y-auto">
    <div class="md:(mx-auto max-w-6/12) my-8 px-4">
      <Form @submit="onSubmit" :validation-schema="CreateOrganizationSchema">
        <header class="py-4">
          <h1 class="text-xl font-medium">Create a new organization</h1>
          <p class="py-2">
            An organization groups users, tasks, meeting schedules and wikis.
          </p>
        </header>
        <div>
          <FormField
            class="my-4"
            name="name"
            label="Name your organization"
            placeholder="beautiful-dolphin"
          />
          <FormField
            class="my-4"
            name="about"
            label="Description"
            :required="false"
          />
          <span>
            <button @submit.prevent class="btn">Create</button>
          </span>
        </div>
      </Form>
    </div>
  </div>
</template>

<style scoped></style>
