<script setup lang="ts">
import type { IConversation, IMessage } from "@src/types";
import type { Ref } from "vue";

import { inject, onMounted, ref, watch, nextTick } from "vue";

import useStore from "@src/store/store";
import useRoomsStore from "@src/store/rooms";
import { formatDay } from "@src/api/mappers";

import Message from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Message.vue";
import TimelineDivider from "@src/components/views/HomeView/Chat/ChatMiddle/TimelineDivider.vue";

const props = defineProps<{
  handleSelectMessage: (messageId: string) => void;
  handleDeselectMessage: (messageId: string) => void;
  selectedMessages: string[];
}>();

const store = useStore();

const container: Ref<HTMLElement | null> = ref(null);

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

// checks whether the message is sent by the authenticated user.
const isSelf = (message: IMessage): boolean => {
  return Boolean(store.user && message.sender.id === store.user.id);
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

// scroll messages to bottom whenever the list grows.
watch(
  () => activeConversation.value?.messages.length,
  async (after, before) => {
    await nextTick();
    if (container.value && after && after >= (before ?? 0) + 1) {
      container.value.scrollTop = container.value.scrollHeight;
    }
  },
);

// load older history when scrolled to the top (cursor pagination, no offset).
const handleScroll = () => {
  const rooms = useRoomsStore();
  if (
    container.value &&
    container.value.scrollTop <= 40 &&
    activeConversation.value &&
    rooms.olderCursor[activeConversation.value.id]
  ) {
    rooms.loadOlderMessages(activeConversation.value.id);
  }
};
onMounted(() => {
  (container.value as HTMLElement).scrollTop = (
    container.value as HTMLElement
  ).scrollHeight;
});
</script>

<template>
  <div
    ref="container"
    class="grow px-5 py-5 flex flex-col overflow-y-scroll scrollbar-hidden"
    @scroll.passive="handleScroll"
  >
    <template v-if="store.status !== 'loading'">
      <div class="w-full flex flex-col">
        <div
          v-for="(message, index) in activeConversation?.messages"
          :key="message.id"
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
