<script lang="ts" setup>
import PhProjectorScreenFill from "~icons/ph/projector-screen-fill";
import PhMicrophoneFill from "~icons/ph/microphone-fill";
import PhMicrophoneSlashFill from "~icons/ph/microphone-slash-fill";
import PhDotsThreeVerticalFill from "~icons/ph/dots-three-vertical-fill";
import PhStopFill from "~icons/ph/stop-fill";
import PhDisconnectFill from "~icons/ph/phone-disconnect-fill";
import PhChatTextCentered from "~icons/ph/chat-centered-text";
import PhUsersThree from "~icons/ph/users-three";
import ScreenShare from "@/components/room/ScreenShare.vue";
import ParticipantsGrid from "@/components/room/ParticipantsGrid.vue";
import { onBeforeMount, onMounted, provide, ref } from "vue";
import { useRoomStore } from "@/stores/room";
import { useRoute, useRouter } from "vue-router";
import { Room } from "@/webrtc/room";
import type { RoomId } from "@/webrtc";
import { storeToRefs } from "pinia";
import tippy, { sticky } from "tippy.js";
import { useOrgsStore } from "@/stores/organization";
import PhCursorText from "~icons/ph/cursor-text";
import PhPaintBrush from "~icons/ph/paint-brush";
import WhiteBoard from "@/components/room/WhiteBoard.vue";
import WritePad from "@/components/room/writepad/WritePad.vue";
import { notify } from "@kyvg/vue3-notification";
import { useUserStore } from "@/stores/user";
import incomingMsgSoundURL from "@/assets/media/incoming.mp3";
import PhArrowBendUpLeft from "~icons/ph/arrow-bend-up-left-fill";
import PhX from "~icons/ph/x";
import RoomChat from "@/components/room/ChatArea.vue";
import RoomParticipants from "@/components/room/ParticipantsList.vue";

const {
  id: meetingId,
  micOn,
  screenOn,
  disabledControls,
  participants,
  activeScreenShare,
  screenStream,
} = storeToRefs(useRoomStore());
const { org } = storeToRefs(useOrgsStore());
const { user } = storeToRefs(useUserStore());
const moreOptionsBtn = ref<HTMLDivElement>();
const options = ref<HTMLDivElement>();
const router = useRouter();
const route = useRoute();
const supportScreenShare = navigator.mediaDevices.getDisplayMedia !== undefined;
const activeComponent = ref<"" | "screen" | "whiteboard" | "writepad">("");
const asideItem = ref<"participants" | "chat" | "">("");

meetingId.value = route.params.meetingId as string;
const room = new Room(meetingId.value as RoomId, {
  participantName: user.value?.username ?? `Not a Name ${new Date()}`,
});

const toggleParticipants = () => {
  asideItem.value = asideItem.value === "participants" ? "" : "participants";
};

const toggleChat = () => {
  asideItem.value = asideItem.value === "chat" ? "" : "chat";
};

const close = () => {
  if (room) room.disconnect();
  location.assign(
    router.resolve({
      name: "meetings",
      params: { dashboardContextOrgSlug: org.value?.org.slug },
    }).href
  );
};

const getParticipantNameBySessionID = (id: string) => {
  const index = participants.value.findIndex(
    ({ sessionId }) => sessionId === id
  );

  return index > -1 ? participants.value.at(index)?.name : "";
};

provide("room", room);

const incomingMsgSound = ref<AudioBuffer | null>(null);

const toggleMicrophone = () => {
  room.toggleMicrophone();
};

const toggleScreenShare = () => {
  if (screenOn.value) {
    room.stopScreenSharing();
    activeComponent.value = "";
  } else {
    room.shareScreen();
    activeComponent.value = "screen";
  }
};
const onArrival = async ({ detail: { name, justJoined } }: any) => {
  if (justJoined) {
    if (!incomingMsgSound.value) {
      incomingMsgSound.value = await fetch(incomingMsgSoundURL)
        .then((res) => res.arrayBuffer())
        .then((buffer) => room.audioContext.decodeAudioData(buffer));
    }

    const source = room.audioContext.createBufferSource();
    source.buffer = incomingMsgSound.value;
    source.connect(room.audioContext.destination);
    source.start(room.audioContext.currentTime);

    notify({
      type: "info",
      text: `${name} joined the room`,
    });
  }
};

const onDeparture = async ({ detail: { sessionId } }: any) => {
  notify({
    type: "info",
    text: `${getParticipantNameBySessionID(sessionId)} left the meeting`,
  });
};

const onScreenShare = async ({ detail: { sessionId } }: any) => {
  const name = getParticipantNameBySessionID(sessionId);

  if (name) {
    activeScreenShare.value = name;
    notify({
      type: "info",
      text: `${name} has started sharing his screen`,
    });
    activeComponent.value = "screen";
  }
};

const onScreenShareStop = async ({ detail: { sessionId } }: any) => {
  const name = getParticipantNameBySessionID(sessionId);

  if (name) {
    activeScreenShare.value = "";
    notify({
      type: "info",
      text: `${name} has stopped sharing his screen`,
    });
    activeComponent.value = "";
  }
};

onMounted(() => {
  if (route.params.meetingId) {
    tippy(moreOptionsBtn.value as HTMLDivElement, {
      content: options.value,
      hideOnClick: true,
      interactive: true,
      placement: "top",
      plugins: [sticky],
      sticky: true,
      trigger: "click",
    });

    room.on("newcomer", onArrival);
    room.on("screenShareStarted", onScreenShare);
    room.on("screenShareClosed", onScreenShareStop);
    room.on("sessionClosed", onDeparture);
    room.connect();

    window.addEventListener("beforeunload", (event) => {
      event.preventDefault();
    });

    window.addEventListener("unload", () => {
      room.disconnect();
    });
  }
});

onBeforeMount(() => {
  (window as any).ROOM_ID = useRoute().params.roomId;
});
</script>

<template>
  <section
    v-if="route.params.meetingId"
    class="h-full flex bg-white dark:bg-gray-700"
  >
    <div class="flex-1 h-full flex flex-col">
      <div class="relative flex-1">
        <WhiteBoard :wid="meetingId" v-if="activeComponent === 'whiteboard'" />
        <ScreenShare v-else-if="activeComponent === 'screen'" />
        <WritePad :wid="meetingId" v-else-if="activeComponent === 'writepad'" />
        <ParticipantsGrid v-else />
      </div>
      <footer class="h-16 text-white flex items-center justify-center">
        <button
          type="button"
          @click="toggleMicrophone"
          class="mx-2 p-2 h-10 w-10 md:(h-12 w-12) bg-gray-100 dark:(bg-gray-600 text-purple-400) text-purple-500 rounded-md flex justify-center items-center"
        >
          <PhMicrophoneFill v-if="micOn" />
          <PhMicrophoneSlashFill v-else class="text-red-400" />
        </button>
        <button
          type="button"
          :disabled="!supportScreenShare"
          @click="toggleScreenShare"
          class="mx-2 p-2 h-10 w-10 md:(h-12 w-12) disabled:opacity-50 bg-gray-100 dark:(bg-gray-600 text-purple-400) text-purple-500 rounded-md flex justify-center items-center"
        >
          <PhProjectorScreenFill v-if="!screenOn && !disabledControls.screen" />
          <PhProjectorScreenFill
            v-else-if="disabledControls.screen"
            class="opacity-50"
          />
          <PhStopFill v-else class="text-red-400" />
        </button>
        <button
          type="button"
          @click="close"
          class="mx-2 p-2 h-10 w-10 md:(h-12 w-12) bg-gray-100 dark:bg-gray-600 rounded-md flex justify-center items-center"
        >
          <PhDisconnectFill class="text-red-400" />
        </button>
        <button
          type="button"
          @click="toggleChat"
          class="mx-2 p-2 h-10 w-10 md:(h-12 w-12) bg-gray-100 dark:(bg-gray-600 text-purple-400) text-purple-500 rounded-md flex justify-center items-center"
        >
          <PhChatTextCentered />
        </button>
        <button
          type="button"
          class="mx-2 p-2 h-10 w-10 md:(h-12 w-12) bg-gray-100 dark:(bg-gray-600 text-white) text-black rounded-md flex justify-center items-center"
          ref="moreOptionsBtn"
        >
          <PhDotsThreeVerticalFill />
        </button>
        <div
          ref="options"
          class="w-48 bg-gray-100 rounded text-sm"
          id="controls-options"
        >
          <button
            class="text-left px-2 h-10 w-full text-gray-900 bg-gray-100 hover:bg-gray-200 flex justify-start items-center rounded-t rounded-b"
            @click="activeComponent = 'whiteboard'"
          >
            <PhPaintBrush class="mr-2" />
            <span class="text-sm">Whiteboard</span>
          </button>
          <button
            class="text-left px-2 h-10 w-full text-gray-900 bg-gray-100 hover:bg-gray-200 flex justify-start items-center rounded-t rounded-b"
            @click="activeComponent = 'writepad'"
          >
            <PhCursorText class="mr-2" />
            <span class="text-sm">Writepad</span>
          </button>
          <button
            class="text-left px-2 h-10 w-full text-gray-900 bg-gray-100 hover:bg-gray-200 flex justify-start items-center rounded-t rounded-b"
            @click="toggleParticipants"
          >
            <PhUsersThree class="mr-2" />
            <span class="text-sm">Participants</span>
          </button>
          <button
            class="text-left px-2 h-10 w-full text-gray-900 bg-gray-100 hover:bg-gray-200 flex justify-start items-center rounded-t rounded-b"
            @click="activeComponent = 'screen'"
            v-if="screenStream && activeComponent !== 'screen'"
          >
            <PhArrowBendUpLeft class="mr-2" />
            <span class="text-sm">Shared screen</span>
          </button>
          <button
            class="text-left px-2 h-10 w-full text-gray-900 bg-gray-100 hover:bg-gray-200 flex justify-start items-center rounded-t rounded-b"
            v-if="activeComponent !== ''"
            @click="activeComponent = ''"
          >
            <PhX class="mr-2" />
            <span class="text-sm">Remove active view</span>
          </button>
        </div>
      </footer>
    </div>
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 transform translate-x-1/2"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0  transform translate-x-1/2"
    >
      <div
        id=""
        class="w-[20%] min-w-[285px] max-w-[400px] h-full border-l overflow-y-auto"
        v-show="asideItem.length > 0"
      >
        <RoomParticipants v-if="asideItem === 'participants'" />
        <RoomChat v-else-if="asideItem === 'chat'" />
      </div>
    </Transition>
  </section>
  <div v-else class="p-4">
    <img
      alt="no active call illustration"
      src="@/assets/img/no_active_meeting.svg"
      class="mx-auto md:max-w-4/12 h-auto"
    />
    <div class="mx-auto text-sm">
      <p class="text-center my-6">
        No active call. Join a meeting from the calendar to see it here.
      </p>
    </div>
  </div>
</template>

<style scoped></style>
