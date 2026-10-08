import { test, expect } from "bun:test";
import { mobileSignInUrl } from "../src/mobileSignIn";

test("mobileSignInUrl carries server and token, both round-trip", () => {
  const url = mobileSignInUrl("https://chat.example.com", "a-b_c=");
  expect(url.startsWith("gochathub://login?")).toBe(true);
  const q = new URL(url).searchParams;
  expect(q.get("server")).toBe("https://chat.example.com");
  expect(q.get("token")).toBe("a-b_c=");
});
