<script setup lang="ts">
defineProps<{
  label?: string;
}>();
</script>

<template>
  <div class="w-full my-4 flex items-center">
    <div
      class="flex-1 h-0 border-t border-dashed border-hairline dark:bg-white/0"
    ></div>
    <p class="body-4 text-muted mx-5 shrink-0 whitespace-nowrap">
      {{ label ?? "Today" }}
    </p>
    <div
      class="flex-1 h-0 border-t border-dashed border-hairline dark:bg-white/0"
    ></div>
  </div>
</template>
