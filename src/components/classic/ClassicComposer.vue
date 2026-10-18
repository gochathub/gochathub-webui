<script setup lang="ts">
import type { IConversation } from "@src/types";
import type { Ref } from "vue";

import { inject, ref } from "vue";

import useStore from "@src/store/store";
import { useComposer } from "@src/composables/useComposer";

import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/vue/24/outline";
import AttachmentsModal from "@src/components/shared/modals/AttachmentsModal/AttachmentsModal.vue";
import EmojiPickerButton from "@src/components/ui/inputs/EmojiPicker/EmojiPickerButton.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import RichEditor from "@src/components/ui/inputs/RichEditor.vue";
import PendingAttachments from "@src/components/views/HomeView/Chat/ChatBottom/PendingAttachments.vue";
import ReplyMessage from "@src/components/views/HomeView/Chat/ChatBottom/ReplyMessage.vue";

const store = useStore();
const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

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

const editorRef = ref<InstanceType<typeof RichEditor>>();
const openAttachmentsModal = ref(false);
</script>

<template>
  <div v-if="store.status !== 'loading'" class="w-full px-5 pb-4">
    <div class="relative transition-all duration-200">
      <ReplyMessage />
    </div>

    <p
      v-if="typingNames.length > 0"
      class="body-3 text-muted mb-1"
      aria-live="polite"
    >
      {{ typingNames.join(", ") }} {{ typingNames.length > 1 ? "are" : "is" }}
      typing…
    </p>

    <PendingAttachments
      :attachments="pendingAttachments"
      @remove="handleRemovePending"
    />

    <div class="relative rounded border border-hairline bg-card">
      <RichEditor
        ref="editorRef"
        toolbar-below
        tall
        :model-value="value"
        :placeholder="`Message ${activeConversation?.type === 'group' ? '#' : ''}${activeConversation?.name ?? ''}`"
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
          <IconButton
            v-if="!activeConversation?.source"
            type="button"
            class="ic-btn-ghost-primary w-7 h-7"
            title="open select attachments modal"
            aria-label="open select attachments modal"
            @mousedown.prevent
            @click="openAttachmentsModal = true"
          >
            <PaperClipIcon class="w-4 h-4" />
          </IconButton>
          <IconButton
            type="button"
            class="ic-btn-contained-primary w-7 h-7 ml-auto mr-2 mb-2"
            title="send message"
            aria-label="send message"
            @mousedown.prevent
            @click="handleSend"
          >
            <PaperAirplaneIcon class="w-4.25 h-4.25" />
          </IconButton>
        </template>
      </RichEditor>

      <!--mention autocomplete-->
      <div
        v-if="mentionMatches.length > 0"
        class="absolute bottom-full mb-2 left-0 z-10 w-56 py-1 rounded-xl bg-canvas shadow-lg border border-hairline"
        role="listbox"
        aria-label="mention suggestions"
      >
        <button
          v-for="contact in mentionMatches"
          :key="contact.id"
          role="option"
          class="w-full text-left px-4 py-2 body-3 text-fg hover:bg-select/60"
          @click="handlePickMention(contact.username)"
        >
          <span class="font-semibold">@{{ contact.username }}</span>
          {{ contact.firstName }}
        </button>
      </div>

      <!--shortcode autocomplete-->
      <div
        v-if="shortcodeMatches.length > 0"
        class="absolute bottom-full mb-2 left-0 z-10 w-56 py-1 rounded-xl bg-canvas shadow-lg border border-hairline"
        role="listbox"
        aria-label="emoji suggestions"
      >
        <button
          v-for="m in shortcodeMatches"
          :key="m.name"
          role="option"
          class="w-full text-left px-4 py-2 body-3 text-fg hover:bg-select/60"
          @click="handlePickShortcode(m.char)"
        >
          {{ m.char }} :{{ m.name }}:
        </button>
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
