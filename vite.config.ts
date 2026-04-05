import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/health": "http://localhost:3000",
      "/users": "http://localhost:3000",
      "/designer": "http://localhost:3000",
      "/admin": "http://localhost:3000",
      "/player": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist/frontend",
    emptyOutDir: false,
  },
});
