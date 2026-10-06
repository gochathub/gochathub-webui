// Preferences (ADR-013): server booleans mirror the template's ISettings
// privacy keys; toggling saves to the server immediately.
import { defineStore } from "pinia";

import client, { unwrap } from "@src/api/client";
import useStore from "@src/store/store";
import type { ISettings } from "@src/types";

// ISettings key → server preference field
const TO_SERVER: Record<string, string> = {
  lastSeen: "last_seen_visible",
  readReceipt: "read_receipts",
  joiningGroups: "allow_group_invites",
  privateMessages: "allow_private_messages",
};

export const usePrefsStore = defineStore("prefs", () => {
  const chat = useStore();

  async function load() {
    const prefs = await unwrap(await client.GET("/users/me/preferences"));
    chat.$patch({
      settings: {
        ...chat.settings,
        lastSeen: prefs.last_seen_visible,
        readReceipt: prefs.read_receipts,
        joiningGroups: prefs.allow_group_invites,
        privateMessages: prefs.allow_private_messages,
      },
    });
  }

  async function set(key: string, value: boolean) {
    const serverKey = TO_SERVER[key];
    chat.settings[key as keyof ISettings] = value;
    if (!serverKey) return; // local-only setting (dark mode etc.)
    await unwrap(
      await client.PATCH("/users/me/preferences", {
        body: { [serverKey]: value },
      }),
    );
  }

  return { load, set };
});

export default usePrefsStore;
