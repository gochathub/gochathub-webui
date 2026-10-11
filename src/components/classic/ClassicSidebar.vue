<script setup lang="ts">
import { computed } from "vue";

import useStore from "@src/store/store";

import ClassicRoomList from "@src/components/classic/ClassicRoomList.vue";
import ClassicWordmark from "@src/components/classic/ClassicWordmark.vue";
import Contacts from "@src/components/views/HomeView/Sidebar/Contacts/Contacts.vue";
import Notifications from "@src/components/views/HomeView/Sidebar/Notifications/Notifications.vue";
import Settings from "@src/components/views/HomeView/Sidebar/Settings/Settings.vue";

const store = useStore();

// rooms are the classic list; the other sections reuse the existing panels
const panel = computed(
  () =>
    ({
      contacts: Contacts,
      notifications: Notifications,
      settings: Settings,
    })[store.activeSidebarComponent as string],
);
</script>

<template>
  <aside
    class="xs:w-full md:w-[21.875rem] h-full flex flex-col bg-surface md:border-r border-hairline shrink-0"
  >
    <div class="grow min-h-0 overflow-y-auto scrollbar-thin">
      <component :is="panel" v-if="panel" class="h-full flex flex-col" />
      <ClassicRoomList v-else />
    </div>
    <ClassicWordmark />
  </aside>
</template>
