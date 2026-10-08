<script setup lang="ts">
import SwitchInput from "@src/components/ui/inputs/SwitchInput.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";

const props = defineProps<{
  helpTo?: string;
  value: boolean;
  title: string;
  description: string;
  handleToggleSwitch: (value: boolean) => any;
}>();
</script>

<template>
  <div class="w-full flex flex-col">
    <div class="flex">
      <!--label-->
      <div class="grow flex items-start gap-1">
        <label
          for="last-seen"
          class="inline-block outline-none mb-4"
          tabindex="0"
        >
          <p class="heading-2 text-fg">
            {{ props.title }}
          </p>
        </label>
        <HelpLink
          v-if="props.helpTo"
          :to="props.helpTo"
          :label="props.title.toLowerCase()"
        />
      </div>

      <!--switch-->
      <SwitchInput
        id="last-seen"
        :value="props.value"
        @switch-clicked="(value) => props.handleToggleSwitch(value)"
      />
    </div>
    <!--description or help text-->
    <p class="body-2 text-muted help-block outline-none" tabindex="0">
      {{ props.description }}
    </p>
  </div>
</template>
