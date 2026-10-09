// Preferences (ADR-013): server booleans mirror the template's ISettings
// privacy keys; toggling saves to the server immediately.
import { defineStore } from "pinia";
import { ref } from "vue";

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

// Accent swatches; mirrors the contract's primary_color enum. The stored
// value is the light-mode hex; --accent drives the theme, shades derive in
// CSS (color-mix).
export const ACCENT_SWATCHES: { name: string; hex: string }[] = [
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Pink", hex: "#db2777" },
  { name: "Red", hex: "#dc2626" },
  { name: "Orange", hex: "#c2410c" },
  { name: "Amber", hex: "#b45309" },
  { name: "Lime", hex: "#4d7c0f" },
  { name: "Green", hex: "#15803d" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Cyan", hex: "#0e7490" },
  { name: "Sky", hex: "#0369a1" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Slate", hex: "#475569" },
  { name: "Charcoal", hex: "#27313a" },
];
export const ACCENT_DEFAULT = "#4f46e5";

/** Applies the accent to the whole page (overrides the stylesheet default). */
export function applyAccent(hex: string): void {
  document.documentElement.style.setProperty("--accent", hex);
}

export const usePrefsStore = defineStore("prefs", () => {
  const chat = useStore();
  // grammar check (Harper); toggle + personal dictionary sync via the server
  const spellcheck = ref(false);
  const words = ref<string[]>([]);
  const primaryColor = ref(ACCENT_DEFAULT);

  async function load() {
    const prefs = await unwrap(await client.GET("/users/me/preferences"));
    spellcheck.value = prefs.spellcheck_enabled;
    words.value = prefs.spellcheck_words;
    primaryColor.value = prefs.primary_color;
    applyAccent(prefs.primary_color);
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

  async function setSpellcheck(value: boolean) {
    spellcheck.value = value;
    await unwrap(
      await client.PATCH("/users/me/preferences", {
        body: { spellcheck_enabled: value },
      }),
    );
  }

  async function addWord(word: string) {
    const w = word.trim().slice(0, 64);
    if (!w || words.value.includes(w)) return;
    words.value = [...words.value, w];
    await unwrap(
      await client.PATCH("/users/me/preferences", {
        body: { spellcheck_words: words.value },
      }),
    );
  }

  async function setPrimaryColor(hex: string) {
    const previous = primaryColor.value;
    primaryColor.value = hex;
    applyAccent(hex);
    try {
      const prefs = await unwrap(
        await client.PATCH("/users/me/preferences", {
          body: { primary_color: hex },
        }),
      );
      primaryColor.value = prefs.primary_color;
      applyAccent(prefs.primary_color);
    } catch (e) {
      primaryColor.value = previous;
      applyAccent(previous);
      throw e;
    }
  }

  return {
    load,
    set,
    spellcheck,
    words,
    setSpellcheck,
    addWord,
    primaryColor,
    setPrimaryColor,
  };
});

export default usePrefsStore;
