import { test, expect } from "bun:test";
import { mapRoom } from "../src/api/mappers";

const room = {
  id: "r1",
  type: "private" as const,
  name: "secret team",
  avatar_url: "",
};

test("mapRoom carries the Rocket.Chat marker", () => {
  expect(mapRoom({ ...room, source: "rocket_chat" }).source).toBe(
    "rocket_chat",
  );
});

test("native rooms have no source", () => {
  expect(mapRoom(room).source).toBeUndefined();
  expect(mapRoom({ ...room, source: "" }).source).toBeUndefined();
});
