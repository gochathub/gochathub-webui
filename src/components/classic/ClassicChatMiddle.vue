<script setup lang="ts">
import type { IConversation } from "@src/types";
import type { Ref } from "vue";

import { computed, inject } from "vue";

import useStore from "@src/store/store";
import { formatDay } from "@src/api/mappers";
import { groupMessages } from "@src/messageGroups";
import { useMessageScroll } from "@src/composables/useMessageScroll";

import Message from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Message.vue";

const props = defineProps<{
  handleSelectMessage: (messageId: string) => void;
  handleDeselectMessage: (messageId: string) => void;
  selectedMessages: string[];
}>();

const store = useStore();
const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

const { container, highlightId, isSelf, handleScroll } =
  useMessageScroll(activeConversation);

const rows = computed(() => {
  const messages = activeConversation.value?.messages ?? [];
  const groups = groupMessages(messages);
  return messages.map((message, i) => ({ message, ...groups[i]! }));
});
</script>

<template>
  <div
    ref="container"
    class="grow px-5 py-3 flex flex-col overflow-y-scroll scrollbar-thin"
    @scroll.passive="handleScroll"
  >
    <template v-if="store.status !== 'loading'">
      <div
        v-for="row in rows"
        :key="row.message.id"
        :data-message-id="row.message.id"
        class="rounded transition-colors duration-500"
        :class="{ 'bg-select/60': highlightId === row.message.id }"
      >
        <!--day pill-->
        <div
          v-if="row.newDay"
          class="my-3 flex items-center"
          role="separator"
          :aria-label="formatDay(row.message.date)"
        >
          <div class="h-px grow bg-hairline"></div>
          <p
            class="mx-3 px-2.5 rounded-full bg-select body-1 font-bold text-fg"
          >
            {{ formatDay(row.message.date) }}
          </p>
          <div class="h-px grow bg-hairline"></div>
        </div>

        <!--first unread message-->
        <div
          v-if="row.message.id === activeConversation?.firstUnreadId"
          class="my-3 flex items-center text-error"
          role="separator"
          aria-label="unread messages"
        >
          <div class="h-px grow bg-current"></div>
          <p class="ml-3 body-2 font-bold">unread messages</p>
        </div>

        <Message
          classic
          :message="row.message"
          :self="isSelf(row.message)"
          :follow-up="row.stacked"
          :stacked="row.stacked"
          :selected="props.selectedMessages.includes(row.message.id)"
          :handle-select-message="handleSelectMessage"
          :handle-deselect-message="handleDeselectMessage"
        />
      </div>
    </template>
  </div>
</template>
