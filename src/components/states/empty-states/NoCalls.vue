<script setup lang="ts">
import { PhoneIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  vertical?: boolean;
}>();
</script>

<template>
  <div
    class="w-full p-5 flex"
    :class="
      props.vertical
        ? ['flex-col', 'justify-center', 'items-center']
        : ['flex-row']
    "
  >
    <!--icon-->
    <div :class="props.vertical ? ['mb-3'] : []">
      <div
        class="w-7 h-7 mr-4 flex justify-center items-center rounded-full bg-select transition duration-500"
      >
        <PhoneIcon class="w-5 h-5 text-muted" />
      </div>
    </div>

    <!--content-->
    <div :class="props.vertical ? [] : ['flex', 'flex-col', 'items-start']">
      <p class="heading-2 text-fg mb-3">No Calls</p>

      <p class="body-2 text-muted flex">
        You didn't receive or send any calls.
      </p>
    </div>
  </div>
</template>
