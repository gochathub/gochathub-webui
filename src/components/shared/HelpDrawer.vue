<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";

import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";
import { XMarkIcon } from "@heroicons/vue/24/outline";

import { closeHelp, helpDrawer, openHelp } from "@src/helpDrawer";
import { loadHelpIndex } from "@src/helpPages";

import HelpContent from "@src/components/shared/HelpContent.vue";

const panel = ref<HTMLElement>();
const body = ref<HTMLElement>();
const pages = ref<Awaited<ReturnType<typeof loadHelpIndex>>>([]);

// focus-trap stacks: activating pauses an open modal's trap, closing resumes it
const { activate, deactivate } = useFocusTrap(panel, {
  escapeDeactivates: false,
  allowOutsideClick: true,
});

// Esc closes only the drawer: capture + stop before a modal's own listener
const onKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    e.stopPropagation();
    closeHelp();
  }
};

watch(
  () => !!helpDrawer.value,
  async (open) => {
    if (open) {
      document.addEventListener("keydown", onKey, true);
      pages.value = await loadHelpIndex();
      await nextTick();
      activate();
    } else {
      document.removeEventListener("keydown", onKey, true);
      deactivate();
    }
  },
);
onUnmounted(() => document.removeEventListener("keydown", onKey, true));

// a new topic starts at the top unless it has an anchor to scroll to
watch(helpDrawer, () => {
  if (body.value && !helpDrawer.value?.anchor) body.value.scrollTop = 0;
});
</script>

<template>
  <template v-if="helpDrawer">
    <div class="fixed inset-0 z-40 bg-black/30" @click="closeHelp" />
    <aside
      ref="panel"
      role="dialog"
      aria-modal="true"
      aria-label="Help"
      class="fixed z-50 flex flex-col bg-surface text-fg shadow-xl border-hairline xs:inset-x-0 xs:bottom-0 xs:top-12 xs:rounded-t xs:border-t md:inset-y-0 md:left-auto md:right-0 md:w-[28rem] md:rounded-none md:border-t-0 md:border-l"
    >
      <div class="flex items-center gap-3 px-5 py-3 border-b border-hairline">
        <select
          class="grow min-w-0 px-2 py-1 rounded border border-hairline bg-surface text-fg body-2"
          aria-label="Help page"
          :value="helpDrawer.slug || pages[0]?.slug"
          @change="
            (e) => openHelp(`/help/${(e.target as HTMLSelectElement).value}`)
          "
        >
          <option v-for="p in pages" :key="p.slug" :value="p.slug">
            {{ p.title }}
          </option>
        </select>
        <router-link
          :to="`/help/${helpDrawer.slug}${helpDrawer.anchor ? '#' + helpDrawer.anchor : ''}`"
          class="body-3 text-muted underline shrink-0"
          @click="closeHelp"
        >
          Open full help
        </router-link>
        <button
          type="button"
          class="p-1 text-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-text rounded"
          aria-label="Close help"
          @click="closeHelp"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
      <div ref="body" class="grow overflow-y-auto p-5 scrollbar-thin">
        <HelpContent
          :slug="helpDrawer.slug"
          :anchor="helpDrawer.anchor"
          @navigate="openHelp"
        />
      </div>
    </aside>
  </template>
</template>
