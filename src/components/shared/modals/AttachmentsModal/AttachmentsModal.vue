<script setup lang="ts">
import type { Ref } from "vue";
import type { IAttachment } from "@src/types";
import { ref } from "vue";

import { uploadAttachment } from "@src/api/attachments";

import Attachment from "@src/components/shared/modals/AttachmentsModal/Attachment.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import DropFileUpload from "@src/components/ui/inputs/DropFileUpload.vue";
import Modal from "@src/components/ui/utils/Modal.vue";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
  // uploaded-and-selected attachments carry back to the composer
  closeWithAttachments: (attachments: IAttachment[]) => void;
}>();

const selected = ref<IAttachment[]>([]);
const error = ref("");
const busy = ref(false);

// (event) upload one file immediately (create → presigned PUT → complete)
const handleFiles = async (file: File) => {
  if (!file) return;
  busy.value = true;
  error.value = "";
  try {
    const uploaded = await uploadAttachment(file);
    selected.value.push({
      id: uploaded.id,
      type: uploaded.mimeType.startsWith("image/")
        ? "image"
        : uploaded.mimeType.startsWith("video/")
          ? "video"
          : "file",
      name: uploaded.filename,
      size: `${Math.max(1, Math.round(uploaded.sizeBytes / 1024))} KB`,
      url: "",
    });
  } catch (e) {
    error.value =
      e instanceof Error && /not configured|503|disabled/i.test(e.message)
        ? "Attachment storage is not available on this deployment."
        : "Upload failed. The file may exceed the size limit.";
  } finally {
    busy.value = false;
  }
};

const handleRemove = (id: string) => {
  selected.value = selected.value.filter((a) => a.id !== id);
};

// (event) hand the selected attachments to the composer
const handleSend = () => {
  props.closeWithAttachments([...selected.value]);
  selected.value = [];
  props.closeModal();
};
</script>

<template>
  <Modal :open="props.open" :close-modal="props.closeModal">
    <template #content>
      <div class="w-full max-w-[30rem] bg-canvas rounded py-6">
        <!--drop zone-->
        <div class="px-5 py-5">
          <DropFileUpload
            id="attachment-upload"
            label="Select files"
            description="or drop them here"
            @value-changed="handleFiles"
          />
          <p v-if="error" role="alert" class="body-3 text-error mt-3">
            {{ error }}
          </p>
        </div>

        <!--uploaded attachments list-->
        <div
          v-if="selected.length > 0"
          tabindex="0"
          class="max-h-35 overflow-y-scroll scrollbar-thin"
        >
          <Attachment
            v-for="attachment in selected"
            :key="attachment.id"
            :attachment="attachment"
            @remove="handleRemove"
          />
        </div>

        <!--Action buttons-->
        <div class="flex w-full px-5 py-5">
          <div class="grow"></div>
          <Button
            class="ghost-primary ghost-text mr-4"
            @click="props.closeModal"
          >
            Cancel
          </Button>
          <Button
            class="contained-primary contained-text"
            :disabled="selected.length === 0"
            @click="handleSend"
          >
            Attach {{ selected.length > 0 ? `(${selected.length})` : "" }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
