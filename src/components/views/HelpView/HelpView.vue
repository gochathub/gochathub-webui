<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import useAuthStore from "@src/store/auth";
import { loadHelpIndex } from "@src/helpPages";

import HelpContent from "@src/components/shared/HelpContent.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const index = ref<Awaited<ReturnType<typeof loadHelpIndex>>>([]);
void loadHelpIndex().then((i) => (index.value = i));

// no slug = first page by weight (HelpContent resolves the same default)
const slug = computed(
  () => (route.params.slug as string) || index.value[0]?.slug,
);

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

      <HelpContent
        class="grow"
        :slug="route.params.slug as string"
        :anchor="route.hash.slice(1)"
        @navigate="(to) => router.push(to)"
      />
    </div>
  </div>
</template>
