import Shepherd from "shepherd.js";
import { storeToRefs } from "pinia";
import { useOrgsStore } from "@/stores/organization";

const { org } = storeToRefs(useOrgsStore());

// TODO: Adapt this to work on the mobile version
export const useTour = () => {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
  });

  const inBetweenCloseButton = {
    text: "<b>&#10005;</b>",
    action: tour.cancel,
  };

  tour.addStep({
    id: "start-tour",
    text: "This tour will help you view the different functionalities in StudX.",
    buttons: [
      {
        text: "Close",
        action: tour.cancel,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "sidebar-presentation",
    text: "This is the sidebar. It's your main navigation tool. Use it to access the different sections of the app.",
    attachTo: {
      element: "#app-sidebar",
      on: "left",
    },
    buttons: [
      inBetweenCloseButton,
      {
        text: "Prev",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "sidebar-presentation--events",
    text: "Click the calendar to view all the scheduled events. It's the default page of the app.",
    attachTo: {
      element: "#app-sidebar--events",
      on: "left",
    },
    buttons: [
      inBetweenCloseButton,
      {
        text: "Prev",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "sidebar-presentation--meetings",
    text: "This is the page for ongoing calls.",
    attachTo: {
      element: "#app-sidebar--meetings",
      on: "left",
    },
    buttons: [
      inBetweenCloseButton,
      {
        text: "Prev",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  if (org.value?.role === "admin") {
    tour.addStep({
      id: "sidebar-presentation--settings",
      text: "Change the settings of your organization.",
      attachTo: {
        element: "#app-sidebar--settings",
        on: "left",
      },
      buttons: [
        inBetweenCloseButton,
        {
          text: "Prev",
          action: tour.back,
        },
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });
  }

  // Header
  tour.addStep({
    id: "app-header",
    text: "This is the header to access user related functions.",
    attachTo: {
      element: "#app-header",
      on: "bottom",
    },
    buttons: [
      inBetweenCloseButton,
      {
        text: "Prev",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "header--context-switcher",
    text: "Use this dropdown to switch context, if you're member of many organizations.",
    attachTo: {
      element: "#app-header--context-switcher",
      on: "bottom",
    },
    buttons: [
      inBetweenCloseButton,
      {
        text: "Prev",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "header--notifications",
    text: "Access notifications from all your organizations.",
    attachTo: {
      element: "#app-header--notifications",
      on: "bottom",
    },
    buttons: [
      inBetweenCloseButton,
      {
        text: "Prev",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "header--user-profile",
    text: "This is a quick access to your user profile.",
    attachTo: {
      element: "#app-header--user-profile",
      on: "bottom",
    },
    buttons: [
      inBetweenCloseButton,
      {
        text: "Prev",
        action: tour.back,
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "end-tour",
    text: "This ends the tour. We hope you'll enjoy the features of your StudX instance.",
    buttons: [
      {
        text: "Close",
        action: tour.complete,
      },
    ],
  });

  return tour;
};
