<script setup lang="ts">
import { MagnifyingGlassIcon, XCircleIcon } from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";

defineEmits(["valueChanged"]);

const props = defineProps<{
  variant?: string;
  class?: string;
  value?: string;
}>();
</script>

<template>
  <LabeledTextInput
    placeholder="Search.."
    class="pl-7"
    :value="props.value"
    @value-changed="(value) => $emit('valueChanged', value)"
  >
    <template #startAdornment>
      <MagnifyingGlassIcon
        class="w-5 h-5 mx-[8px] translate-y-[75%] text-muted"
      />
    </template>
    <template #endAdornment>
      <IconButton
        v-if="props.value"
        title="clear text"
        aria-label="clear text"
        class="ic-btn-ghost-gray m-[.5rem] p-2"
        @click="
          () => {
            if (props.value) $emit('valueChanged', '');
          }
        "
      >
        <XCircleIcon class="w-5 h-5" />
      </IconButton>
    </template>
  </LabeledTextInput>
</template>
