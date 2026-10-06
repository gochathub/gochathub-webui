<script setup lang="ts">
import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";

// ponytail: avatar upload on room create waits for attachment storage; name only.
const props = defineProps<{
  groupName?: string;
}>();

const emits = defineEmits<{
  groupNameChanged: [string];
  activePageChange: [{ tabName: string; animationName: string }];
}>();
</script>

<template>
  <div class="px-5">
    <!--inputs-->
    <div class="mb-5">
      <LabeledTextInput
        type="text"
        placeholder="Group name"
        label="Name"
        :value="props.groupName"
        @value-changed="(value: string) => emits('groupNameChanged', value)"
      />
    </div>

    <!--next button-->
    <div class="flex pb-6">
      <div class="grow"></div>
      <Button
        class="contained-primary contained-text"
        :disabled="!props.groupName"
        @click="
          emits('activePageChange', {
            tabName: 'group-members',
            animationName: 'slide-left',
          })
        "
      >
        Next
      </Button>
    </div>
  </div>
</template>
