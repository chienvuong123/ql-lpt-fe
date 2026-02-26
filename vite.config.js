import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api-lms": {
        target: "https://staging-api.lotuslms.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-lms/, ""),
      },
    },
  },
});
