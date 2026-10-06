// Session state backed by the httpOnly cookie (ADR-015). The client never
// sees a token; login sets it, logout clears it.
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { ApiError, unwrap } from "@src/api/client";
import type { components } from "@src/api/schema";

export const useAuthStore = defineStore("auth", () => {
  const me = ref<components["schemas"]["User"] | undefined>(undefined);
  const bootstrapped = ref(false);

  // Fetch the session user; undefined when not logged in. Never throws for
  // the unauthenticated case — callers branch on the user value.
  async function bootstrap(): Promise<void> {
    if (bootstrapped.value) return;
    try {
      me.value = await unwrap(await client.GET("/users/me"));
    } catch {
      me.value = undefined;
    } finally {
      bootstrapped.value = true;
    }
  }

  async function login(username: string, password: string): Promise<void> {
    const result = await client.POST("/auth/login", {
      body: { username, password, token_request: false },
    });
    me.value = (await unwrap(result)).user;
  }

  async function logout(): Promise<void> {
    try {
      await unwrap(await client.POST("/auth/logout", {}));
    } finally {
      me.value = undefined;
      bootstrapped.value = false;
    }
  }

  return { me, bootstrapped, bootstrap, login, logout };
});

export { ApiError };
export default useAuthStore;
