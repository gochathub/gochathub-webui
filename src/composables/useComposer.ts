// Composer state and actions (draft, typing indicator, mention/shortcode
// autocomplete, pending attachments, send), shared by every layout's
// composer. Templates stay presentational.
import type { IAttachment, IConversation } from "@src/types";
import type { Ref } from "vue";

import { computed, onMounted, ref } from "vue";

import useStore from "@src/store/store";
import useRoomsStore from "@src/store/rooms";
import ws from "@src/ws/client";
import { deleteAttachment } from "@src/api/attachments";
import { findShortcodes } from "@src/emoji";

// :shortcode autocomplete (2+ chars after a colon that starts a word)
// (Tiptap's markdown writes _ as \_)
const SHORTCODE_TAIL = /(^|\s):((?:[a-z0-9+-]|\\?_){2,})$/;

export function useComposer(
  activeConversation: Ref<IConversation | undefined>,
) {
  const store = useStore();
  const rooms = useRoomsStore();

  // the content of the message.
  const value: Ref<string> = ref("");

  // attachments selected in the modal ride the next send
  const pendingAttachments: Ref<IAttachment[]> = ref([]);

  // who is typing in the open room (ids → display names via contacts)
  const typingNames = computed(() => {
    const conv = activeConversation.value;
    if (!conv) return [] as string[];
    const ids = rooms.typingUsers[conv.id] ?? [];
    return ids
      .filter((id) => id !== store.user?.id)
      .map(
        (id) =>
          conv.contacts.find((c) => c.id === id)?.firstName ??
          conv.contacts.find((c) => c.id === id)?.username,
      )
      .filter(Boolean) as string[];
  });

  // mention autocomplete state
  const mentionQuery = computed(() => {
    const match = value.value.match(/@([a-zA-Z0-9_-]*)$/);
    return match ? (match[1] as string).toLowerCase() : undefined;
  });
  const mentionMatches = computed(() => {
    if (!mentionQuery.value || !activeConversation.value) return [];
    return activeConversation.value.contacts
      .filter((c) => c.username.toLowerCase().startsWith(mentionQuery.value!))
      .slice(0, 5);
  });

  const handlePickMention = (username: string) => {
    value.value = value.value.replace(/@([a-zA-Z0-9_-]*)$/, `@${username} `);
  };

  const shortcodeMatches = computed(() => {
    const m = value.value.match(SHORTCODE_TAIL);
    return m ? findShortcodes(m[2]!) : [];
  });
  const handlePickShortcode = (char: string) => {
    value.value = value.value.replace(SHORTCODE_TAIL, `$1${char}`);
  };

  // typing indicator — throttled, stops on silence/send
  const lastTypingSent = ref(0);
  const handleSetDraft = () => {
    if (!activeConversation.value) return;
    rooms.setDraft(value.value, activeConversation.value.id);
    const now = Date.now();
    if (value.value && now - lastTypingSent.value > 2000) {
      ws.typing(activeConversation.value.id, true);
      lastTypingSent.value = now;
    }
    if (!value.value) {
      ws.typing(activeConversation.value.id, false);
      lastTypingSent.value = 0;
    }
  };

  // (event) send the composed message; failures surface in the envelope toast.
  const handleSend = async () => {
    if (
      !activeConversation.value ||
      (!value.value.trim() && pendingAttachments.value.length === 0)
    )
      return;
    const room = activeConversation.value.id;
    const replyTo = activeConversation.value.replyMessage?.id;
    await rooms.sendMessage(
      value.value.trim(),
      room,
      replyTo,
      pendingAttachments.value.map((a) => a.id),
    );
    value.value = "";
    pendingAttachments.value = [];
    lastTypingSent.value = 0;
    ws.typing(room, false);
  };

  // (event) drop a pending attachment; it is already uploaded, so delete it too
  const handleRemovePending = (id: string) => {
    pendingAttachments.value = pendingAttachments.value.filter(
      (a) => a.id !== id,
    );
    deleteAttachment(id).catch(() => {});
  };

  onMounted(() => {
    value.value = activeConversation.value?.draftMessage ?? "";
  });

  return {
    value,
    pendingAttachments,
    typingNames,
    mentionMatches,
    shortcodeMatches,
    handlePickMention,
    handlePickShortcode,
    handleSetDraft,
    handleSend,
    handleRemovePending,
  };
}
