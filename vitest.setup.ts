import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library renders into a real DOM node. Without this, every test file
// would slowly accumulate the previous tests' markup, and queries like
// getByRole would start finding two of everything.
afterEach(() => {
  cleanup();
});
