<script setup lang="ts">
// inline double-check mark recolored with text tokens; the old hand-tuned
// svg assets (gray_checks.svg, green_checks.svg) failed contrast on both
// themes (#c5c5c6 on white, on gray bubbles).
const props = defineProps<{
  state: string;
}>();
</script>

<template>
  <svg
    v-if="props.state === 'delivered'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="w-[.875rem] h-[.875rem] text-muted ml-[.4rem]"
    aria-label="delivered"
  >
    <path d="M1.5 14L5.8 18.2L14 8.5" />
    <path d="M10.2 14L14.5 18.2L22.5 7" />
  </svg>
  <svg
    v-else-if="props.state === 'read'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="w-[.875rem] h-[.875rem] text-accent-text ml-[.4rem]"
    aria-label="read"
  >
    <path d="M1.5 14L5.8 18.2L14 8.5" />
    <path d="M10.2 14L14.5 18.2L22.5 7" />
  </svg>
</template>
