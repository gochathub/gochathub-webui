<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import SignupInvites from "@src/components/views/AdminView/SignupInvites.vue";
import MailSettings from "@src/components/views/AdminView/MailSettings.vue";

// Add admin sections here; the route param picks one.
const sections = [
  { slug: "signup-invites", title: "Signup invites", component: SignupInvites },
  { slug: "email", title: "Email provider", component: MailSettings },
];

const route = useRoute();
const active = computed(
  () => sections.find((s) => s.slug === route.params.section) ?? sections[0],
);
</script>

<template>
  <div class="w-full h-full flex xs:flex-col md:flex-row bg-canvas">
    <aside
      class="xs:w-full md:w-60 shrink-0 p-5 bg-surface border-hairline xs:border-b md:border-b-0 md:border-r"
    >
      <router-link
        :to="{ name: 'No-Chat' }"
        class="body-3 text-muted underline"
      >
        ← Back to chat
      </router-link>
      <p class="heading-2 text-fg mt-5 mb-4">Admin</p>
      <nav aria-label="Admin sections">
        <router-link
          v-for="s in sections"
          :key="s.slug"
          :to="{ name: 'Admin', params: { section: s.slug } }"
          class="block body-2 py-2"
          :class="s === active ? 'text-accent-text' : 'text-muted'"
        >
          {{ s.title }}
        </router-link>
      </nav>
    </aside>
    <main class="grow p-6 overflow-y-auto scrollbar-thin">
      <component :is="active.component" />
    </main>
  </div>
</template>
