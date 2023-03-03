<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = defineProps({
  tag: String,
  contenteditable: {
    type: [Boolean, String],
    default: true,
  },
  modelValue: String,
  noHtml: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["enter", "update:modelValue"]);

const element = ref<HTMLElement | null>();

const currentContent = () =>
  props.noHtml ? element.value!.innerText : element.value!.innerHTML;

const update = () => emit("update:modelValue", currentContent());

const updateContent = (content: string) =>
  props.noHtml
    ? (element.value!.innerText = content)
    : (element.value!.innerHTML = content);

const paste = (event: Event) =>
  window.document.execCommand(
    "insertText",
    false,
    (((event as any).originalEvent || event) as any).clipboardData.getData(
      "text/plain"
    )
  );

const insertNewLine = () =>
  window.document.execCommand("insertHTML", false, "<br>");

const enter = (event: KeyboardEvent) => {
  event.preventDefault();
  event.ctrlKey ? emit("enter", currentContent()) : insertNewLine();
};

watch(
  () => props.modelValue,
  (newVal) => newVal != currentContent() && updateContent(newVal ?? "")
);

watch(
  () => props.noHtml,
  () => updateContent(props.modelValue ?? "")
);

watch(
  () => props.tag,
  () => updateContent(props.modelValue ?? ""),
  { flush: "post" }
);

onMounted(() => updateContent(props.modelValue ?? ""));
</script>

<template>
  <component
    :is="tag"
    :contenteditable="contenteditable"
    @input="update"
    @blur="update"
    @paste.prevent="paste"
    @keyup.enter="enter"
    ref="element"
  >
  </component>
</template>

<style scoped></style>
