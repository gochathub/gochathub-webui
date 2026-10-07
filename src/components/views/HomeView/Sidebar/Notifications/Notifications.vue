<script setup lang="ts">
import { onMounted } from "vue";

import useStore from "@src/store/store";
import useInvitesStore from "@src/store/invites";
import useRoomsStore from "@src/store/rooms";

import NoNotifications from "@src/components/states/empty-states/NoNotifications.vue";
import Notification from "@src/components/views/HomeView/Sidebar/Notifications/Notification.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import SidebarHeader from "@src/components/views/HomeView/Sidebar/SidebarHeader.vue";

const store = useStore();
const invites = useInvitesStore();
const rooms = useRoomsStore();

const handleAccept = async (inviteId: string) => {
  await invites.accept(inviteId);
  await rooms.loadRooms();
};

onMounted(() => invites.loadInvites());
</script>

<template>
  <div>
    <SidebarHeader>
      <template #title>Notifications</template>
    </SidebarHeader>

    <div
      class="w-full h-full scroll-smooth scrollbar-hidden"
      style="overflow-x: visible; overflow-y: scroll"
    >
      <!--open room invites-->
      <div
        v-for="invite in invites.invites"
        :key="invite.id"
        class="w-full px-5 py-5 mb-3 flex flex-col rounded bg-select"
        :aria-label="'invitation to ' + (invite.room.name ?? 'a room')"
      >
        <p class="heading-2 text-fg mb-2">
          You've been invited ({{ invite.room.name ?? "private room" }})
        </p>
        <p class="body-2 text-muted mb-4">
          by {{ invite.inviter?.display_name ?? "someone" }}
        </p>

        <div class="flex">
          <Button
            class="contained-primary contained-text mr-2"
            @click="handleAccept(invite.id)"
          >
            Accept
          </Button>
          <Button
            class="outlined-danger outlined-text"
            @click="invites.decline(invite.id)"
          >
            Decline
          </Button>
        </div>
      </div>

      <!--event feed from the socket (contact changes etc.)-->
      <Notification
        v-for="(notification, index) in store.notifications"
        :key="index"
        :notification="notification"
      />

      <NoNotifications
        v-if="invites.invites.length === 0 && store.notifications.length === 0"
      />
    </div>
  </div>
</template>
