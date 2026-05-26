import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/health": "http://localhost:3000",
      "/users": "http://localhost:3000",
      "/designer/levels": "http://localhost:3000",
      "/designer/submissions": "http://localhost:3000",
      "/admin/comments": "http://localhost:3000",
      "/admin/submissions": "http://localhost:3000",
      "/player/levels": "http://localhost:3000",
      "/player/favorites": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist/frontend",
    emptyOutDir: false,
  },
});
