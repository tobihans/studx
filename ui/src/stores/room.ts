import { ref } from "vue";
import { defineStore } from "pinia";
import type { ServerNewComer } from "@/webrtc/messages";

export const useRoomStore = defineStore("room", () => {
  const id = ref("");
  const micOn = ref(true);
  const screenOn = ref(false);
  const disabledControls = ref({
    microphone: false,
    screen: false,
  });
  const messages = ref<Array<{ text: string; senderId?: string }>>([]);
  const activeScreenShare = ref("");
  const screenStream = ref<MediaStream | undefined>();
  const participants = ref<Array<Pick<ServerNewComer, "sessionId" | "name">>>(
    []
  );

  return {
    id,
    micOn,
    screenOn,
    disabledControls,
    messages,
    activeScreenShare,
    screenStream,
    participants,
  };
});
