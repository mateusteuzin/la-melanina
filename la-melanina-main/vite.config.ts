import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
  },
  plugins: [react(), tsconfigPaths(), tailwind()],
});





