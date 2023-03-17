<script setup lang="ts">
import Calendar, { type Options } from "@toast-ui/calendar";
import { onMounted, ref, watch } from "vue";
import PhCaretLeft from "~icons/ph/caret-left";
import PhCaretRight from "~icons/ph/caret-right";
import PhTable from "~icons/ph/table";
import PhGridFour from "~icons/ph/grid-four";
import PhSquare from "~icons/ph/square";
import PhX from "~icons/ph/x";
import BaseModal from "@/components/modals/BaseModal.vue";
import { Field, Form } from "vee-validate";
import FormField from "@/components/base/forms/FormField.vue";
import type { CreateEventRequest } from "@/schemas/events";
import { CreateEventSchema } from "@/schemas/events";
import { addEvent, listEvents, removeEvent } from "@/services/events";
import { notifyError } from "@/utils";
import { storeToRefs } from "pinia";
import { useOrgsStore } from "@/stores/organization";

import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import "tui-date-picker/dist/tui-date-picker.css";
import "tui-time-picker/dist/tui-time-picker.css";
import { useRouter } from "vue-router";

type View = "week" | "day" | "month";

let calendar: Calendar | null = null;
const calendarRoot = ref<HTMLDivElement>();
const createEventModal = ref<typeof BaseModal | null>();
const view = ref<View>("week");
const { org } = storeToRefs(useOrgsStore());
const events = ref<Array<any>>([]);
const router = useRouter();

const defaultOptions: Options = {
  isReadOnly: String(org.value?.role) === "student",
  usageStatistics: false,
  useFormPopup: true,
  useDetailPopup: true,
  defaultView: view.value,
  gridSelection: true,
  week: {
    eventView: ["time"],
    taskView: false,
  },
  theme: {
    common: {
      backgroundColor: "transparent",
    },
    week: {
      today: {
        color: "purple",
      },
    },
    month: {
      today: {
        backgroundColor: "purple",
      },
    },
  },
  calendars: [
    {
      id: "default",
      name: "default",
    },
  ],
  template: {
    popupDetailAttendees({ attendees = [] }) {
      const firstPart = attendees.slice(0, 2).join(", ");

      return `${firstPart}${attendees.length > 2 ? `and ${attendees.length - 2} more` : ""
        }`;
    },
    popupDetailState({ state }) {
      return state || "";
    },
    popupDetailLocation() {
      return "online";
    },
    popupDetailBody({ body, raw }) {
      return raw.meetingId
        ? `${body}<br>
            <strong>Meeting ID:</strong>
            <a href="${router.resolve({
          name: "meetings",
          params: {
            dashboardContextOrgSlug: org.value?.org?.slug,
            meetingId: raw.meetingId,
          },
        }).href
        }" style="text-decoration: underline">${raw.meetingId}</a>`
        : body;
    },
  },
};

const createEvent = async (request: unknown) => {
  try {
    const event = await addEvent(
      org.value?.org?.slug,
      request as CreateEventRequest
    );
    calendar?.createEvents([
      {
        id: event.pk,
        start: event.startsAt,
        end: event.endsAt,
        location: "online",
        body: event.description,
        raw: event,
        color: "white",
        borderColor: "grey",
        ...event,
      },
    ]);
    createEventModal.value?.close();
  } catch {
    notifyError();
  }
};

const onBeforeUpdateEvent = ({ event, changes }: any) => {
  const { id, calendarId } = event;
  console.log({ event, changes });

  calendar?.updateEvent(id, calendarId, changes);
};

const onBeforeDelete = async ({ id }: { id: number }) => {
  try {
    await removeEvent(org.value?.org?.slug, id);
    calendar?.deleteEvent(String(id), "default");
  } catch {
    notifyError();
  }
};

watch(view, (view) => {
  calendar?.changeView(view);
});

onMounted(async () => {
  calendar = new Calendar(calendarRoot.value!, defaultOptions);
  calendar.on("beforeUpdateEvent", onBeforeUpdateEvent);
  calendar.on("beforeDeleteEvent", onBeforeDelete);

  try {
    events.value = (await listEvents(org.value?.org?.slug)).map(
      (event: any) => ({
        id: event.pk,
        start: event.startsAt,
        end: event.endsAt,
        location: "online",
        body: event.description,
        raw: event,
        color: "white",
        borderColor: "grey",
        // backgroundColor: "rgba(19,93,230,0.9)",
        ...event,
      })
    );
    calendar.createEvents(events.value);
  } catch {
    notifyError();
  }
});

// style utilities
const activeViewClasses = (value: View) => [
  "btn py-1 px-2 md:(min-w-12 flex items-center) text-xs mx-0.5 rounded",
  value == view.value
    ? "text-white bg-purple-500"
    : "border-purple-500 bg-purple-500 bg-opacity-20 text-purple-500 hover:bg-opacity-50",
];
</script>

<template>
  <div class="overflow-y-auto overflow-x-auto h-full pt-3 md:(px-6 py-3) flex flex-col">
    <div class="h-12 bg-white text-sm px-2 flex items-center">
      <button @click="view = 'day'" :class="activeViewClasses('day')">
        <PhSquare />
        <span class="<md:(hidden min-w-0)">Day view</span>
      </button>
      <button @click="view = 'week'" :class="activeViewClasses('week')">
        <PhTable />
        <span class="<md:(hidden min-w-0)">Week view</span>
      </button>
      <button @click="view = 'month'" :class="activeViewClasses('month')">
        <PhGridFour />
        <span class="<md:hidden">Month view</span>
      </button>
      <div class="ml-auto"></div>
      <button v-show="String(org?.role) !== 'student'" @click="createEventModal?.open()"
        class="mr-4 btn p-1 text-xs mx-0.5 rounded">
        Create
      </button>
      <button @click="calendar?.prev()" class="btn p-1 text-xs mx-0.5 rounded">
        <PhCaretLeft />
      </button>
      <button @click="calendar?.today()" class="btn p-1 text-xs mx-0.5 rounded">
        <span>Today</span>
      </button>
      <button @click="calendar?.next()" class="btn p-1 text-xs mx-0.5 rounded">
        <PhCaretRight />
      </button>
    </div>
    <div ref="calendarRoot" class="flex-1"></div>
    <BaseModal ref="createEventModal">
      <slot></slot>
      <template #modal>
        <div
          class="container mx-auto w-full px-6 py-3 overflow-hidden bg-white rounded-t-lg dark:bg-gray-800 sm:rounded-lg sm:m-4 sm:max-w-xl md:max-w-screen-xl h-10/12 overflow-y-auto"
          role="dialog" id="modal">
          <header
            class="flex text-sm justify-between items-center sticky top-0 z-4000 p-2 bg-gray-100 rounded-md dark:bg-gray-700">
            <!-- Modal title -->
            <p class="text-md font-semibold text-gray-700 dark:text-gray-300">
              Create a new event
            </p>
            <button @click="createEventModal?.close()"
              class="inline-flex items-center justify-center w-6 h-6 text-gray-400 transition-colors duration-150 rounded dark:hover:text-gray-200 hover: hover:text-gray-700"
              aria-label="close">
              <PhX class="w-4 h-4" />
            </button>
          </header>
          <!-- Modal body -->
          <div class="mt-4 mb-6">
            <Form @submit="createEvent" :validation-schema="CreateEventSchema">
              <FormField class="my-4" name="title" type="text" placeholder="New course" label="Title" />
              <FormField class="my-4" name="description" type="text" placeholder="A meeting schedule for the new course"
                label="Description" :required="false" />
              <div class="md:(flex gap-2)">
                <FormField class="my-4 flex-1" name="startsAt" type="datetime-local"
                  placeholder="A meeting schedule for the new course" label="Starts at" />
                <FormField class="my-4 flex-1" name="endsAt" type="datetime-local"
                  placeholder="A meeting schedule for the new course" label="Ends at" />
              </div>
              <label class="block text-sm my-4">
                <span class="text-gray-700 dark:text-gray-400 block">
                  <span>Attendees</span>
                  <span class="mx-0.5 text-red-600">*</span>
                </span>
                <Field v-slot="{ field }" name="attendees" type="text">
                  <textarea v-bind="{ ...field }"
                    class="form-input block w-full mt-1 text-sm border-purple-600 dark:text-gray-300 dark:bg-gray-700 focus:border-purple-400 focus:outline-none focus:shadow-outline-purple min-h-10"></textarea>
                </Field>
              </label>
              <label class="block my-4 px-2 flex gap-2">
                <Field v-slot="{ field }" name="addMeetingLink" type="checkbox" :value="true" :unchecked-value="false">
                  <input
                    class="form-checkbox mr-2 text-purple-600 form-radio focus:border-purple-400 focus:outline-none focus:shadow-outline-purple dark:focus:shadow-outline-gray"
                    type="checkbox" v-bind="field" :value="true" />
                </Field>
                <span class="text-sm">Add a meeting link</span>
              </label>
              <button
                class="px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple disabled:opacity-50 disabled:cursor-not-allowed">
                Create
              </button>
            </Form>
          </div>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style>
/* Hides the day name on mobile devices */
.toastui-calendar-week-view .toastui-calendar-day-name__name {
  @apply <md: hidden;
}
</style>
