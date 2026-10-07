<script setup lang="ts">
import type { Component } from "vue";

const props = defineProps<{
  icon: Component;
  title: string;
  notifications?: number;
  active?: boolean;
}>();
</script>

<template>
  <div class="xs:mb-0 md:mb-6">
    <button
      class="group relative focus:outline-none"
      :title="props.title"
      :aria-label="
        props.notifications
          ? props.title + ' ' + props.notifications + ' new notifications'
          : props.title
      "
    >
      <!--icon-->
      <component
        :is="props.icon"
        class="w-7 h-6 group-focus:text-indigo-600 hover:text-indigo-600 dark:group-focus:text-indigo-400 dark:hover:text-indigo-400 active:text-indigo-600 dark:active:text-indigo-400 active:scale-110 transition ease-out duration-200"
        :class="
          (props.active as boolean)
            ? ['text-indigo-600', 'dark:text-indigo-400']
            : ['text-muted']
        "
      />

      <!--notification pill-->
      <div
        v-if="props.notifications"
        class="absolute right-0 top-3 min-w-5 h-5 px-1 flex items-center justify-center outline-none bg-accent text-xs text-white border border-canvas rounded-full transition duration-500"
      >
        {{ props.notifications }}
      </div>
    </button>
  </div>
</template>
