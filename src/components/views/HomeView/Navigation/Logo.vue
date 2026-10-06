<script setup lang="ts">
import { ref } from "vue";
import Wordmark from "@src/components/ui/brand/Wordmark.vue";
import { ForwardIcon } from "@heroicons/vue/24/outline";

const SkipLinkFocused = ref(false);
</script>

<template>
  <div class="mb-7 h-7 xs:hidden md:block">
    <a
      href="#mainContent"
      title="Skip to main content"
      class="outline-none"
      :class="{
        absolute: !SkipLinkFocused,
        'right-2500': !SkipLinkFocused,
      }"
      @blur="SkipLinkFocused = false"
      @focus="SkipLinkFocused = true"
    >
      <ForwardIcon class="w-7 h-6 text-indigo-300" />
    </a>

    <button
      aria-label="goChatHub"
      :class="{ hidden: SkipLinkFocused }"
      class="outline-none"
    >
      <Wordmark />
    </button>
  </div>
</template>
