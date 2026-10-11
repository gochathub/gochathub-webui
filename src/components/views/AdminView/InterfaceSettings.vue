<script setup lang="ts">
import { onMounted, ref } from "vue";

import { ApiError } from "@src/api/client";
import type { Layout } from "@src/store/prefs";
import useUiSettingsStore from "@src/store/uiSettings";

const ui = useUiSettingsStore();

const error = ref("");
const notice = ref("");
const loadFailed = ref(false);

onMounted(() => ui.load().catch(() => (loadFailed.value = true)));

const change = async (event: Event) => {
  error.value = notice.value = "";
  try {
    await ui.setDefaultLayout(
      (event.target as HTMLSelectElement).value as Layout,
    );
    notice.value = "Saved. Users on the default pick it up on their next load.";
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === "validation"
        ? e.message
        : "Something went wrong. Please try again.";
  }
};
</script>

<template>
  <div class="max-w-xl">
    <h1 class="heading-1 text-fg mb-2">Interface</h1>
    <p class="body-2 text-muted mb-5">
      The layout everyone gets unless they choose their own in Appearance.
    </p>

    <p v-if="loadFailed" role="alert" class="body-3 text-error">
      Could not load settings. Please try again.
    </p>
    <template v-else-if="ui.defaultLayout">
      <label for="default-layout" class="body-2 text-muted mb-3 block">
        Default layout
      </label>
      <select
        id="default-layout"
        :value="ui.defaultLayout"
        class="w-full mb-5 px-2 py-2 rounded border border-hairline bg-surface text-fg body-2"
        @change="change"
      >
        <option value="modern">Modern</option>
        <option value="classic">Classic (Rocket.Chat style)</option>
      </select>
      <p v-if="error" role="alert" class="body-3 text-error mb-4">
        {{ error }}
      </p>
      <p v-if="notice" role="status" class="body-3 text-muted mb-4">
        {{ notice }}
      </p>
    </template>
  </div>
</template>
