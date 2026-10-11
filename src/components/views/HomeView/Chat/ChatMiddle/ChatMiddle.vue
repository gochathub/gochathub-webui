<script setup lang="ts">
import type { IConversation } from "@src/types";
import type { Ref } from "vue";

import { inject } from "vue";

import useStore from "@src/store/store";
import { formatDay } from "@src/api/mappers";
import { useMessageScroll } from "@src/composables/useMessageScroll";

import Message from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Message.vue";
import TimelineDivider from "@src/components/views/HomeView/Chat/ChatMiddle/TimelineDivider.vue";

const props = defineProps<{
  handleSelectMessage: (messageId: string) => void;
  handleDeselectMessage: (messageId: string) => void;
  selectedMessages: string[];
}>();

const store = useStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

// checks whether the previous message was sent by the same user.
const isFollowUp = (index: number, previousIndex: number): boolean => {
  if (previousIndex < 0 || !activeConversation.value) {
    return false;
  } else {
    const previousSender =
      activeConversation.value.messages[previousIndex].sender.id;
    const currentSender = activeConversation.value.messages[index].sender.id;
    return previousSender === currentSender;
  }
};

// checks wether the message has been sent in a new day or not.
const renderDivider = (index: number, previousIndex: number): boolean => {
  if (previousIndex < 0 || !activeConversation.value) {
    return true;
  }
  const prev = new Date(activeConversation.value.messages[previousIndex].date);
  const curr = new Date(activeConversation.value.messages[index].date);
  return prev.toDateString() !== curr.toDateString();
};

const { container, highlightId, isSelf, handleScroll } =
  useMessageScroll(activeConversation);
</script>

<template>
  <div
    ref="container"
    class="grow px-5 py-5 flex flex-col overflow-y-scroll scrollbar-thin"
    @scroll.passive="handleScroll"
  >
    <template v-if="store.status !== 'loading'">
      <div class="w-full flex flex-col">
        <div
          v-for="(message, index) in activeConversation?.messages"
          :key="message.id"
          :data-message-id="message.id"
          class="rounded transition-colors duration-500"
          :class="{ 'bg-select/60': highlightId === message.id }"
        >
          <TimelineDivider
            v-if="renderDivider(index, index - 1)"
            :label="formatDay(message.date)"
          />

          <Message
            :message="message"
            :self="isSelf(message)"
            :follow-up="isFollowUp(index, index - 1)"
            :divider="renderDivider(index, index - 1)"
            :selected="props.selectedMessages.includes(message.id)"
            :handle-select-message="handleSelectMessage"
            :handle-deselect-message="handleDeselectMessage"
          />
        </div>
      </div>
    </template>
  </div>
</template>
