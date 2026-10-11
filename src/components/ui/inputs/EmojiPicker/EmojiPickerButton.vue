<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

import { FaceSmileIcon, XCircleIcon } from "@heroicons/vue/24/outline";
import EmojiPicker from "@src/components/ui/inputs/EmojiPicker/EmojiPicker.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import ScaleTransition from "@src/components/ui/transitions/ScaleTransition.vue";

// Toolbar button + emoji picker popup. Lives in the RichEditor toolbar slot so
// it sits on the same row as the formatting buttons.
const emit = defineEmits<{ pick: [string] }>();

const show = ref(false);

// The popup is right-aligned to the button; on a narrow screen (or when the
// toolbar wraps) that pushes it past the left edge. Measure on open and shift
// it right just enough to stay inside the viewport.
const MARGIN = 8;
const wrapper = ref<HTMLElement>();
const popup = ref<HTMLElement>();
const shift = ref(0);

watch(show, async (open) => {
  if (!open) return;
  shift.value = 0;
  await nextTick();
  if (!wrapper.value || !popup.value) return;
  const left =
    wrapper.value.getBoundingClientRect().right - popup.value.offsetWidth;
  shift.value = Math.max(0, MARGIN - left);
});

// Close on any click outside the popup. Clicking the glyph re-renders the icon
// (smiley -> X) before this document-level handler runs, so event.target is
// already detached and target.closest() finds nothing: the click that opens
// the picker would close it. composedPath() is captured at dispatch time.
const handleClickOutside = (event: Event) => {
  const onToggle = event
    .composedPath()
    .some(
      (n) =>
        n instanceof Element && n.classList.contains("toggle-picker-button"),
    );
  if (!onToggle) show.value = false;
};
</script>

<template>
  <div ref="wrapper" class="relative">
    <IconButton
      type="button"
      title="toggle emoji picker"
      aria-label="toggle emoji picker"
      :aria-expanded="show"
      class="ic-btn-ghost-primary toggle-picker-button w-7 h-7"
      @mousedown.prevent
      @click="show = !show"
    >
      <XCircleIcon v-if="show" class="w-4 h-4" />
      <FaceSmileIcon v-else class="w-4 h-4" />
    </IconButton>

    <ScaleTransition>
      <div
        v-show="show"
        ref="popup"
        v-click-outside="handleClickOutside"
        class="absolute z-10 bottom-full right-0 mb-2"
        :style="{ right: `${-shift}px` }"
      >
        <EmojiPicker :show="show" @pick="emit('pick', $event)" />
      </div>
    </ScaleTransition>
  </div>
</template>
