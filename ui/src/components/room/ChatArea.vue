<script lang="ts" setup>
import PhPaperPlaneRight from "~icons/ph/paper-plane-right";
import ContentEditable from "@/components/room/ContentEditable.vue";
import { computed, inject, ref } from "vue";
import type { Room } from "@/webrtc/room";
import { storeToRefs } from "pinia";
import { useRoomStore } from "@/stores/room";

defineEmits(["close"]);

const getParticipantNameBySessionID = (id: string) => {
  const index = participants.value.findIndex(
    ({ sessionId }) => sessionId === id
  );

  return index > -1 ? participants.value.at(index)?.name : "";
};

const { messages, participants } = storeToRefs(useRoomStore());
const messagesMappedtoAuthorNames = computed(() => {
  return messages.value.map(({ senderId, text }) => {
    const username = getParticipantNameBySessionID(String(senderId));
    return { username, senderId, text };
  });
});
const text = ref("");
const room: Room | undefined = inject("room");

const send = () => {
  let value = text.value.trim();

  if (value.length) room?.text(value);
  text.value = "";
};
</script>

<!-- TODO: FIx overflow when they are a lot of messages -->
<template>
  <div class="h-full max-h-full overflow-hidden flex flex-col">
    <div class="h-12 p-2 flex justify-between items-center border-b text-sm">
      Chat
    </div>
    <div class="overflow-y-auto flex-1 flex flex-col text-sm p-2">
      <div
        class="min-h-10 min-w-10 h-auto bg-gray-100 max-w-9/12 rounded my-2 p-1.5"
        v-for="(msg, index) in messagesMappedtoAuthorNames"
        :key="index"
        :class="{ 'bg-purple-500 self-end text-white': !msg.senderId }"
      >
        <p v-if="msg.senderId" class="text-xs font-medium truncate">
          {{ msg.username ?? msg.senderId }}
        </p>
        <span class="">{{ msg.text }}</span>
      </div>
    </div>
    <div class="flex p-2 sticky bottom-0">
      <ContentEditable
        tag="div"
        class="min-h-10 max-h-28 p-1 text-sm bg-gray-100 rounded border focus:(border-1.5px border-purple-500) outline-none overflow-y-auto"
        style="flex-grow: 1"
        v-model="text"
        @enter="send"
      />
      <button
        class="p-0.5 px-1 flex justify-center items-center"
        @click.prevent="send"
      >
        <PhPaperPlaneRight class="text-xl text-purple-500" />
      </button>
    </div>
  </div>
</template>

<style scoped></style>
