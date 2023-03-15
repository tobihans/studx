<script lang="ts" setup>
import { signin, signup } from "@/services/auth";
import { ref } from "vue";
import { Form } from "vee-validate";
import FormField from "@/components/base/forms/FormField.vue";
import { useRoute, useRouter } from "vue-router";
import type { SignInRequest, SignUpRequest } from "@/schemas/auth";
import { SignInSchema, SignUpSchema } from "@/schemas/auth";
import { notifyError } from "@/utils";

const isSignupOperation = ref(useRoute().query.action === "signup");
const isSubmitDisabled = ref(false);
const router = useRouter();

const submit = async (request: unknown) => {
  isSubmitDisabled.value = true;

  try {
    if (isSignupOperation.value) {
      await signup(request as SignUpRequest);
      isSignupOperation.value = false;
    } else {
      await signin(request as SignInRequest);
      // TODO: Redirect user to where he was going before if it exists
      await router.push("/");
    }

    isSubmitDisabled.value = false;
  } catch {
    notifyError();
  }
};

const invalidSubmit = () => {
  isSubmitDisabled.value = true;
};
</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <header class="z-10 py-4 px-4 md:px-8 bg-white shadow-md dark:bg-gray-800">
      <div class="font-medium">StudX</div>
    </header>
    <Form v-if="!isSignupOperation" @submit="submit" @on-invalid-submit="invalidSubmit" :validation-schema="SignInSchema"
      class="my-8 mx-4 md:(w-full mx-auto max-w-5/12) bg-white rounded-lg shadow-md dark:bg-gray-800 text-sm">
      <h1 class="py-4 text-xl font-medium text-center">
        {{
          isSignupOperation ? "Create your account." : "Log into your account."
        }}
      </h1>
      <p class="text-center my-2">Track your class and your time easily.</p>
      <div class="px-4 py-3">
        <FormField class="my-4" name="username" placeholder="13368720" label="ID" />
        <FormField v-show="isSignupOperation" class="my-4" name="email"
          placeholder="kadoukpe-bignon-hans.tognon@etudiant.bj" label="Email" />
        <FormField class="my-4" name="password" type="password" placeholder="(*3jkjdnK@dj" label="Password" />
        <button :disabled="isSubmitDisabled"
          class="w-full px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple disabled:opacity-50 disabled:cursor-not-allowed">
          Sign In
        </button>
        <span class="py-3 or-ruler">or</span>
        <div class="flex justify-center">
          <button @click="isSignupOperation = true"
            class="mx-auto px-4 py-2 text-sm font-medium leading-5 text-purple-600 transition-colors duration-150 bg-gray-50 border border-purple-600 rounded-lg active:bg-gray-100 hover:bg-gray-100 focus:outline-none focus:shadow-outline-purple">
            Sign Up
          </button>
        </div>
      </div>
    </Form>
    <Form v-else @submit="submit" @on-invalid-submit="invalidSubmit" :validation-schema="SignUpSchema"
      class="my-8 mx-4 md:(w-full mx-auto max-w-5/12) bg-white rounded-lg shadow-md dark:bg-gray-800 text-sm">
      <h1 class="py-4 text-xl font-medium text-center">
        {{
          isSignupOperation ? "Create your account." : "Log into your account."
        }}
      </h1>
      <p class="text-center my-2">Track your class and your time easily.</p>
      <div class="px-4 py-3">
        <FormField class="my-4" name="username" placeholder="13368720" label="ID" />
        <FormField class="my-4" name="email" placeholder="kadoukpe-bignon-hans.tognon@etudiant.bj" label="Email" />
        <FormField class="my-4" name="password" type="password" placeholder="(*3jkjdnK@dj" label="Password" />
        <button :disabled="isSubmitDisabled"
          class="w-full px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple disabled:opacity-50 disabled:cursor-not-allowed">
          Sign Up
        </button>
        <span class="py-3 or-ruler">or</span>
        <div class="flex justify-center">
          <button @click="isSignupOperation = false"
            class="mx-auto px-4 py-2 text-sm font-medium leading-5 text-purple-600 transition-colors duration-150 bg-gray-50 border border-purple-600 rounded-lg active:bg-gray-100 hover:bg-gray-100 focus:outline-none focus:shadow-outline-purple">
            Sign In
          </button>
        </div>
      </div>
    </Form>
  </div>
</template>

<style scoped>
.or-ruler {
  @apply flex items-center w-full text-gray-600 dark: text-gray-400;
}

.or-ruler::before,
.or-ruler::after {
  content: "";
  @apply border-t border-gray-600 dark: border-gray-400 flex-1 m-0.5rem;
}
</style>
