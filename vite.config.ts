import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Or vue(), svelte(), etc.
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
});