import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  site: "https://familianto.github.io",
  base: "/warta",
  integrations: [react()],
});
