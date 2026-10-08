import { test, expect } from "bun:test";
import {
  findShortcodes,
  nameMatches,
  plainText,
  replaceShortcodes,
  truncate,
  withTone,
} from "../src/emoji";

test("truncate never splits an emoji or ZWJ sequence", () => {
  const family = "👨‍👩‍👧";
  expect(truncate(`ab${family}cd`, 3)).toBe(`ab${family}...`);
  expect(truncate("😀😀😀", 2)).toBe("😀😀...");
  expect(truncate("short", 10)).toBe("short");
});

test("replaceShortcodes converts known names, leaves unknown", () => {
  expect(replaceShortcodes(":poop: :nope: 12:30:45")).toBe(
    "💩 :nope: 12:30:45",
  );
});

test("findShortcodes returns prefix matches, capped", () => {
  const out = findShortcodes("smi", 5);
  expect(out.length).toBeGreaterThan(0);
  expect(out.length).toBeLessThanOrEqual(5);
  for (const m of out) {
    expect(m.name.startsWith("smi")).toBe(true);
    expect(m.char.length).toBeGreaterThan(0);
  }
  expect(findShortcodes("", 5)).toEqual([]);
});

test("plainText strips markdown, converts shortcodes, truncates", () => {
  expect(plainText("**hi** :poop: [x](https://a.b)\n- item")).toBe(
    "hi 💩 x item",
  );
  expect(plainText("```\ncode\n```")).toBe("code");
  expect(plainText("# head `c`")).toBe("head c");
  expect(plainText("😀".repeat(10), 3)).toBe("😀😀😀...");
});

test("nameMatches checks every alias, case-insensitive", () => {
  expect(nameMatches(["face with tears of joy", "joy"], "JOY")).toBe(true);
  expect(nameMatches(["grinning face", "grinning"], "joy")).toBe(false);
});

test("withTone picks the variant, index 0 included; neutral keeps base", () => {
  const v = ["1f476-1f3fb", "1f476-1f3fc"];
  expect(withTone("1f476", v, "1f3fb")).toBe("1f476-1f3fb");
  expect(withTone("1f476", v, "1f3fc")).toBe("1f476-1f3fc");
  expect(withTone("1f476", v, "neutral")).toBe("1f476");
  expect(withTone("1f600", undefined, "1f3fc")).toBe("1f600");
});

test("shortcodes with escaped underscores resolve and autocomplete", () => {
  expect(replaceShortcodes(":rolling\\_on\\_the\\_floor\\_laughing:")).toBe(
    "🤣",
  );
  expect(findShortcodes("rolling\\_on").length).toBeGreaterThan(0);
  expect(plainText("snake\\_case \\*x\\*")).toBe("snake_case *x*");
});

test("shortcodes.json stays in sync with emojis.json", async () => {
  const { default: src } =
    await import("../src/components/ui/inputs/EmojiPicker/emojis.json");
  const { default: flat } = await import("../src/shortcodes.json");
  const want: Record<string, string> = {};
  for (const e of Object.values(src).flat())
    for (const a of e.n.slice(1)) want[a] = e.u;
  expect(flat).toEqual(want);
});
