// Web Push registration against the server's /devices + /push/vapid contract.
// The service worker (sw.ts) shows notifications; this owns subscribe/teardown.
import client, { unwrap } from "@src/api/client";

const DEVICE_KEY = "pushDeviceId";

export const pushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window;

// a registered device means push delivers; the WS Notification path stands down
export const pushActive = () => !!localStorage.getItem(DEVICE_KEY);

function b64urlToBytes(s: string) {
  const raw = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new Uint8Array(Array.from(raw, (c) => c.charCodeAt(0)));
}

// 'Notification' permission must already be granted
export async function enablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const { public_key } = await unwrap(await client.GET("/push/vapid"));
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: b64urlToBytes(public_key),
  });
  const { endpoint, keys } = sub.toJSON();
  if (!endpoint || !keys) throw new Error("push subscription incomplete");

  // the SW relays the decrypted validation ping token to us
  let token: string | undefined;
  let notify: (() => void) | undefined;
  const onMsg = (e: MessageEvent) => {
    if (typeof e.data?.validation !== "string") return;
    token = e.data.validation;
    notify?.();
  };
  navigator.serviceWorker.addEventListener("message", onMsg);
  try {
    const res = await unwrap(
      await client.POST("/devices", {
        body: {
          platform: "web",
          client_name: "goChatHub web",
          push_registration: {
            endpoint,
            public_key: keys.p256dh,
            auth_secret: keys.auth,
          },
        },
      }),
    );
    const deviceId = res.device_id;
    localStorage.setItem(DEVICE_KEY, deviceId);
    if (res.validation_required) {
      // ponytail: 10 s ceiling for the ping to arrive, then fail loudly
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(
          () => reject(new Error("push validation timed out")),
          10_000,
        );
        notify = () => {
          if (!token) return;
          clearTimeout(t);
          client
            .POST("/devices/{deviceId}/validate", {
              params: { path: { deviceId } },
              body: { token },
            })
            .then((r) => unwrap(r))
            .then(() => resolve(), reject);
        };
        notify();
      });
    }
  } catch (err) {
    await disablePush();
    throw err;
  } finally {
    navigator.serviceWorker.removeEventListener("message", onMsg);
  }
}

export async function disablePush(): Promise<void> {
  const deviceId = localStorage.getItem(DEVICE_KEY);
  localStorage.removeItem(DEVICE_KEY);
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await (await reg?.pushManager.getSubscription())?.unsubscribe();
    if (deviceId) {
      await client.DELETE("/devices/{deviceId}", {
        params: { path: { deviceId } },
      });
    }
  } catch {
    // best effort: the server prunes dead endpoints on 404/410
  }
}
