<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import useAuthStore from "@src/store/auth";
import { renderMarkdown } from "@src/api/markdown";
import { loadHelpIndex, loadHelpPage } from "@src/helpPages";
import type { HelpPage } from "@src/help";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const index = ref<Awaited<ReturnType<typeof loadHelpIndex>>>([]);
const page = ref<HelpPage | undefined>();
const missing = ref(false);

// no slug = first page by weight
const slug = computed(
  () => (route.params.slug as string) || index.value[0]?.slug,
);

watch(
  slug,
  async (s) => {
    if (!index.value.length) index.value = await loadHelpIndex();
    const target = s ?? index.value[0]?.slug;
    page.value = target ? await loadHelpPage(target) : undefined;
    missing.value = !page.value;
  },
  { immediate: true },
);

const html = computed(() =>
  page.value ? renderMarkdown(page.value.body, { doc: true }) : "",
);

// internal links go through the router, not a full reload
const handleClick = (e: MouseEvent) => {
  const a = (e.target as HTMLElement).closest("a");
  const href = a?.getAttribute("href");
  if (href?.startsWith("/") && !a?.target) {
    e.preventDefault();
    router.push(href);
  }
};

const back = () =>
  router.push(
    auth.me
      ? { name: "No-Chat" }
      : { name: "Access", params: { method: "sign-in" } },
  );
</script>

<template>
  <div class="h-full overflow-y-auto bg-canvas text-fg scrollbar-thin">
    <div class="max-w-4xl mx-auto p-5 md:flex md:gap-10">
      <nav aria-label="Help pages" class="md:w-56 shrink-0 mb-6">
        <button class="body-3 text-muted underline mb-4" @click="back">
          {{ auth.me ? "Back to chat" : "Back to sign in" }}
        </button>
        <ul>
          <li v-for="p in index" :key="p.slug" class="mb-2">
            <router-link
              :to="`/help/${p.slug}`"
              class="body-2"
              :class="p.slug === slug ? 'text-fg font-semibold' : 'text-muted'"
              :aria-current="p.slug === slug ? 'page' : undefined"
            >
              {{ p.title }}
            </router-link>
          </li>
        </ul>
      </nav>

      <article class="grow min-w-0 body-2" @click="handleClick">
        <p v-if="missing" class="body-2">Page not found.</p>
        <!-- eslint-disable-next-line vue/no-v-html -- renderMarkdown escapes HTML first -->
        <div v-else class="[&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3" v-html="html" />
      </article>
    </div>
  </div>
</template>
