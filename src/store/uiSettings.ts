// Admin interface settings (ADR-027): the instance-wide default layout.
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { unwrap } from "@src/api/client";
import type { Layout } from "@src/store/prefs";

export const useUiSettingsStore = defineStore("uiSettings", () => {
  const defaultLayout = ref<Layout | undefined>(undefined);

  async function load() {
    defaultLayout.value = (
      await unwrap(await client.GET("/admin/ui-settings"))
    ).default_layout;
  }

  async function setDefaultLayout(value: Layout) {
    defaultLayout.value = (
      await unwrap(
        await client.PUT("/admin/ui-settings", {
          body: { default_layout: value },
        }),
      )
    ).default_layout;
  }

  return { defaultLayout, load, setDefaultLayout };
});

export default useUiSettingsStore;
