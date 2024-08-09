<script lang="ts" setup>
import RoomParticipant from "@/components/room/ParticipantDetail.vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user";
import { useRoomStore } from "@/stores/room";
import { computed } from "vue";

defineEmits(["close"]);

const { user } = storeToRefs(useUserStore());
const { participants } = storeToRefs(useRoomStore());
const list = computed(() => [
  { name: `${user.value?.username} (you)`, sessionId: null },
  ...participants.value,
]);
const count = computed(() => list.value.length);
</script>

<template>
  <div class="h-12 p-1 flex justify-between items-center border-b text-sm">
    Participants ({{ count }})
  </div>
  <div class="text-sm p-1">
    <RoomParticipant
      v-for="participant in list"
      :key="participant.sessionId ?? ''"
      :name="participant.name"
    />
    <!-- HACK: ?? ''  is a quickfix to avoid ts compiler warnings during builds.-->
  </div>
</template>

<style scoped></style>
