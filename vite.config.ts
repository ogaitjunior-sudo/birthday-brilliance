import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tanstackRouter(), viteReact(), tailwindcss(), tsConfigPaths()],
  server: {
    host: "::",
    port: 8080,
  },
});
