<script setup lang="ts">
import type { IConversation } from "@src/types";

import { inject } from "vue";
import type { Ref } from "vue";

import { getConversationIndex } from "@src/utils";
import useStore from "@src/store/store";

import { XCircleIcon } from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import SlideTransition from "@src/components/ui/transitions/SlideTransition.vue";
import MessagePreview from "@src/components/views/HomeView/Chat/MessagePreview.vue";

const store = useStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

// (event) removes the reply message from top of the text message textarea
const handleRemoveReplyMessage = () => {
  if (activeConversation.value) {
    // get the active conversation index in the state store
    const activeConversationIndex = getConversationIndex(
      activeConversation.value.id,
    );

    if (
      store.conversations &&
      activeConversationIndex !== undefined &&
      activeConversationIndex !== null
    ) {
      // update the conversation in the state store
      store.conversations[activeConversationIndex].replyMessage = undefined;
    }
  }
};
</script>

<template>
  <SlideTransition animation="shelf-up">
    <div
      v-if="activeConversation?.replyMessage"
      class="absolute bottom-0 w-full px-5 py-2 bg-canvas border-t border-hairline flex items-center justify-between transition-all duration-200"
    >
      <!--selected message overview-->
      <MessagePreview :message="activeConversation?.replyMessage" />

      <!--close selected Message-->
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="remove reply"
        aria-label="remove reply"
        @click="handleRemoveReplyMessage"
      >
        <XCircleIcon class="w-5 h-5" />
      </IconButton>
    </div>
  </SlideTransition>
</template>
