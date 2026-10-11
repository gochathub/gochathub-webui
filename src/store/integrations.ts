// Rocket.Chat link (server ADR-023/024): the user's own workspace + Personal
// Access Token. The token goes to the server once and is never read back.
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { ApiError, unwrap } from "@src/api/client";
import type { components } from "@src/api/schema";
import useRoomsStore from "@src/store/rooms";

type Link = components["schemas"]["RocketChatLink"];

// the first sync runs server-side after the link call; reload the room list
// a few times so mirrored rooms appear without a manual refresh
const RELOAD_AFTER_MS = [2000, 6000, 15000];

export const useIntegrationsStore = defineStore("integrations", () => {
  const rooms = useRoomsStore();
  const link = ref<Link>({ linked: false });
  // 404 means the server runs without RC_PAT_KEY: hide the whole section
  const available = ref(true);

  async function load() {
    try {
      link.value = await unwrap(
        await client.GET("/integrations/rocket-chat/link"),
      );
      available.value = true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) available.value = false;
      else throw e;
    }
  }

  async function connect(baseUrl: string, rcUserId: string, token: string) {
    link.value = await unwrap(
      await client.POST("/integrations/rocket-chat/link", {
        body: {
          base_url: baseUrl.trim() || undefined,
          rc_user_id: rcUserId.trim(),
          token: token.trim(),
        },
      }),
    );
    for (const ms of RELOAD_AFTER_MS) setTimeout(() => rooms.loadRooms(), ms);
  }

  async function disconnect() {
    await unwrap(await client.DELETE("/integrations/rocket-chat/link"));
    link.value = { linked: false };
    await rooms.loadRooms(); // mirrored rooms are hidden server-side
  }

  return { link, available, load, connect, disconnect };
});

export default useIntegrationsStore;
