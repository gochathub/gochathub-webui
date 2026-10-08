<script setup lang="ts">
import type { IConversation } from "@src/types";

import { ArrowUturnLeftIcon } from "@heroicons/vue/24/solid";
import Button from "@src/components/ui/inputs/Button.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";

defineProps<{
  conversation?: IConversation;
}>();

defineEmits(["active-page-change", "delete-group"]);
</script>

<template>
  <div>
    <!--header-->
    <div class="px-5 mb-6 flex justify-between items-center">
      <div class="flex items-center gap-1">
        <p id="modal-title" class="heading-1 text-fg" tabindex="0">
          Delete Group
        </p>
        <HelpLink
          to="/help/rooms#the-conversation-menu"
          label="deleting a group"
        />
      </div>

      <!--return button-->
      <IconButton
        class="ic-btn-outlined-danger p-2"
        @click="
          $emit('active-page-change', {
            tabName: 'conversation-info',
            animationName: 'slide-right',
          })
        "
      >
        <ArrowUturnLeftIcon class="w-5 h-5" />
      </IconButton>
    </div>

    <!--warning-->
    <p class="px-5 mb-6 body-2 text-muted">
      {{
        conversation?.name
          ? `"${conversation.name}" will be removed for`
          : "This group will be removed for"
      }}
      all members. Its history stays on the server, but the room cannot be
      reopened.
    </p>

    <!--actions-->
    <div class="px-5">
      <Button
        class="contained-danger contained-text w-full mb-4"
        @click="$emit('delete-group')"
      >
        Delete
      </Button>
      <Button
        class="ghost-primary ghost-text w-full"
        @click="
          $emit('active-page-change', {
            tabName: 'conversation-info',
            animationName: 'slide-right',
          })
        "
      >
        Cancel
      </Button>
    </div>
  </div>
</template>
