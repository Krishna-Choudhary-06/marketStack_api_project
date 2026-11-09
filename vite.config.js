import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { marketstackApiPlugin } from "./server/marketstackApiPlugin.js";

export default defineConfig(({ mode }) => {
  const { MARKETSTACK_ACCESS_KEY: accessKey } = loadEnv(
    mode,
    process.cwd(),
    "MARKETSTACK_"
  );

  return {
    plugins: [react(), marketstackApiPlugin(accessKey)],
  };
});
