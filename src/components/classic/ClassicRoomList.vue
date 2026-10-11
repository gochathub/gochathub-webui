<script setup lang="ts">
import type { IConversation } from "@src/types";

import { computed, inject, onMounted, ref } from "vue";
import type { Ref } from "vue";
import { useRoute } from "vue-router";

import useStore from "@src/store/store";
import { getActiveConversationId, getName } from "@src/utils";
import { useRoomSort } from "@src/composables/useRoomSort";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/vue/24/outline";
import NoConversation from "@src/components/states/empty-states/NoConversation.vue";
import Circle2Lines from "@src/components/states/loading-states/Circle2Lines.vue";
import ArchivedButton from "@src/components/views/HomeView/Sidebar/Conversations/ArchivedButton.vue";
import Conversation from "@src/components/views/HomeView/Sidebar/Conversations/Conversation.vue";

const store = useStore();
const route = useRoute();
const sort = useRoomSort();
// set by ClassicShell (top-bar search box)
const filter = inject("roomFilter") as Ref<string>;

const openArchive = ref(false);
const collapsed = ref({ channels: false, direct: false });

onMounted(() => {
  const id = getActiveConversationId(route);
  if (store.archivedConversations.some((c) => c.id === id))
    openArchive.value = true;
});

const rooms = computed(() => {
  const source = openArchive.value
    ? store.archivedConversations
    : store.conversations;
  const q = filter.value.trim().toLowerCase();
  const list = q
    ? source.filter((c) => (getName(c) ?? "").toLowerCase().includes(q))
    : [...source];
  const name = (c: IConversation) => (getName(c) ?? "").toLowerCase();
  return list.sort((a, b) =>
    sort.value === "name"
      ? name(a).localeCompare(name(b))
      : (b.lastMessage?.date ?? "").localeCompare(a.lastMessage?.date ?? "") ||
        name(a).localeCompare(name(b)),
  );
});

const sections = computed(() => [
  {
    key: "channels" as const,
    title: "Channels",
    items: rooms.value.filter((c) => c.type !== "direct"),
  },
  {
    key: "direct" as const,
    title: "Direct messages",
    items: rooms.value.filter((c) => c.type === "direct"),
  },
]);
</script>

<template>
  <div role="list" aria-label="conversations" class="py-1">
    <template v-if="store.status === 'loading' || store.delayLoading">
      <Circle2Lines v-for="_idx in 6" :key="_idx" />
    </template>
    <template v-else>
      <ArchivedButton
        v-if="store.archivedConversations.length > 0"
        :open="openArchive"
        @click="openArchive = !openArchive"
      />
      <NoConversation
        v-if="
          store.conversations.length === 0 &&
          store.archivedConversations.length === 0
        "
      />
      <template v-for="s in sections" :key="s.key">
        <template v-if="s.items.length > 0">
          <button
            class="w-full px-4 pt-4 pb-2 flex items-center heading-2 text-fg"
            :aria-expanded="!collapsed[s.key]"
            @click="collapsed[s.key] = !collapsed[s.key]"
          >
            <component
              :is="collapsed[s.key] ? ChevronRightIcon : ChevronDownIcon"
              class="w-4 h-4 mr-3"
            />
            {{ s.title }}
          </button>
          <template v-if="!collapsed[s.key]">
            <Conversation
              v-for="c in s.items"
              :key="c.id"
              :conversation="c"
              classic
              role="listitem"
            />
          </template>
        </template>
      </template>
    </template>
  </div>
</template>
