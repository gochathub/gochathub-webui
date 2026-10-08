<script setup lang="ts">
import { ArrowUturnLeftIcon } from "@heroicons/vue/24/solid";
import Button from "@src/components/ui/inputs/Button.vue";
import type { Ref } from "vue";
import type { IConversation } from "@src/types";
import { inject } from "vue";
import client, { unwrap } from "@src/api/client";
import type { UploadedAttachment } from "@src/api/attachments";
import FileUploader from "@src/components/ui/inputs/FileUploader.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";

defineEmits(["active-page-change"]);

const conversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

// (event) avatar uploaded → attach it to the room (server gates on admin)
const handleAvatar = async (a: UploadedAttachment) => {
  if (!conversation.value) return;
  await unwrap(
    await client.PATCH("/rooms/{roomId}", {
      params: { path: { roomId: conversation.value.id } },
      body: { avatar_attachment_id: a.id },
    }),
  );
};
</script>

<template>
  <div>
    <!--header-->
    <div class="px-5 mb-6 flex justify-between items-center">
      <div class="flex items-center gap-1">
        <p id="modal-title" class="heading-1 text-fg" tabindex="0">
          Edit Group Info
        </p>
        <HelpLink to="/help/rooms#roles" label="group roles" />
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

    <!--inputs-->
    <div class="px-5 mb-6">
      <div class="mb-5">
        <LabeledTextInput type="text" placeholder="Group name" label="Name" />
      </div>

      <div>
        <FileUploader
          label="Avatar"
          :accept="['image/*']"
          max-size="2MB"
          @uploaded="handleAvatar"
        />
      </div>
    </div>

    <!--save button-->
    <div class="px-5">
      <Button
        class="contained-primary contained-text w-full"
        @click="
          $emit('active-page-change', {
            tabName: 'conversation-info',
            animationName: 'slide-right',
          })
        "
      >
        Save
      </Button>
    </div>
  </div>
</template>
