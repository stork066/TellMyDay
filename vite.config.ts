import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 5173 is taken by another local project; use a fixed uncommon port.
    port: 5183,
    strictPort: true,
  },
});
