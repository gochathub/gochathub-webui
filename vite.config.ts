import { defineConfig } from "vite";
import alias from "@rollup/plugin-alias";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

const rootDir = resolve(__dirname);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    alias(),
    // custom sw.ts: push + notificationclick handlers; prompt-for-update
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      manifest: {
        name: "goChatHub",
        short_name: "goChatHub",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#182027",
        background_color: "#182027",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        // shell only: harper's 16 MB wasm stays a lazy, opt-in download
        globIgnores: ["**/*.wasm"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@src": resolve(rootDir, "src"),
      "@custom_types": resolve(rootDir, "src/@custom_types"),
    },
  },
  // pre-bundling moves harper.js away from its .wasm, so the wasm URL 404s
  optimizeDeps: { exclude: ["harper.js"] },
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
