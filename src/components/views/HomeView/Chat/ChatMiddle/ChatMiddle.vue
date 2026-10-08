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

// Keep the scroll position sensible when the list changes. Runs before the DOM
// updates (default "pre" flush) so the old geometry can be measured.
// - opened/loaded a conversation, or sent a message: go to the bottom
// - new message from others: follow only if already near the bottom
// - older page prepended: hold position (keep the same message in view)
const NEAR_BOTTOM_PX = 150;
watch(
  () => {
    const m = activeConversation.value?.messages;
    return [activeConversation.value?.id, m?.[0]?.id, m?.at(-1)?.id] as const;
  },
  async ([convId, first, last], [prevConv, prevFirst, prevLast]) => {
    const el = container.value;
    if (!el) return;
    const oldHeight = el.scrollHeight;
    const oldTop = el.scrollTop;
    const nearBottom = oldHeight - oldTop - el.clientHeight < NEAR_BOTTOM_PX;
    const newest = activeConversation.value?.messages.at(-1);
    await nextTick();
    if (convId !== prevConv || prevLast === undefined) {
      el.scrollTop = el.scrollHeight;
    } else if (last !== prevLast) {
      if (nearBottom || (newest && isSelf(newest))) {
        el.scrollTop = el.scrollHeight;
      }
    } else if (first !== prevFirst) {
      el.scrollTop = oldTop + (el.scrollHeight - oldHeight);
    }
  },
);

// scroll to a message picked from search and flash it.
const rooms = useRoomsStore();
const highlightId = ref<string>();
watch(
  () => rooms.focusMessageId,
  async (id) => {
    if (!id) return;
    rooms.focusMessageId = undefined;
    await nextTick();
    // next frame: after the prepend-anchoring above has restored its position
    requestAnimationFrame(() => {
      container.value
        ?.querySelector(`[data-message-id="${CSS.escape(id)}"]`)
        ?.scrollIntoView({ block: "center" });
      highlightId.value = id;
      setTimeout(() => (highlightId.value = undefined), 2000);
    });
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
