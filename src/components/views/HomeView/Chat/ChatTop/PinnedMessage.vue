<script setup lang="ts">
import type { IConversation } from "@src/types";
import type { Ref } from "vue";

import { inject } from "vue";

import useStore from "@src/store/store";
import { getConversationIndex } from "@src/utils";

import { EyeSlashIcon, XCircleIcon } from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import SlideTransition from "@src/components/ui/transitions/SlideTransition.vue";
import MessagePreview from "@src/components/views/HomeView/Chat/MessagePreview.vue";

const store = useStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;
// (event) hide the pinned message
const handleHidePinnedMessage = () => {
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
      store.conversations[activeConversationIndex].pinnedMessageHidden = true;
    }
  }
};

// (event) remove the pinned message
const handleRemovePinnedMessage = () => {
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
      store.conversations[activeConversationIndex].pinnedMessage = undefined;

      // send socket message notifying other users that the message is removed
      // ...
    }
  }
};
</script>

<template>
  <SlideTransition animation="shelf-down">
    <div
      v-if="
        activeConversation?.pinnedMessage &&
        !activeConversation?.pinnedMessageHidden
      "
      class="absolute z-10 w-full px-5 py-2 bg-canvas border-b border-hairline flex items-center justify-between transition-all duration-200"
    >
      <!--pinned message preview-->
      <MessagePreview :message="activeConversation?.pinnedMessage" />

      <div class="flex">
        <!--hide pinned Message-->
        <IconButton
          title="hide pinned message"
          aria-label="hide pinned message"
          class="ic-btn-ghost-primary w-7 h-7"
          :class="{
            'mr-3':
              store.user && activeConversation?.admins?.includes(store.user.id),
          }"
          @click="handleHidePinnedMessage"
        >
          <EyeSlashIcon class="w-5 h-5" />
        </IconButton>

        <!--remove pinned Message-->
        <IconButton
          v-if="
            store.user && activeConversation?.admins?.includes(store.user.id)
          "
          class="ic-btn-ghost-primary w-7 h-7"
          title="close pinned message"
          aria-label="close pinned message"
          @click="handleRemovePinnedMessage"
        >
          <XCircleIcon class="w-5 h-5" />
        </IconButton>
      </div>
    </div>
  </SlideTransition>
</template>
