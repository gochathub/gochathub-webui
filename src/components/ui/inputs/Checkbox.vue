<script setup lang="ts">
import { CheckIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  value: boolean;
  inputId?: string;
  handleCheck?: () => void;
}>();

defineEmits(["update"]);
</script>

<template>
  <div class="relative flex justify-center items-center">
    <input
      :id="props.inputId"
      :class="
        props.value ? ['bg-accent', 'border-accent'] : ['border-gray-300']
      "
      type="checkbox"
      :checked="props.value"
      class="h-5 w-5 appearance-none relative cursor-pointer outline-none rounded-[.3125rem] border transition-all duration-300"
      @click="
        () => {
          if (props.handleCheck) props.handleCheck();
          $emit('update', !props.value);
        }
      "
    />
    <CheckIcon
      class="absolute top-[.1875rem] cursor-pointer z-10 left-[.125rem] w-4 h-4 text-white transition-all duration-300"
      :class="props.value ? [] : ['hidden']"
      @click="
        () => {
          if (props.handleCheck) props.handleCheck();
          $emit('update', !props.value);
        }
      "
    />
  </div>
</template>
