<script setup lang="ts">
import vueFilePond from "vue-filepond";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";

import {
  deleteAttachment,
  uploadAttachment,
  type UploadedAttachment,
} from "@src/api/attachments";

const FilePond = vueFilePond(
  FilePondPluginFileValidateSize,
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview,
);

const props = defineProps<{
  label?: string;
  multiple?: boolean;
  accept?: string[];
  // ponytail: client check only; server default 25 MB (MAX_UPLOAD_BYTES) is the authority
  maxSize?: string;
}>();

const emit = defineEmits<{
  uploaded: [UploadedAttachment];
  removed: [string];
  error: [string];
}>();

// create → presigned PUT → complete; the attachment id is FilePond's serverId
const server = {
  process(
    _field: string,
    file: File,
    _meta: unknown,
    load: (id: string) => void,
    error: (msg: string) => void,
    progress: (computable: boolean, loaded: number, total: number) => void,
    abort: () => void,
  ) {
    const ctl = new AbortController();
    uploadAttachment(file, (l, t) => progress(true, l, t), ctl.signal)
      .then((a) => {
        load(a.id);
        emit("uploaded", a);
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return abort();
        emit("error", e.message);
        error(e.message);
      });
    return { abort: () => ctl.abort() };
  },
  async revert(id: string, load: () => void, error: (msg: string) => void) {
    try {
      await deleteAttachment(id);
      emit("removed", id);
      load();
    } catch (e) {
      error((e as Error).message);
    }
  },
};
</script>

<template>
  <div class="flex flex-col uploader">
    <span v-if="props.label" class="mb-3 text-muted text-sm font-semibold">
      {{ props.label }}
    </span>
    <FilePond
      :server="server"
      :allow-multiple="props.multiple"
      :accepted-file-types="props.accept"
      :max-file-size="props.maxSize ?? '25MB'"
      :allow-revert="true"
      label-idle="Drop files or <span class='filepond--label-action'>browse</span>"
    />
  </div>
</template>

<style>
.uploader .filepond--panel-root {
  background-color: var(--card);
  border: 1px dashed var(--hairline);
}
.uploader .filepond--drop-label {
  color: var(--muted);
}
.uploader .filepond--root {
  margin-bottom: 0;
}
</style>
