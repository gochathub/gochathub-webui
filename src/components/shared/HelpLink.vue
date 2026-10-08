<script setup lang="ts">
import { QuestionMarkCircleIcon } from "@heroicons/vue/24/outline";

import { openHelp } from "@src/helpDrawer";

// to: "/help/<slug>#<heading-id>"; label names the topic for screen readers.
defineProps<{ to: string; label: string }>();
</script>

<template>
  <button
    type="button"
    class="inline-flex p-1 rounded-full text-muted hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors"
    :title="`Help: ${label}`"
    :aria-label="`Help: ${label}`"
    @click.stop.prevent="openHelp(to)"
  >
    <QuestionMarkCircleIcon class="w-5 h-5" />
  </button>
</template>
