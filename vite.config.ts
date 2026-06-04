import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isElectron = mode === "electron";

  return {
    base: isElectron ? "./" : "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3847",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: !isElectron,
    },
  };
});
