<script lang="ts" setup>
import { useField } from "vee-validate";
import { toRef } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "text",
  },
  value: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: false,
    default: "",
  },
  required: {
    type: Boolean,
    required: false,
    default: true,
  },
  successMessage: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
});

const name = toRef(props, "name");

const {
  value: inputValue,
  errorMessage,
  handleBlur,
  handleChange,
  // meta,
} = useField(name, undefined, {
  initialValue: props.value,
});
</script>

<template>
  <label class="block text-sm">
    <span class="text-gray-700 dark:text-gray-400" v-show="label">
      <span>{{ label }}</span>
      <component
        :is="required ? 'sup' : 'span'"
        class="mx-0.5"
        :class="[required ? 'text-red-600' : '']"
      >
        {{ required ? "*" : "(optional)" }}
      </component>
    </span>
    <input
      :name="name"
      :id="name"
      :type="type"
      :value="inputValue"
      :placeholder="placeholder"
      :required="required"
      @input="handleChange"
      @blur="handleBlur"
      class="form-input block w-full mt-1 text-sm border-purple-600 dark:text-gray-300 dark:bg-gray-700 focus:border-purple-400 focus:outline-none focus:shadow-outline-purple"
    />
    <!-- class="form-input block w-full mt-1 text-sm border-red-600 dark:text-gray-300 dark:bg-gray-700 focus:border-red-400 focus:outline-none focus:shadow-outline-red form-input" /> -->
    <span class="text-xs text-red-600 dark:text-red-400" v-show="errorMessage">
      {{ errorMessage }}
    </span>
  </label>
</template>

<style scoped>
.form-input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: #fff;
  border-color: #e2e8f0;
  border-width: 1px;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  padding-right: 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
}
</style>
