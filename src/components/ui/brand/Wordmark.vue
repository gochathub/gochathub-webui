<script setup lang="ts">
// brand lockup: hub icon (pack art, monochrome via currentColor) + wordmark
// text in the app's Fredoka face. `size` scales icon and text together.
defineProps<{
  size?: "sm" | "md" | "lg";
}>();
</script>

<template>
  <span
    class="inline-flex items-center gap-2 font-bold tracking-tight select-none whitespace-nowrap text-indigo-400"
    :class="{
      'text-sm': size === 'sm',
      'text-lg': size === 'md',
      'text-3xl': size === 'lg',
      'text-2xl': size === undefined,
    }"
  >
    <svg
      class="w-[1em] h-[1em]"
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" stroke-width="28" stroke-linecap="round">
        <path d="M256 82V143" />
        <path d="M132 145L181 174" />
        <path d="M380 145L331 174" />
        <path d="M132 367L181 338" />
        <path d="M380 367L331 338" />
        <path d="M256 430V369" />
      </g>
      <g fill="currentColor">
        <circle cx="256" cy="66" r="34" />
        <circle cx="112" cy="133" r="34" />
        <circle cx="400" cy="133" r="34" />
        <circle cx="112" cy="379" r="34" />
        <circle cx="400" cy="379" r="34" />
        <circle cx="256" cy="446" r="34" />
      </g>
      <path
        d="M173 165H339C377 165 401 188 401 226V286C401 324 377 347 339 347H238L183 392V347H173C135 347 111 324 111 286V226C111 188 135 165 173 165Z"
        stroke="currentColor"
        stroke-width="24"
      />
      <g fill="currentColor">
        <circle cx="207" cy="256" r="15" />
        <circle cx="256" cy="256" r="15" />
        <circle cx="305" cy="256" r="15" />
      </g>
    </svg>
    goChatHub
  </span>
</template>
