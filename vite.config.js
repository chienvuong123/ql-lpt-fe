import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// Thư viện lớn tách thành file riêng: trình duyệt cache lâu dài, đổi code trang không phải tải lại
const VENDOR_CHUNKS = {
  "vendor-react": ["react", "react-dom", "react-router", "react-router-dom", "scheduler"],
  "vendor-antd": ["antd", "@ant-design", "rc-", "@rc-component"],
  "vendor-charts": ["recharts", "d3-", "victory-vendor"],
  "vendor-excel": ["xlsx", "xlsx-js-style", "exceljs", "file-saver"],
  "vendor-map": ["leaflet", "react-leaflet"],
  "vendor-docx": ["docx-preview", "jszip"],
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          const pkg = id.split("node_modules/").pop().split("/");
          const name = pkg[0].startsWith("@") ? `${pkg[0]}/${pkg[1]}` : pkg[0];
          for (const [chunk, prefixes] of Object.entries(VENDOR_CHUNKS)) {
            if (prefixes.some((p) => name === p || (p.endsWith("-") || p.startsWith("@") ? name.startsWith(p) : false))) return chunk;
          }
          return undefined;
        },
      },
    },
  },
  // Dev: quét sẵn mọi trang để tối ưu thư viện 1 lần lúc khởi động
  // (tránh việc mở trang mới lần đầu bị tải lại cả trang vì "new dependencies optimized")
  optimizeDeps: {
    entries: ["index.html", "src/**/*.{js,jsx}"],
  },
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
