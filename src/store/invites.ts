// Room invites: list my open invites + accept/decline. Sidebar notifications
// render from here; WS invite.* events refresh it.
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { unwrap } from "@src/api/client";
import type { components } from "@src/api/schema";

type Invite = components["schemas"]["Invite"];

export const useInvitesStore = defineStore("invites", () => {
  const invites = ref<Invite[]>([]);

  async function loadInvites() {
    const rows = await unwrap(await client.GET("/invites"));
    invites.value = rows;
  }

  async function accept(inviteId: string) {
    await unwrap(
      await client.POST("/invites/{inviteId}/accept", {
        params: { path: { inviteId } },
      }),
    );
    invites.value = invites.value.filter((i) => i.id !== inviteId);
    // accepted → room appears on next rooms load
  }

  async function decline(inviteId: string) {
    await unwrap(
      await client.POST("/invites/{inviteId}/decline", {
        params: { path: { inviteId } },
      }),
    );
    invites.value = invites.value.filter((i) => i.id !== inviteId);
  }

  return { invites, loadInvites, accept, decline };
});

export default useInvitesStore;
