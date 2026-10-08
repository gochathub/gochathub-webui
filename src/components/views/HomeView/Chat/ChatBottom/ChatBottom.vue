<script setup lang="ts">
import type { Ref } from "vue";
import type { IAttachment, IConversation } from "@src/types";

import useStore from "@src/store/store";
import useRoomsStore from "@src/store/rooms";
import ws from "@src/ws/client";
import { deleteAttachment } from "@src/api/attachments";
import PendingAttachments from "@src/components/views/HomeView/Chat/ChatBottom/PendingAttachments.vue";
import { ref, inject, onMounted, computed } from "vue";

import {
  FaceSmileIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";
import AttachmentsModal from "@src/components/shared/modals/AttachmentsModal/AttachmentsModal.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import ScaleTransition from "@src/components/ui/transitions/ScaleTransition.vue";
import ReplyMessage from "@src/components/views/HomeView/Chat/ChatBottom/ReplyMessage.vue";
import EmojiPicker from "@src/components/ui/inputs/EmojiPicker/EmojiPicker.vue";
import RichEditor from "@src/components/ui/inputs/RichEditor.vue";

const store = useStore();
const rooms = useRoomsStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

// the content of the message.
const value: Ref<string> = ref("");

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

// open emoji picker.
const showPicker = ref(false);
const editorRef = ref<InstanceType<typeof RichEditor>>();

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

// attachments selected in the modal ride the next send
const pendingAttachments: Ref<IAttachment[]> = ref([]);

// (event) drop a pending attachment; it is already uploaded, so delete it too
const handleRemovePending = (id: string) => {
  pendingAttachments.value = pendingAttachments.value.filter(
    (a) => a.id !== id,
  );
  deleteAttachment(id).catch(() => {});
};

// open modal used to send attachments.
const openAttachmentsModal = ref(false);

// close picker when you click outside.
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  const parent = target.parentElement as HTMLElement;

  if (
    target &&
    !target.classList.contains("toggle-picker-button") &&
    parent &&
    !parent.classList.contains("toggle-picker-button")
  ) {
    showPicker.value = false;
  }
};

onMounted(() => {
  value.value = activeConversation.value?.draftMessage ?? "";
});
</script>

<template>
  <div class="w-full">
    <!--selected reply display-->
    <div
      class="relative transition-all duration-200"
      :class="{ 'pt-15': activeConversation?.replyMessage }"
    >
      <ReplyMessage />
    </div>

    <!--typing indicator-->
    <p
      v-if="typingNames.length > 0"
      class="body-3 text-muted px-5"
      aria-live="polite"
    >
      {{ typingNames.join(", ") }} {{ typingNames.length > 1 ? "are" : "is" }}
      typing…
    </p>

    <!--attachments waiting to be sent-->
    <PendingAttachments
      :attachments="pendingAttachments"
      @remove="handleRemovePending"
    />

    <div
      v-if="store.status !== 'loading'"
      class="h-auto min-h-16 p-4 flex items-end"
    >
      <div class="min-h-[2.75rem]">
        <!--select attachments button-->
        <IconButton
          class="ic-btn-ghost-primary w-7 h-7 md:mr-5 xs:mr-4"
          title="open select attachments modal"
          aria-label="open select attachments modal"
          @click="openAttachmentsModal = true"
        >
          <PaperClipIcon class="w-[1.25rem] h-[1.25rem]" />
        </IconButton>
      </div>

      <!--message textarea-->
      <div class="grow md:mr-5 xs:mr-4 self-end">
        <div class="relative">
          <RichEditor
            ref="editorRef"
            :model-value="value"
            placeholder="Write your message here"
            @update:model-value="
              (newValue) => {
                value = newValue;
                handleSetDraft();
              }
            "
            @send="handleSend"
          />

          <!--mention autocomplete-->
          <div
            v-if="mentionMatches.length > 0"
            class="absolute bottom-13 left-0 z-10 w-56 py-1 rounded-xl bg-canvas shadow-lg border border-hairline"
            role="listbox"
            aria-label="mention suggestions"
          >
            <button
              v-for="contact in mentionMatches"
              :key="contact.id"
              role="option"
              class="w-full text-left px-4 py-2 body-3 text-fg dark:text-fg/80 hover:bg-select/60"
              @click="handlePickMention(contact.username)"
            >
              <span class="font-semibold">@{{ contact.username }}</span>
              {{ contact.firstName }}
            </button>
          </div>

          <!--emojis-->
          <div class="absolute bottom-[.8125rem] right-0">
            <!--emoji button-->
            <IconButton
              title="toggle emoji picker"
              aria-label="toggle emoji picker"
              class="ic-btn-ghost-primary toggle-picker-button w-7 h-7 md:mr-5 xs:mr-4"
              @click="showPicker = !showPicker"
            >
              <XCircleIcon v-if="showPicker" class="w-[1.25rem] h-[1.25rem]" />
              <FaceSmileIcon
                v-else
                class="w-[1.25rem] h-[1.25rem] text-muted group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
              />
            </IconButton>

            <!--emoji picker-->
            <ScaleTransition>
              <div
                v-show="showPicker"
                v-click-outside="handleClickOutside"
                class="absolute z-10 bottom-13.75 md:right-0 xs:right-[-5rem] mt-2"
              >
                <div role="none">
                  <EmojiPicker
                    :show="showPicker"
                    @pick="(char) => editorRef?.insert(char)"
                  />
                </div>
              </div>
            </ScaleTransition>
          </div>
        </div>
      </div>

      <div class="min-h-[2.75rem] flex">
        <!--send message button-->
        <IconButton
          class="ic-btn-contained-primary w-7 h-7 active:scale-110"
          title="send message"
          aria-label="send message"
          @click="handleSend"
        >
          <PaperAirplaneIcon class="w-4.25 h-4.25" />
        </IconButton>
      </div>
    </div>

    <AttachmentsModal
      :open="openAttachmentsModal"
      :close-modal="() => (openAttachmentsModal = false)"
      :close-with-attachments="
        (attachments) => pendingAttachments.push(...attachments)
      "
    />
  </div>
</template>

<style>
input[placeholder="Search emoji"] {
  background: rgba(0, 0, 0, 0);
}

.v3-emoji-picker .v3-header {
  border-bottom: 0;
}

.v3-emoji-picker .v3-footer {
  border-top: 0;
}
</style>
