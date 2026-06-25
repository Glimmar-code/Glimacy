import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-oxc"; // Updated to use the high-performance OXC engine
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
        theme_color: "#0B0F12", 
        background_color: "#0B0F12",
        display: "standalone", 
        icons: [
          {
            src: "/pwa-192x192.png", 
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