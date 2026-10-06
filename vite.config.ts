import { defineConfig } from "vite";
import alias from "@rollup/plugin-alias";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

const rootDir = resolve(__dirname);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), alias()],
  resolve: {
    alias: {
      "@src": resolve(rootDir, "src"),
      "@custom_types": resolve(rootDir, "src/@custom_types"),
    },
  },
  server: {
    // LAN + public vhost testing: bind all interfaces; Vite's allowHosts
    // check permits IPs by default, the public hostname gets an entry.
    host: true,
    allowedHosts: ["gochat.example.com"],
    proxy: {
      // Single origin per ADR-016: the browser only ever talks to /api; the
      // dev server forwards to the backend (server listens on :18100 locally).
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:18100",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});