<script lang="ts" setup>
import MenuItem from "./MenuItem.vue";
import PhTextBolder from "~icons/ph/text-bolder";
import PhTextItalic from "~icons/ph/text-italic";
import PhTextStrikeThrough from "~icons/ph/text-strikethrough";
import PhCodeSimple from "~icons/ph/code-simple";
import PhPencilSimpleLine from "~icons/ph/pencil-simple-line";
import PhTextHOne from "~icons/ph/text-h-one";
import PhTextHTwo from "~icons/ph/text-h-two";
import PhTextHThree from "~icons/ph/text-h-three";
import PhTextHFour from "~icons/ph/text-h-four";
import PhTextHFive from "~icons/ph/text-h-five";
import PhTextHSix from "~icons/ph/text-h-six";
import PhTextAlighLeft from "~icons/ph/text-align-left";
import PhListDashes from "~icons/ph/list-dashes";
import PhListNumbers from "~icons/ph/list-numbers";
import PhListChecks from "~icons/ph/list-checks";
import PhCode from "~icons/ph/code";
import PhQuotes from "~icons/ph/quotes";
import PhArrowsHorizontal from "~icons/ph/arrows-horizontal";
import PhArrowUDownLeft from "~icons/ph/arrow-u-down-left";
import PhLinkBreak from "~icons/ph/link-break";
import PhArrowArcLeft from "~icons/ph/arrow-arc-left";
import PhArrowArcRight from "~icons/ph/arrow-arc-right";

const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
});

const items = [
  {
    icon: PhTextBolder,
    title: "Bold",
    action: () => props.editor.chain().focus().toggleBold().run(),
    isActive: () => props.editor.isActive("bold"),
  },
  {
    icon: PhTextItalic,
    title: "Italic",
    action: () => props.editor.chain().focus().toggleItalic().run(),
    isActive: () => props.editor.isActive("italic"),
  },
  {
    icon: PhTextStrikeThrough,
    title: "Strike",
    action: () => props.editor.chain().focus().toggleStrike().run(),
    isActive: () => props.editor.isActive("strike"),
  },
  {
    icon: PhCodeSimple,
    title: "Code",
    action: () => props.editor.chain().focus().toggleCode().run(),
    isActive: () => props.editor.isActive("code"),
  },
  {
    icon: PhPencilSimpleLine,
    title: "Highlight",
    action: () => props.editor.chain().focus().toggleHighlight().run(),
    isActive: () => props.editor.isActive("highlight"),
  },
  {
    type: "divider",
  },
  {
    icon: PhTextHOne,
    title: "Heading 1",
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: () => props.editor.isActive("heading", { level: 1 }),
  },
  {
    icon: PhTextHTwo,
    title: "Heading 2",
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: () => props.editor.isActive("heading", { level: 2 }),
  },
  {
    icon: PhTextHThree,
    title: "Heading 3",
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: () => props.editor.isActive("heading", { level: 3 }),
  },
  {
    icon: PhTextHFour,
    title: "Heading 4",
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 4 }).run(),
    isActive: () => props.editor.isActive("heading", { level: 4 }),
  },
  {
    icon: PhTextHFive,
    title: "Heading 5",
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 5 }).run(),
    isActive: () => props.editor.isActive("heading", { level: 5 }),
  },
  {
    icon: PhTextHSix,
    title: "Heading 6",
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 6 }).run(),
    isActive: () => props.editor.isActive("heading", { level: 6 }),
  },
  {
    icon: PhTextAlighLeft,
    title: "Paragraph",
    action: () => props.editor.chain().focus().setParagraph().run(),
    isActive: () => props.editor.isActive("paragraph"),
  },
  {
    icon: PhListDashes,
    title: "Bullet List",
    action: () => props.editor.chain().focus().toggleBulletList().run(),
    isActive: () => props.editor.isActive("bulletList"),
  },
  {
    icon: PhListNumbers,
    title: "Ordered List",
    action: () => props.editor.chain().focus().toggleOrderedList().run(),
    isActive: () => props.editor.isActive("orderedList"),
  },
  {
    icon: PhListChecks,
    title: "Task List",
    action: () => props.editor.chain().focus().toggleTaskList().run(),
    isActive: () => props.editor.isActive("taskList"),
  },
  {
    icon: PhCode,
    title: "Code Block",
    action: () => props.editor.chain().focus().toggleCodeBlock().run(),
    isActive: () => props.editor.isActive("codeBlock"),
  },
  {
    type: "divider",
  },
  {
    icon: PhQuotes,
    title: "Blockquote",
    action: () => props.editor.chain().focus().toggleBlockquote().run(),
    isActive: () => props.editor.isActive("blockquote"),
  },
  {
    icon: PhArrowsHorizontal,
    title: "Horizontal Rule",
    action: () => props.editor.chain().focus().setHorizontalRule().run(),
  },
  {
    type: "divider",
  },
  {
    icon: PhArrowUDownLeft,
    title: "Hard Break",
    action: () => props.editor.chain().focus().setHardBreak().run(),
  },
  {
    icon: PhLinkBreak,
    title: "Clear Format",
    action: () =>
      props.editor.chain().focus().clearNodes().unsetAllMarks().run(),
  },
  {
    type: "divider",
  },
  {
    icon: PhArrowArcLeft,
    title: "Undo",
    action: () => props.editor.chain().focus().undo().run(),
  },
  {
    icon: PhArrowArcRight,
    title: "Redo",
    action: () => props.editor.chain().focus().redo().run(),
  },
];
</script>

<template>
  <div>
    <template v-for="(item, index) in items">
      <div
        class="divider"
        v-if="item.type === 'divider'"
        :key="`divider${index}`"
      />
      <menu-item v-else :key="index" v-bind="item" />
    </template>
  </div>
</template>

<style>
.divider {
  width: 2px;
  height: 1.25rem;
  background-color: rgba(0, 0, 0, 0.1);
  margin-left: 0.5rem;
  margin-right: 0.75rem;
}
</style>
