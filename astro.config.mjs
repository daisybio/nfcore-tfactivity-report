// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import relativeLinks from "astro-relative-links";

// https://astro.build/config
export default defineConfig({
  integrations: [relativeLinks()],
  vite: {
    plugins: [tailwindcss()],
  },
});
