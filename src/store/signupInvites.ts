// Admin view of email signup invites (ADR-026). 404 from the list means the
// server has no SMTP configured.
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { ApiError, unwrap } from "@src/api/client";
import type { components } from "@src/api/schema";

export type SignupInvite = components["schemas"]["SignupInvite"];

export const useSignupInvitesStore = defineStore("signupInvites", () => {
  const invites = ref<SignupInvite[]>([]);
  // false once the server answers 404 (mail not configured)
  const enabled = ref(true);

  async function load() {
    try {
      invites.value = await unwrap(await client.GET("/admin/signup-invites"));
      enabled.value = true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) enabled.value = false;
      else throw e;
    }
  }

  // 502 mail_failed still saved the invite: reload so the row shows up
  async function invite(email: string) {
    try {
      await unwrap(
        await client.POST("/admin/signup-invites", { body: { email } }),
      );
    } finally {
      await load();
    }
  }

  async function resend(inviteId: string) {
    try {
      await unwrap(
        await client.POST("/admin/signup-invites/{inviteId}/resend", {
          params: { path: { inviteId } },
        }),
      );
    } finally {
      await load();
    }
  }

  async function revoke(inviteId: string) {
    await unwrap(
      await client.DELETE("/admin/signup-invites/{inviteId}", {
        params: { path: { inviteId } },
      }),
    );
    await load();
  }

  return { invites, enabled, load, invite, resend, revoke };
});

export default useSignupInvitesStore;
