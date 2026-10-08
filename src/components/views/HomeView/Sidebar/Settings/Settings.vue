<script setup lang="ts">
import SidebarHeader from "@src/components/views/HomeView/Sidebar/SidebarHeader.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import SettingsAccordion from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/SettingsAccordion.vue";
</script>

<template>
  <div>
    <SidebarHeader>
      <template #title>Settings</template>
      <template #actions>
        <HelpLink to="/help/account-security" label="account and security" />
      </template>
    </SidebarHeader>

    <div
      class="w-full h-full scroll-smooth scrollbar-thin"
      style="overflow-x: visible; overflow-y: scroll"
    >
      <SettingsAccordion />
    </div>
  </div>
</template>
