import { test, expect } from "bun:test";
import { avatarColor, initials } from "../src/avatar";

test("initials: two words, one word, separators, empty", () => {
  expect(initials("Dev Team")).toBe("DT");
  expect(initials("alice")).toBe("AL");
  expect(initials("bob_smith")).toBe("BS");
  expect(initials("  ")).toBe("?");
});

test("avatarColor is stable per name", () => {
  expect(avatarColor("Dev Team")).toBe(avatarColor("Dev Team"));
});
