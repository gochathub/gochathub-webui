// Admin mail provider settings (ADR-026). The server returns every provider
// with its form fields; secrets are write-only (has_secret flags only).
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { unwrap } from "@src/api/client";
import type { components } from "@src/api/schema";

export type MailSettings = components["schemas"]["MailSettings"];
export type MailProvider = components["schemas"]["MailProvider"];

export const useMailSettingsStore = defineStore("mailSettings", () => {
  const settings = ref<MailSettings | undefined>(undefined);

  async function load() {
    settings.value = await unwrap(await client.GET("/admin/mail-settings"));
  }

  // blank secrets keep the stored value
  async function save(
    provider: MailProvider["id"],
    values: Record<string, string>,
    activate: boolean,
  ) {
    settings.value = await unwrap(
      await client.PUT("/admin/mail-settings/{provider}", {
        params: { path: { provider: provider as never } },
        body: { values, activate },
      }),
    );
  }

  // "" turns mail off
  async function setActive(active: string) {
    settings.value = await unwrap(
      await client.PUT("/admin/mail-settings", { body: { active } }),
    );
  }

  async function clear(provider: MailProvider["id"]) {
    settings.value = await unwrap(
      await client.DELETE("/admin/mail-settings/{provider}", {
        params: { path: { provider: provider as never } },
      }),
    );
  }

  async function sendTest(to: string) {
    await unwrap(
      await client.POST("/admin/mail-settings/test", { body: { to } }),
    );
  }

  return { settings, load, save, setActive, clear, sendTest };
});

export default useMailSettingsStore;
