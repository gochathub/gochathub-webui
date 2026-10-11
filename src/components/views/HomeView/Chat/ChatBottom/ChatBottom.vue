<script setup lang="ts">
import type { Ref } from "vue";
import type { IConversation } from "@src/types";

import useStore from "@src/store/store";
import { useComposer } from "@src/composables/useComposer";
import PendingAttachments from "@src/components/views/HomeView/Chat/ChatBottom/PendingAttachments.vue";
import { ref, inject } from "vue";

import {
  FaceSmileIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";
import AttachmentsModal from "@src/components/shared/modals/AttachmentsModal/AttachmentsModal.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import ScaleTransition from "@src/components/ui/transitions/ScaleTransition.vue";
import ReplyMessage from "@src/components/views/HomeView/Chat/ChatBottom/ReplyMessage.vue";
import EmojiPicker from "@src/components/ui/inputs/EmojiPicker/EmojiPicker.vue";
import RichEditor from "@src/components/ui/inputs/RichEditor.vue";

const store = useStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

// open emoji picker.
const showPicker = ref(false);
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
                class="w-[1.25rem] h-[1.25rem] text-muted group-hover:text-accent-text"
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
