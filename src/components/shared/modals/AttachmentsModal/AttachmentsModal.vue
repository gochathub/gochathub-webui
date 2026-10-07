<script setup lang="ts">
import type { Ref } from "vue";
import type { IAttachment } from "@src/types";
import { ref } from "vue";

import type { UploadedAttachment } from "@src/api/attachments";

import Button from "@src/components/ui/inputs/Button.vue";
import FileUploader from "@src/components/ui/inputs/FileUploader.vue";
import Modal from "@src/components/ui/utils/Modal.vue";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
  // uploaded-and-selected attachments carry back to the composer
  closeWithAttachments: (attachments: IAttachment[]) => void;
}>();

const selected = ref<IAttachment[]>([]);
const error = ref("");
const uploaderKey = ref(0);

// (event) FilePond finished create → presigned PUT → complete for one file
const handleUploaded = (uploaded: UploadedAttachment) => {
  error.value = "";
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
};

const handleRemoved = (id: string) => {
  selected.value = selected.value.filter((a) => a.id !== id);
};

const handleError = (msg: string) => {
  error.value = /not configured|503|disabled/i.test(msg)
    ? "Attachment storage is not available on this deployment."
    : "Upload failed. The file may exceed the size limit.";
};

// (event) hand the selected attachments to the composer
const handleSend = () => {
  props.closeWithAttachments([...selected.value]);
  selected.value = [];
  uploaderKey.value++; // remount: FilePond would otherwise keep the handed-over files
  props.closeModal();
};
</script>

<template>
  <Modal :open="props.open" :close-modal="props.closeModal">
    <template #content>
      <div class="w-full max-w-[30rem] bg-canvas rounded py-6">
        <!--drop zone-->
        <div class="px-5 py-5">
          <FileUploader
            :key="uploaderKey"
            label="Select files"
            multiple
            @uploaded="handleUploaded"
            @removed="handleRemoved"
            @error="handleError"
          />
          <p v-if="error" role="alert" class="body-3 text-error mt-3">
            {{ error }}
          </p>
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
