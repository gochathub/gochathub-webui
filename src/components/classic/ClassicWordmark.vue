<script setup lang="ts">
// Opaque PNGs: the strip takes each image's own background so it blends in.
</script>

<template>
  <div
    class="px-5 py-3 border-t border-hairline bg-white dark:bg-[#182027] shrink-0"
  >
    <img
      src="/gochathub-wordmark-1400x360.png"
      alt="GoChatHub"
      width="156"
      height="40"
      class="block h-10 w-auto dark:hidden"
    />
    <img
      src="/gochathub-wordmark-dark-1400x360.png"
      alt="GoChatHub"
      width="156"
      height="40"
      class="hidden h-10 w-auto dark:block"
    />
  </div>
</template>
