import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";
import eslintPlugin from "vite-plugin-eslint";
import WindiCSS from "vite-plugin-windicss";
import FullReload from "vite-plugin-full-reload";

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: "STUDX_UI_",
  plugins: [
    vue(),
    eslintPlugin(),
    WindiCSS(),
    Icons({ autoInstall: true, compiler: "vue3" }),
    FullReload(["src/webrtc/**/*", "src/views/meetings/IndexView.vue"]),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    headers: {
      "Permissions-Policy": "autoplay=(self)",
    },
  },
});
