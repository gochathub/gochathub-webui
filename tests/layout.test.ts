import { test, expect } from "bun:test";
import { resolveLayout } from "../src/store/prefs";

test("instance follows the admin default; explicit choice wins", () => {
  expect(resolveLayout("instance", "classic")).toBe("classic");
  expect(resolveLayout("instance", "modern")).toBe("modern");
  expect(resolveLayout("modern", "classic")).toBe("modern");
  expect(resolveLayout("classic", "modern")).toBe("classic");
});
