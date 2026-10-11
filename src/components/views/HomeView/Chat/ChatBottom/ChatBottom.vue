<script setup lang="ts">
import type { Ref } from "vue";
import type { IConversation } from "@src/types";

import useStore from "@src/store/store";
import { useComposer } from "@src/composables/useComposer";
import PendingAttachments from "@src/components/views/HomeView/Chat/ChatBottom/PendingAttachments.vue";
import { ref, inject } from "vue";

import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/vue/24/outline";
import AttachmentsModal from "@src/components/shared/modals/AttachmentsModal/AttachmentsModal.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import ReplyMessage from "@src/components/views/HomeView/Chat/ChatBottom/ReplyMessage.vue";
import EmojiPickerButton from "@src/components/ui/inputs/EmojiPicker/EmojiPickerButton.vue";
import RichEditor from "@src/components/ui/inputs/RichEditor.vue";

const store = useStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

const editorRef = ref<InstanceType<typeof RichEditor>>();

const {
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
} = useComposer(activeConversation);

// open modal used to send attachments.
const openAttachmentsModal = ref(false);
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
      <div class="min-h-[2.75rem] flex items-center">
        <!--select attachments button (not across the Rocket.Chat bridge)-->
        <IconButton
          v-if="!activeConversation?.source"
          class="ic-btn-ghost-primary w-7 h-7 md:mr-2 xs:mr-1"
          title="open select attachments modal"
          aria-label="open select attachments modal"
          @click="openAttachmentsModal = true"
        >
          <PaperClipIcon class="w-[1.25rem] h-[1.25rem]" />
        </IconButton>
        <HelpLink
          to="/help/messages#send"
          label="writing messages"
          class="md:mr-3 xs:mr-2"
        />
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
          >
            <template #toolbar-end>
              <EmojiPickerButton @pick="(char) => editorRef?.insert(char)" />
            </template>
          </RichEditor>

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

          <!--shortcode autocomplete-->
          <div
            v-if="shortcodeMatches.length > 0"
            class="absolute bottom-13 left-0 z-10 w-56 py-1 rounded-xl bg-canvas shadow-lg border border-hairline"
            role="listbox"
            aria-label="emoji suggestions"
          >
            <button
              v-for="m in shortcodeMatches"
              :key="m.name"
              role="option"
              class="w-full text-left px-4 py-2 body-3 text-fg dark:text-fg/80 hover:bg-select/60"
              @click="handlePickShortcode(m.char)"
            >
              {{ m.char }} :{{ m.name }}:
            </button>
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
