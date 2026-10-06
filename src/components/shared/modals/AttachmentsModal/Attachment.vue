<script setup lang="ts">
import type { IAttachment } from "@src/types";

import {
  DocumentIcon,
  PhotoIcon,
  TrashIcon,
  VideoCameraIcon,
} from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";

const props = defineProps<{
  attachment: IAttachment;
}>();

defineEmits(["remove"]);
</script>

<template>
  <div href="#" class="flex px-5 py-4 transition-all duration-300">
    <!--icon-->
    <div
      class="w-8 h-8 mr-4 rounded-full flex justify-center items-center bg-gray-100 dark:bg-gray-600"
    >
      <PhotoIcon
        v-if="attachment.type === 'image'"
        class="stroke-1 h-5 w-5 text-black opacity-60 dark:text-white dark:opacity-70"
      />
      <VideoCameraIcon
        v-else-if="attachment.type === 'video'"
        class="stroke-1 h-5 w-5 text-black opacity-60 dark:text-white dark:opacity-70"
      />
      <DocumentIcon
        v-else-if="attachment.type === 'file'"
        class="stroke-1 h-5 w-5 text-black opacity-60 dark:text-white dark:opacity-70"
      />
    </div>

    <!--name, date and size-->
    <div class="grow">
      <div class="flex items-center justify-between mb-3">
        <p class="heading-2 text-black/70 dark:text-white/70" tabindex="0">
          {{ attachment.name }}
        </p>
      </div>

      <div class="flex justify-start">
        <p class="body-2 text-black/70 dark:text-white/70" tabindex="0">
          {{ attachment.size }}
        </p>
      </div>
    </div>

    <!--action buttons-->
    <div class="flex">
      <IconButton
        class="ic-btn-ghost-danger w-7 h-7"
        title="remove attachment"
        aria-label="remove attachment"
        @click="$emit('remove', props.attachment.id)"
      >
        <TrashIcon class="w-[.9375rem] h-[.9375rem]" />
      </IconButton>
    </div>
  </div>
</template>
