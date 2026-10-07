<script setup lang="ts">
import type { IAttachment } from "@src/types";

import { computed, ref } from "vue";

import { refreshAttachment } from "@src/api/attachments";

import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import Carousel from "@src/components/ui/data-display/Carousel/Carousel.vue";

const props = defineProps<{ attachments: IAttachment[] }>();
const emit = defineEmits<{ remove: [string] }>();

const isMedia = (a: IAttachment) => ["image", "video"].includes(a.type);

// pending items carry no URL (presigned URLs are short-lived); fetch on click
const resolved = ref<IAttachment[]>([]);
const startingId = ref<string>();
const open = ref(false);
const media = computed(() => resolved.value.filter(isMedia));

const handleView = async (a: IAttachment) => {
  const fresh = await refreshAttachment(a.id);
  if (!fresh.url) return;
  if (!isMedia(a)) {
    window.open(fresh.url, "_blank", "noopener");
    return;
  }
  resolved.value = await Promise.all(
    props.attachments.filter(isMedia).map(async (m) => ({
      ...m,
      url:
        m.id === a.id
          ? fresh.url!
          : ((await refreshAttachment(m.id)).url ?? ""),
    })),
  );
  startingId.value = a.id;
  open.value = true;
};
</script>

<template>
  <ul
    v-if="props.attachments.length > 0"
    class="flex flex-wrap gap-2 px-4 pt-3"
    aria-label="pending attachments"
  >
    <li
      v-for="a in props.attachments"
      :key="a.id"
      class="flex items-center max-w-56 rounded-full bg-card border border-hairline pl-3 pr-1 py-1"
    >
      <button
        type="button"
        class="flex items-center min-w-0 text-left"
        :title="`view ${a.name}`"
        @click="handleView(a)"
      >
        <PhotoIcon
          v-if="a.type === 'image'"
          class="w-4 h-4 mr-2 shrink-0 text-muted"
        />
        <VideoCameraIcon
          v-else-if="a.type === 'video'"
          class="w-4 h-4 mr-2 shrink-0 text-muted"
        />
        <DocumentIcon v-else class="w-4 h-4 mr-2 shrink-0 text-muted" />
        <span class="body-3 text-fg truncate">{{ a.name }}</span>
      </button>
      <button
        type="button"
        class="ml-1 p-1 rounded-full text-muted hover:text-fg shrink-0"
        :aria-label="`remove ${a.name}`"
        @click="emit('remove', a.id)"
      >
        <XMarkIcon class="w-4 h-4" />
      </button>
    </li>
  </ul>

  <Carousel
    v-if="open"
    :open="open"
    :items="media"
    :starting-id="startingId"
    :close-carousel="() => (open = false)"
  />
</template>
