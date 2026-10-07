<script setup lang="ts">
defineProps<{
  label?: string;
}>();
</script>

<template>
  <div class="w-full my-4 flex items-center justify-center">
    <div
      class="w-full h-0 border-t border-dashed border-hairline dark:bg-white/0"
    ></div>
    <p class="body-4 text-muted mx-5">
      {{ label ?? "Today" }}
    </p>
    <div
      class="w-full h-0 border-t border-dashed border-hairline dark:bg-white/0"
    ></div>
  </div>
</template>
