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
      "/api": {
        target: "https://staging-api.lotuslms.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
      "/lotuslms": {
        target: "https://staging-api.lotuslms.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lotuslms/, ""),
      },
    },
  },
});
