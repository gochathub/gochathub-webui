<script setup lang="ts">
import Wordmark from "@src/components/ui/brand/Wordmark.vue";
</script>

<template>
  <div
    class="py-12.5 px-12.5 h-full basis-1/2 md:flex xs:hidden items-center justify-center"
  >
    <div
      class="w-full h-full px-9 py-15 flex flex-col items-center justify-center rounded-[.75rem] bg-[#182027]"
    >
      <Wordmark size="lg" class="text-white! mb-5" />
      <p class="display mb-5 text-white text-center">
        Team chat that stays on your server
      </p>
      <p class="body-3 text-white/70 max-w-[26rem] text-center">
        goChatHub keeps your conversations on your server, syncing messages,
        receipts and attachments across browsers and devices.
      </p>
    </div>
  </div>
</template>
