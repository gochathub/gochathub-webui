<template>
  <div
    class="w-full min-h-[3.5rem] max-h-fit px-5 py-4 flex justify-between items-center"
  >
    <p tabindex="0" class="heading-1 text-fg outline-none">
      <slot name="title"></slot>
    </p>

    <div>
      <slot name="actions"></slot>
    </div>
  </div>
</template>
