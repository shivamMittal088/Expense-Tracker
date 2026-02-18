import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
