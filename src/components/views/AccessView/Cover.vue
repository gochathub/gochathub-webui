<script setup lang="ts">
import cloudPatternPath from "@src/assets/images/clouds.png";
import blurPath from "@src/assets/images/blur.png";
import Wordmark from "@src/components/ui/brand/Wordmark.vue";
</script>

<template>
  <div
    class="py-12.5 px-12.5 h-full basis-1/2 md:flex xs:hidden items-center justify-center"
  >
    <div
      class="w-full h-full px-7 flex items-center bg-no-repeat bg-center bg-cover rounded-[.75rem]"
      :style="{ 'background-image': `url(${cloudPatternPath})` }"
    >
      <div
        class="px-9 py-15 rounded-[.3125rem] bg-cover bg-no-repeat"
        :style="{ 'background-image': `url(${blurPath})` }"
      >
        <Wordmark size="lg" class="text-white! mb-5 block" />
        <p class="display mb-5 text-white">
          Blazingly fast messaging platform for the
          <span class="text-gradient">web.</span>
        </p>
        <p class="body-3 text-white">
          goChatHub keeps your conversations on your server, syncing messages,
          receipts and attachments across browsers and devices.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-gradient {
  background: -webkit-linear-gradient(left top, #de6dce, #e7ddee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
