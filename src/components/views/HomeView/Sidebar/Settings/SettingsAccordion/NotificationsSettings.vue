<script setup lang="ts">
import useStore from "@src/store/store";
import { disablePush, enablePush, pushSupported } from "@src/push";

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
const handleAllowToggle = async (value: boolean) => {
  store.settings.allowNotifications = value;
  if (!value) {
    await disablePush();
    return;
  }
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  // background push when supported; otherwise the WS path covers hidden tabs
  if (Notification.permission === "granted" && pushSupported()) {
    try {
      await enablePush();
    } catch {
      store.notifications = [
        ...store.notifications,
        {
          flag: "account-update",
          title: "Something went wrong",
          message: "Could not enable background notifications.",
        },
      ];
    }
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
    <p class="heading-2 text-fg mb-4">Notifications</p>
    <p class="body-2 text-muted">Customize notifications</p>
  </AccordionButton>

  <Collapse id="notifications-settings-collapse" :collapsed="props.collapsed">
    <SettingsSwitch
      title="Allow Notifications"
      help-to="/help/notifications#turn-them-on"
      description="Notifications for new messages, even when the app is closed"
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
