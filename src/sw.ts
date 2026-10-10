/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { plainText } from "./emoji";

declare const self: ServiceWorkerGlobalScope;

// app shell only; /api is never cached
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//],
  }),
);

// silent updates: each new deploy activates (skipWaiting + clientsClaim),
// so a closed-and-reopened client always gets the current bundle
self.addEventListener("install", () => void self.skipWaiting());
clientsClaim();

// the deployed UpdatePrompt still posts SKIP_WAITING; harmless once auto
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

// server payload is identifiers only; text comes from an authed fetch
async function describe(
  roomId: string,
  messageId: string,
): Promise<{ title: string; body: string }> {
  try {
    const [m, r] = await Promise.all([
      fetch(`/api/v1/messages/${messageId}`).then((x) => x.json()),
      fetch(`/api/v1/rooms/${roomId}`).then((x) => x.json()),
    ]);
    const who = m.author?.display_name;
    if (!who || typeof m.body !== "string") throw new Error("no message");
    const group = r.type !== "direct" && r.name;
    return {
      title: group ? `${r.name} — ${who}` : who,
      body: plainText(m.body),
    };
  } catch {
    // session expired or fetch failed: generic is the safe fallback
    return { title: "goChatHub", body: "New message" };
  }
}

self.addEventListener("push", (e) => {
  const text = e.data?.text() ?? "";
  let msg: { type?: string; room_id?: string; message_id?: string } = {};
  try {
    msg = JSON.parse(text);
  } catch {
    // not JSON: the registration validation token — hand it to the page
    e.waitUntil(
      self.clients
        .matchAll({ type: "window" })
        .then((cs) => cs.forEach((c) => c.postMessage({ validation: text }))),
    );
    return;
  }
  if (msg.type !== "chat.message" || !msg.room_id || !msg.message_id) return;
  const { room_id: roomId, message_id: messageId } = msg;
  e.waitUntil(
    (async () => {
      const cs = await self.clients.matchAll({ type: "window" });
      // app visible: the WS path already updates the UI
      if (cs.some((c) => c.visibilityState === "visible")) return;
      const { title, body } = await describe(roomId, messageId);
      await self.registration.showNotification(title, {
        body,
        tag: roomId,
        icon: "/pwa-192.png",
        data: { roomId },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const roomId: string | undefined = e.notification.data?.roomId;
  e.waitUntil(
    (async () => {
      const cs = await self.clients.matchAll({ type: "window" });
      const open = cs[0];
      if (open && roomId) {
        await open.focus();
        open.postMessage({ openRoom: roomId });
      } else if (open) {
        await open.focus();
      } else {
        await self.clients.openWindow(roomId ? `/chat/${roomId}/` : "/");
      }
    })(),
  );
});
