<script setup lang="ts">
import useStore from "@src/store/store";

import AccordionButton from "@src/components/ui/data-display/AccordionButton.vue";
import Collapse from "@src/components/ui/utils/Collapse.vue";
import SettingsSwitch from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/SettingsSwitch.vue";

const props = defineProps<{
  collapsed: boolean;
  handleToggle: () => void;
}>();

const store = useStore();

// (event) toggle browser notifications: permission comes from the platform;
// the switch persists the preference and requests when enabling.
const handleAllowToggle = (value: boolean) => {
  store.settings.allowNotifications = value;
  if (
    value &&
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    void Notification.requestPermission();
  }
};
</script>

<template>
  <!--notifications settings-->
  <AccordionButton
    id="notifications-settings-toggler"
    class="w-full flex px-5 py-6 mb-3 rounded focus:outline-none"
    :collapsed="props.collapsed"
    chevron
    aria-controls="notifications-settings-collapse"
    @click="props.handleToggle()"
  >
    <p class="heading-2 text-black/70 dark:text-white/70 mb-4">Notifications</p>
    <p class="body-2 text-black/70 dark:text-white/70">
      Customize notifications
    </p>
  </AccordionButton>

  <Collapse id="notifications-settings-collapse" :collapsed="props.collapsed">
    <SettingsSwitch
      title="Allow Notifications"
      description="Desktop notifications for new messages when the tab is hidden"
      :value="!!store.settings.allowNotifications"
      :handle-toggle-switch="handleAllowToggle"
      class="mb-7"
    />
    <SettingsSwitch
      title="Keep Notifications"
      description="Save notifications after they are received"
      :value="!!store.settings.keepNotifications"
      :handle-toggle-switch="
        (value) => (store.settings.keepNotifications = value)
      "
      class="mb-7"
    />
  </Collapse>
</template>
