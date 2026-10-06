import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "reproduction" ? "/pacer-strick-mode-queuer/" : "/",
  build: { outDir: mode === "reproduction" ? "dist-pages" : "dist" },
}));
