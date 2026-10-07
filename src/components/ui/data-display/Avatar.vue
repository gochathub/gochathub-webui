<script setup lang="ts">
import { ref, watch } from "vue";

import { avatarColor, initials } from "@src/avatar";

// size/shape come from the caller's class (falls through to the root)
const props = defineProps<{ src?: string | null; name: string }>();

// presigned avatar URLs expire — fall back to initials when the image fails
const failed = ref(false);
watch(
  () => props.src,
  () => (failed.value = false),
);
</script>

<template>
  <div
    class="[container-type:size] rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white font-semibold select-none"
    :style="
      props.src && !failed
        ? undefined
        : { backgroundColor: avatarColor(props.name) }
    "
    role="img"
    :aria-label="props.name"
  >
    <img
      v-if="props.src && !failed"
      :src="props.src"
      alt=""
      class="w-full h-full object-cover"
      @error="failed = true"
    />
    <span v-else class="text-[40cqw] leading-none">{{
      initials(props.name)
    }}</span>
  </div>
</template>
