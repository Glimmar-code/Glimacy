import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Glimmacy",
        short_name: "Glimmacy",
        description: "ConnectCampus - Your Campus Connected",
        theme_color: "#0B0F12", // Your dark background color
        background_color: "#0B0F12",
        display: "standalone", // This removes the browser UI
        icons: [
          {
            src: "/pwa-192x192.png", // We will create these next
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});