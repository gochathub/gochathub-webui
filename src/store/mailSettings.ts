// Admin SMTP settings (ADR-026). The password is write-only: the server only
// reports has_password.
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { unwrap } from "@src/api/client";
import type { components } from "@src/api/schema";

export type MailSettings = components["schemas"]["MailSettings"];
export type MailSettingsInput = components["schemas"]["PutMailSettingsRequest"];

export const useMailSettingsStore = defineStore("mailSettings", () => {
  const settings = ref<MailSettings | undefined>(undefined);

  async function load() {
    settings.value = await unwrap(await client.GET("/admin/mail-settings"));
  }

  async function save(body: MailSettingsInput) {
    settings.value = await unwrap(
      await client.PUT("/admin/mail-settings", { body }),
    );
  }

  async function sendTest(to: string) {
    await unwrap(
      await client.POST("/admin/mail-settings/test", { body: { to } }),
    );
  }

  return { settings, load, save, sendTest };
});

export default useMailSettingsStore;
