import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    benchmark: {
      include: ["bench/**/*.bench.ts", "bench/**/*.bench.tsx"],
    },
  },
});
