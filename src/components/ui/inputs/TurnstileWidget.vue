<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import { loadTurnstile } from "@src/turnstile";

const props = defineProps<{ siteKey: string }>();
// token: solved; expired: token gone (timeout/error/expiry) — block submit
const emit = defineEmits<{ token: [value: string]; expired: [] }>();

const el = ref<HTMLElement>();
let widgetId: string | undefined;

onMounted(async () => {
  try {
    const turnstile = await loadTurnstile();
    widgetId = turnstile.render(el.value!, {
      sitekey: props.siteKey,
      action: "login",
      callback: (t: string) => emit("token", t),
      "expired-callback": () => emit("expired"),
      "error-callback": () => emit("expired"),
      "timeout-callback": () => emit("expired"),
    });
  } catch {
    emit("expired");
  }
});

onBeforeUnmount(() => {
  if (widgetId) window.turnstile?.remove(widgetId);
});

// tokens are single-use: call after every submit attempt
defineExpose({
  reset: () => {
    if (widgetId) window.turnstile?.reset(widgetId);
    emit("expired");
  },
});
</script>

<template>
  <div ref="el" class="mt-4"></div>
</template>
