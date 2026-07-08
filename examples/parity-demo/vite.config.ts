import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["satteri", "@bruits/satteri-wasm32-wasi"],
  },
  resolve: {
    alias: {
      "satteri-stream": resolve(__dirname, "../../src/index.ts"),
    },
  },
});
