<script setup lang="ts">
import type { IAttachment } from "@src/types";

import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps<{
  attachment: IAttachment;
  date: string;
}>();
</script>

<template>
  <button
    class="w-full p-5 flex hover:bg-select/50 active:bg-select dark:hover:bg-select/50 dark:active:bg-select outline-none transition-all duration-300"
  >
    <!--icon-->
    <div
      class="w-8 h-8 mr-4 flex justify-center items-center rounded-full bg-card shrink-0"
    >
      <PhotoIcon
        v-if="props.attachment.type === 'image'"
        class="h-5 w-5 text-muted"
      />
      <DocumentIcon
        v-else-if="props.attachment.type === 'file'"
        class="h-5 w-5 text-muted"
      />
      <VideoCameraIcon
        v-else-if="props.attachment.type === 'video'"
        class="h-5 w-5 text-muted"
      />
    </div>

    <!--name, date and size-->
    <div class="grow min-w-0">
      <div class="flex items-center justify-between mb-3">
        <p class="heading-2 text-fg truncate max-w-full">
          {{ props.attachment.name }}
        </p>

        <p class="body-4 text-muted shrink-0 ml-3">
          {{ props.date }}
        </p>
      </div>

      <div class="flex justify-start">
        <p class="body-2 text-muted leading-4">
          {{ props.attachment.size }}
        </p>
      </div>
    </div>
  </button>
</template>
