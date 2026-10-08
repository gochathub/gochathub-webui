<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import { renderMarkdown } from "@src/api/markdown";
import type { HelpPage } from "@src/help";
import { loadHelpIndex, loadHelpPage } from "@src/helpPages";

// One help page, rendered. Used by the /help route and the help drawer;
// the parent owns navigation (it gets `navigate` for internal links).
const props = defineProps<{ slug?: string; anchor?: string }>();
const emit = defineEmits<{ navigate: [to: string] }>();

const root = ref<HTMLElement>();
const page = ref<HelpPage | undefined>();
const missing = ref(false);

watch(
  () => [props.slug, props.anchor],
  async () => {
    const target = props.slug || (await loadHelpIndex())[0]?.slug;
    page.value = target ? await loadHelpPage(target) : undefined;
    missing.value = !page.value;
    await nextTick();
    if (props.anchor) {
      root.value
        ?.querySelector(`#${CSS.escape(props.anchor)}`)
        ?.scrollIntoView();
    }
  },
  { immediate: true },
);

const html = computed(() =>
  page.value ? renderMarkdown(page.value.body, { doc: true }) : "",
);

// internal links stay in-app; the parent decides how
const handleClick = (e: MouseEvent) => {
  const a = (e.target as HTMLElement).closest("a");
  const href = a?.getAttribute("href");
  if (href?.startsWith("/") && !a?.target) {
    e.preventDefault();
    emit("navigate", href);
  }
};

const docSpacing = "[&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_pre]:mb-3";
</script>

<template>
  <article ref="root" class="min-w-0 body-2" @click="handleClick">
    <p v-if="missing">Page not found.</p>
    <!-- eslint-disable-next-line vue/no-v-html -- renderMarkdown escapes HTML first -->
    <div v-else :class="docSpacing" v-html="html" />
  </article>
</template>
