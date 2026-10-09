<script setup lang="ts">
import useStore from "@src/store/store";
import usePrefsStore, { ACCENT_SWATCHES } from "@src/store/prefs";

import AccordionButton from "@src/components/ui/data-display/AccordionButton.vue";
import Collapse from "@src/components/ui/utils/Collapse.vue";
import SettingsSwitch from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/SettingsSwitch.vue";

const props = defineProps<{
  collapsed: boolean;
  handleToggle: () => void;
}>();

const store = useStore();
const prefs = usePrefsStore();
prefs.load();
</script>

<template>
  <!--appearance settings-->
  <AccordionButton
    id="appearance-settings-toggler"
    class="w-full flex px-5 py-6 mb-3 rounded focus:outline-none"
    :collapsed="props.collapsed"
    chevron
    aria-controls="appearance-settings-collapse"
    @click="props.handleToggle()"
  >
    <p class="heading-2 text-fg mb-4">Appearance</p>
    <p class="body-2 text-muted">Customize the look and feel</p>
  </AccordionButton>

  <Collapse id="appearance-settings-collapse" :collapsed="props.collapsed">
    <SettingsSwitch
      title="Dark Mode"
      description="Apply a theme with dark colors"
      :value="!!store.settings.darkMode"
      :handle-toggle-switch="(value) => (store.settings.darkMode = value)"
      class="mb-7"
    />

    <!--accent color-->
    <div class="mb-7">
      <p class="heading-2 text-fg mb-1">Accent color</p>
      <p class="body-2 text-muted">Follows your account to every device</p>
      <div class="flex flex-wrap gap-3 mt-3">
        <button
          v-for="swatch in ACCENT_SWATCHES"
          :key="swatch.hex"
          type="button"
          class="h-9 w-9 rounded-full border-2"
          :class="
            prefs.primaryColor === swatch.hex
              ? 'border-fg'
              : 'border-transparent'
          "
          :style="{ backgroundColor: swatch.hex }"
          :aria-pressed="prefs.primaryColor === swatch.hex"
          :aria-label="`Accent color ${swatch.name}`"
          :title="swatch.name"
          @click="prefs.setPrimaryColor(swatch.hex)"
        />
        <button
          v-if="prefs.primaryColor !== ACCENT_SWATCHES[0].hex"
          type="button"
          class="heading-2 text-fg underline"
          @click="prefs.setPrimaryColor(ACCENT_SWATCHES[0].hex)"
        >
          Reset
        </button>
      </div>
    </div>

    <SettingsSwitch
      title="Grammar & Spelling"
      help-to="/help/appearance#grammar-and-spelling"
      description="Check English grammar and spelling while you type"
      :value="prefs.spellcheck"
      :handle-toggle-switch="(value) => prefs.setSpellcheck(value)"
      class="mb-7"
    />
  </Collapse>
</template>
