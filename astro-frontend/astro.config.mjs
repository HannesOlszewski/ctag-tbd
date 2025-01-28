// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  output: process.env.NODE_ENV === "production" ? "static" : "server",
  outDir: "../spiffs_image/www",
  integrations: [tailwind({ applyBaseStyles: false }), react()],
});
