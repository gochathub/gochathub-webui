<script setup lang="ts">
const props = defineProps<{
  active: boolean;
  name: string;
}>();
</script>

<template>
  <button
    class="p-4 flex-auto rounded-sm outline-none focus:outline-none transition-all duration-200"
    :class="props.active ? ['bg-accent', 'text-white'] : ['text-muted']"
  >
    <p class="body-5">{{ props.name }}</p>
  </button>
</template>
