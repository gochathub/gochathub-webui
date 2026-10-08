<script setup lang="ts">
import { onMounted, watch } from "vue";

import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import { mapUser } from "@src/api/mappers";
import useRoomsStore from "@src/store/rooms";
import { startWS, stopWS } from "@src/ws/connection";
import ws from "@src/ws/client";

import router from "@src/router";
import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";
import UpdatePrompt from "@src/components/shared/UpdatePrompt.vue";
import HelpDrawer from "@src/components/shared/HelpDrawer.vue";

// Refactoring code:
// todo refactor remove getters from utils file and add them to store folder.

const store = useStore();
const auth = useAuthStore();

// update localStorage with state changes
// ponytail: settings/emoji persistence only; the session lives in the
// httpOnly cookie and nothing else crosses a reload.
store.$subscribe((_mutation, state) => {
  localStorage.setItem("chat", JSON.stringify(state));
});

// bootstrap the session: fetch the logged-in user, then flip app status.
onMounted(async () => {
  store.status = "loading";
  await auth.bootstrap();

  if (auth.me) {
    store.$patch({ user: mapUser(auth.me), status: "success" });
  } else {
    store.status = "idle";
  }
  store.delayLoading = false;
});

// socket lives with the session; rooms load once per login.
watch(
  () => auth.me?.id,
  (id) => {
    const rooms = useRoomsStore();
    if (id) {
      startWS();
      rooms.loadRooms();
    } else {
      stopWS();
    }
  },
  { immediate: true },
);

// notification click on an already-open window: the SW asks us to navigate
navigator.serviceWorker?.addEventListener("message", (e) => {
  if (typeof e.data?.openRoom === "string") {
    void router.push({ name: "Chat", params: { id: e.data.openRoom } });
  }
});

// reconnect: REST is reauthoritative per WEBSOCKETS.md
watch(
  () => ws.status.value,
  (status) => {
    if (status === "open") useRoomsStore().resync();
  },
);
</script>

<template>
  <div :class="{ dark: store.settings.darkMode }">
    <div class="h-dvh bg-canvas transition-colors duration-500">
      <router-view v-slot="{ Component }">
        <FadeTransition>
          <component :is="Component" />
        </FadeTransition>
      </router-view>
    </div>
    <UpdatePrompt />
    <HelpDrawer />
  </div>
</template>
