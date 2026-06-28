import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    sourcemap: false,
    target: "es2020",
    modulePreload: false,
    minify: true,
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: false,
      },
    },
  },
});
