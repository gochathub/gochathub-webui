<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

const props = defineProps<{
  handleClick?: () => void;
  label?: string;
}>();
</script>

<template>
  <button
    :aria-label="props.label"
    role="menuitem"
    @click.prevent="props.handleClick"
  >
    <slot></slot>
  </button>
</template>
