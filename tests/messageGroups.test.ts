import { test, expect } from "bun:test";
import { groupMessages } from "../src/messageGroups";

const at = (sender: string, iso: string) => ({
  sender: { id: sender },
  date: iso,
});

test("same sender within 5 minutes stacks; the first message never does", () => {
  const out = groupMessages([
    at("a", "2021-10-28T13:06:00"),
    at("a", "2021-10-28T13:10:59"),
    at("a", "2021-10-28T13:16:00"), // 5m01s after the previous
  ]);
  expect(out.map((g) => g.stacked)).toEqual([false, true, false]);
});

test("different sender breaks the stack", () => {
  const out = groupMessages([
    at("a", "2021-10-28T13:06:00"),
    at("b", "2021-10-28T13:07:00"),
    at("a", "2021-10-28T13:08:00"),
  ]);
  expect(out.map((g) => g.stacked)).toEqual([false, false, false]);
});

test("a new local day starts a day pill and never stacks", () => {
  const out = groupMessages([
    at("a", "2021-10-28T23:58:00"),
    at("a", "2021-10-29T00:01:00"), // 3 minutes later, next day
  ]);
  expect(out.map((g) => g.newDay)).toEqual([true, true]);
  expect(out[1]!.stacked).toBe(false);
});

test("same day keeps newDay false after the first", () => {
  const out = groupMessages([
    at("a", "2021-10-28T09:00:00"),
    at("b", "2021-10-28T17:00:00"),
  ]);
  expect(out.map((g) => g.newDay)).toEqual([true, false]);
});
