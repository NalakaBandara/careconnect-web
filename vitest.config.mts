import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// .mts, not .ts: this is config for the test runner rather than part of the
// app, and the explicit module extension stops Node guessing how to load it.
export default defineConfig({
  // Compiles JSX so components can be rendered in tests.
  plugins: [react()],
  resolve: {
    // Makes the "@/..." import alias work here exactly as it does in the app,
    // by reading it from tsconfig.json rather than repeating it. This used to
    // need the vite-tsconfig-paths plugin; Vite does it natively now.
    tsconfigPaths: true,
  },
  test: {
    // Tests run in Node, which has no document or window. jsdom is a stand-in
    // browser environment, so components can be rendered and clicked.
    environment: "jsdom",
    // Runs before every test file: adds the extra matchers, and clears the
    // rendered DOM between tests so one test cannot affect the next.
    setupFiles: ["./vitest.setup.ts"],
    // Only these two places, so Vitest never wanders into .next or node_modules.
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    css: true, // don't choke on the `import "./globals.css"` in the root layout
  },
});
