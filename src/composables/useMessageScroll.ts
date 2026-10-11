// Scroll behaviour of the message list, shared by every layout's middle
// section: keep position sensible as messages change, jump-to-message,
// older-page loading on scroll-to-top.
import type { IConversation, IMessage } from "@src/types";
import type { Ref } from "vue";

import { nextTick, onMounted, ref, watch } from "vue";

import useStore from "@src/store/store";
import useRoomsStore from "@src/store/rooms";

const NEAR_BOTTOM_PX = 150;

export function useMessageScroll(
  activeConversation: Ref<IConversation | undefined>,
) {
  const store = useStore();
  const rooms = useRoomsStore();
  const container: Ref<HTMLElement | null> = ref(null);
  const highlightId = ref<string>();

  // checks whether the message is sent by the authenticated user.
  const isSelf = (message: IMessage): boolean => {
    return Boolean(store.user && message.sender.id === store.user.id);
  };

  // Keep the scroll position sensible when the list changes. Runs before the DOM
  // updates (default "pre" flush) so the old geometry can be measured.
  // - opened/loaded a conversation, or sent a message: go to the bottom
  // - new message from others: follow only if already near the bottom
  // - older page prepended: hold position (keep the same message in view)
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

  return { container, highlightId, isSelf, handleScroll };
}
