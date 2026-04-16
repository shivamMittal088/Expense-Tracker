import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      strategies: "injectManifest",
      srcDir: "public",
      filename: "service-worker.js",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,json}"],
      },
      devOptions: {
        enabled: true,          // allows testing SW/offline in `npm run dev`
        type: "module",
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          reactVendor: ["react", "react-dom", "react-router-dom", "react-redux", "@reduxjs/toolkit"],
          uiVendor: ["lucide-react"],
          utilsVendor: ["axios", "dayjs"],
          heavyOptional: ["html-to-image", "react-day-picker"],
        },
      },
    },
  },
});
