import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import Notifications from "@kyvg/vue3-notification";

import router from "./router";

import "virtual:windi.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Notifications);

app.mount("#app");
