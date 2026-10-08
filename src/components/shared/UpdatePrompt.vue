<script setup lang="ts">
import { useRegisterSW } from "virtual:pwa-register/vue";

import Button from "@src/components/ui/inputs/Button.vue";

const HOUR = 60 * 60 * 1000;

// installed PWAs stay open for days: check hourly and on becoming visible.
// "Later" hides the toast; the next check re-raises it while a worker waits.
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_url, r) {
    if (!r) return;
    const check = async () => {
      if (!navigator.onLine) return;
      try {
        await r.update();
      } catch {
        return; // server unreachable; try next tick
      }
      if (r.waiting) needRefresh.value = true;
    };
    setInterval(check, HOUR);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) void check();
    });
  },
});
</script>

<template>
  <div
    v-if="needRefresh"
    role="alert"
    class="fixed right-4 bottom-4 z-50 max-w-sm p-4 rounded shadow-lg bg-select"
  >
    <p class="body-2 text-fg mb-4">
      A new version is available. Would you like to upgrade?
    </p>
    <div class="flex">
      <Button
        class="contained-primary contained-text mr-2"
        @click="updateServiceWorker(true)"
      >
        Upgrade
      </Button>
      <Button
        class="outlined-primary outlined-text"
        @click="needRefresh = false"
      >
        Later
      </Button>
    </div>
  </div>
</template>
