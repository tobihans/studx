<script lang="ts" setup>
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { HocuspocusProvider } from "@hocuspocus/provider";

import MenuBar from "./MenuBar.vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user";
import { onBeforeUnmount, ref, watch } from "vue";

const getRandomColor = () => {
  const colors = [
    "#958DF1",
    "#F98181",
    "#FBBC88",
    "#FAF594",
    "#70CFF8",
    "#94FADB",
    "#B9F18D",
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};

const props = defineProps({ wid: String });
const { user } = storeToRefs(useUserStore());
const currentUser = ref({
  name: user.value?.username || `${Date()}`,
  color: getRandomColor(),
});
const status = ref("connecting");
const provider = new HocuspocusProvider({
  url: import.meta.env.STUDX_UI_WRITEPAD_ENDPOINT,
  name: `doc-${props.wid}`,
});
provider.on("status", (event: { status: string }) => {
  status.value = event.status;
});
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: false,
    }),
    Highlight,
    TaskList,
    TaskItem,
    Collaboration.configure({
      document: provider.document,
    }),
    CollaborationCursor.configure({
      provider: provider,
      user: currentUser.value,
    }),
    CharacterCount.configure({
      limit: 10000,
    }),
  ],
});

watch(user, ({ username }: any) => {
  currentUser.value = { ...currentUser.value, name: username };
  editor.value?.chain().focus().updateUser(currentUser.value).run();
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  provider.destroy();
});
</script>

<template>
  <div
    class="editor border-2 border-orange-400 rounded-md outline-none w-full md:max-w-8/12 h-full max-h-11/12 mx-auto mt-4 shadow-lg"
    v-if="editor"
  >
    <menu-bar class="editor__header" :editor="editor" />
    <editor-content class="editor__content" :editor="editor" />
    <!--    <div class="editor__footer">-->
    <!--      <div :class="`editor__status editor__status&#45;&#45;${status}`">-->
    <!--        <template v-if="status === 'connected'"> online </template>-->
    <!--        <template v-else> offline </template>-->
    <!--      </div>-->
    <!--    </div>-->
  </div>
</template>

<!-- TODO: Purge and remove sass dependency -->
<style lang="scss">
.editor {
  display: flex;
  flex-direction: column;

  @apply border-3 border-gray-800 text-gray-800 bg-gray-50 text-sm;

  &__header {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    flex-wrap: wrap;
    padding: 0.25rem;

    @apply border-b-3 border-gray-800;
  }

  &__content {
    padding: 1.25rem 1rem;
    flex: 1 1 auto;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  &__footer {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    padding: 0.25rem 0.75rem;

    @apply text-gray-800 border-t-3 border-gray-800;
  }

  /* Some information about the status */
  &__status {
    display: flex;
    align-items: center;
    border-radius: 5px;

    &::before {
      content: " ";
      flex: 0 0 auto;
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      background: rgba(#0d0d0d, 0.5);
      border-radius: 50%;
      margin-right: 0.5rem;
    }

    &--connecting::before {
      background: #616161;
    }

    &--connected::before {
      background: #b9f18d;
    }
  }

  &__name {
    button {
      background: none;
      border: none;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      color: #0d0d0d;
      border-radius: 0.4rem;
      padding: 0.25rem 0.5rem;

      &:hover {
        color: #fff;
        background-color: #0d0d0d;
      }
    }
  }
}
</style>

<style lang="scss">
/* Give a remote user a caret */
.collaboration-cursor__caret {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 1px solid #0d0d0d;
  border-right: 1px solid #0d0d0d;
  word-break: normal;
  pointer-events: none;
}

/* Render the username above the caret */
.collaboration-cursor__label {
  position: absolute;
  top: -1.4em;
  left: -1px;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  user-select: none;
  color: #0d0d0d;
  padding: 0.1rem 0.3rem;
  border-radius: 3px 3px 3px 0;
  white-space: nowrap;
}

/* Basic editor styles */
.ProseMirror {
  > * + * {
    margin-top: 0.5em;
  }

  &:focus,
  &:focus-within,
  &:focus-visible {
    outline: none;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
  }

  pre {
    background: rgba(#616161, 0.1);
    color: #616161;
    font-family: "JetBrainsMono", monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  mark {
    background-color: #faf594;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  hr {
    margin: 1rem 0;
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid rgba(#0d0d0d, 0.1);
  }

  hr {
    border: none;
    border-top: 2px solid rgba(#0d0d0d, 0.1);
    margin: 2rem 0;
  }

  ul[data-type="taskList"] {
    list-style: none;
    padding: 0;

    li {
      display: flex;
      align-items: center;

      > label {
        flex: 0 0 auto;
        margin-right: 0.5rem;
        user-select: none;
      }

      > div {
        flex: 1 1 auto;
      }
    }
  }
}
</style>
