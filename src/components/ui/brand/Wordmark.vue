<script setup lang="ts">
// single swappable brand mark: text wordmark in the app's Fredoka face
// until real logo artwork exists. Color = currentColor, so dark/light and
// opacity follow the surroundings.
defineProps<{
  size?: "sm" | "md" | "lg";
}>();
</script>

<template>
  <span
    class="font-bold tracking-tight select-none whitespace-nowrap text-indigo-400"
    :class="{
      'text-sm': size === 'sm',
      'text-lg': size === 'md',
      'text-3xl': size === 'lg',
      'text-2xl': size === undefined,
    }"
  >
    goChatHub
  </span>
</template>
