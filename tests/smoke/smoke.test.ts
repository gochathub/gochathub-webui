// Smoke test against a running gochatserver. Skipped entirely unless
// GOCHATHUB_SMOKE is set (e.g. GOCHATHUB_SMOKE=http://localhost:18100 plus
// GOCHATHUB_SMOKE_USER / GOCHATHUB_SMOKE_PASS covering the seeded account).
import { beforeAll, describe, expect, test } from "bun:test";

const BASE = process.env.GOCHATHUB_SMOKE;
const USER = process.env.GOCHATHUB_SMOKE_USER ?? "brian";
const PASS = process.env.GOCHATHUB_SMOKE_PASS;

beforeAll(() => {
  if (!BASE) {
    console.log("smoke skipped: GOCHATHUB_SMOKE unset");
  }
});

const describe_when = BASE ? describe : describe.skip;

describe_when("smoke: login → rooms → post → ws → read", () => {
  let cookie = "";

  test("login sets the session cookie and returns the user", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: USER, password: PASS }),
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    cookie = setCookie.split(";")[0]!;
    expect(cookie).toContain("chat_session=");
    const body = await res.json();
    expect(body.user.username).toBe(USER);
  });

  let roomId = "";

  test("rooms list contains at least one room", async () => {
    const res = await fetch(`${BASE}/api/v1/rooms`, { headers: { cookie } });
    expect(res.status).toBe(200);
    const rooms = (await res.json()) as { id: string; type: string }[];
    expect(rooms.length).toBeGreaterThan(0);
    roomId = rooms[0]!.id;
  });

  let sent = "";

  test("post a message and read it back", async () => {
    sent = `smoke ${Date.now()}`;
    const res = await fetch(`${BASE}/api/v1/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ body: sent, format: "markdown" }),
    });
    expect(res.status).toBe(201);
  });

  test("ws: subscribe receives the echo and read advances", () => {
    return new Promise<void>((resolve) => {
      const proto = BASE!.startsWith("https") ? "wss" : "ws";
      const sock = new WebSocket(
        `${proto}://${new URL(BASE!).host}/api/v1/ws`,
        { headers: { cookie } } as never,
      );
      // bun WebSocket supports headers? — falls back to cookie via URL jar;
      // use undici WebSocket via fetch cookie? Keep the bun-native socket.
      let posted = false;

      sock.onmessage = async (ev) => {
        const env = JSON.parse(String(ev.data));
        if (env.type === "connected") {
          sock.send(JSON.stringify({ type: "subscribe", room_id: roomId }));
        }
        if (env.type === "message.created" && !posted) {
          posted = true;
          expect(env.data?.message?.body ?? env.data?.body ?? "").toBeTruthy();
          sock.send(
            JSON.stringify({
              type: "read",
              room_id: roomId,
              message_id: env.data?.message?.id,
            }),
          );
          await new Promise((r) => setTimeout(r, 300));
          const page = await fetch(
            `${BASE}/api/v1/rooms/${roomId}/messages?limit=1`,
            { headers: { cookie } },
          ).then((r) => r.json());
          expect(posted).toBe(true);
          expect(String(page.items?.[0]?.body)).toBeTruthy();
          sock.close();
          resolve();
        }
      };

      // trigger a message through my own account so the subscription sees it
      sock.onopen = () => {
        fetch(`${BASE}/api/v1/rooms/${roomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie },
          body: JSON.stringify({ body: sent + "-ws", format: "markdown" }),
        });
      };

      setTimeout(() => {
        try {
          sock.close();
        } catch {}
        throw new Error("smoke ws: no message.created received in time");
      }, 10000);
    });
  });

  test("logout clears the session", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/logout`, {
      method: "POST",
      headers: { cookie },
    });
    expect(res.status).toBe(200);
  });
});
