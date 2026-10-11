// Session state backed by the httpOnly cookie (ADR-015). The client never
// sees a token; login sets it, logout clears it.
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { ApiError, unwrap } from "@src/api/client";
import { disablePush } from "@src/push";
import { mobileHandoffUrl } from "@src/mobileSignIn";
import { createPasskey, getPasskey } from "@src/passkey";
import type { components } from "@src/api/schema";
import usePrefsStore, { ACCENT_DEFAULT, applyAccent } from "@src/store/prefs";

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
    // accent + prefs load once per session (best effort)
    // awaited: the layout must be known before the first route renders
    if (me.value)
      await usePrefsStore()
        .load()
        .catch(() => {});
  }

  // Set when the password was right but a second factor is still needed.
  const challenge = ref<string | undefined>(undefined);

  async function login(
    username: string,
    password: string,
    turnstileToken?: string,
  ): Promise<void> {
    const result = await client.POST("/auth/login", {
      body: {
        username,
        password,
        token_request: false,
        turnstile_token: turnstileToken,
      },
    });
    try {
      me.value = (await unwrap(result)).user;
      challenge.value = undefined;
    } catch (e) {
      if (e instanceof ApiError && e.code === "two_factor_required") {
        challenge.value = e.challenge;
        return;
      }
      throw e;
    }
  }

  // TOTP or backup code for the pending challenge.
  async function login2fa(code: string): Promise<void> {
    const result = await client.POST("/auth/login/2fa", {
      body: { challenge: challenge.value ?? "", code, token_request: false },
    });
    me.value = (await unwrap(result)).user;
    challenge.value = undefined;
  }

  function cancel2fa(): void {
    challenge.value = undefined;
  }

  async function setupTwoFactor() {
    return unwrap(await client.POST("/users/me/2fa/setup", {}));
  }

  async function enableTwoFactor(code: string): Promise<string[]> {
    const r = await unwrap(
      await client.POST("/users/me/2fa/enable", { body: { code } }),
    );
    if (me.value) me.value = { ...me.value, two_factor_enabled: true };
    return r.backup_codes;
  }

  async function regenerateBackupCodes(code: string): Promise<string[]> {
    const r = await unwrap(
      await client.POST("/users/me/2fa/backup-codes", { body: { code } }),
    );
    return r.backup_codes;
  }

  async function disableTwoFactor(
    password: string,
    code: string,
  ): Promise<void> {
    await unwrap(
      await client.DELETE("/users/me/2fa", { body: { password, code } }),
    );
    if (me.value) me.value = { ...me.value, two_factor_enabled: false };
  }

  // Personal API tokens (mobile sign-in QR). The raw token comes back once.
  async function createApiToken(name: string) {
    return unwrap(await client.POST("/users/me/tokens", { body: { name } }));
  }

  async function listApiTokens() {
    return unwrap(await client.GET("/users/me/tokens"));
  }

  async function revokeApiToken(tokenId: string): Promise<void> {
    await unwrap(
      await client.DELETE("/users/me/tokens/{tokenId}", {
        params: { path: { tokenId } },
      }),
    );
  }

  // Passkeys. login/add resolve false when the user dismissed the prompt.
  async function loginWithPasskey(): Promise<boolean> {
    const begin = await unwrap(await client.POST("/auth/passkey/login/begin"));
    const credential = await getPasskey(begin.options);
    if (!credential) return false;
    const r = await unwrap(
      await client.POST("/auth/passkey/login/finish", {
        body: {
          ceremony_id: begin.ceremony_id,
          credential,
          token_request: false,
        },
      }),
    );
    me.value = r.user;
    challenge.value = undefined;
    return true;
  }

  async function listPasskeys() {
    return unwrap(await client.GET("/users/me/passkeys"));
  }

  // Re-auth (password, + code when 2FA is on) happens in begin.
  async function addPasskey(
    password: string,
    code: string,
    name: string,
  ): Promise<boolean> {
    const begin = await unwrap(
      await client.POST("/users/me/passkeys/begin", {
        body: { password, code: code || undefined },
      }),
    );
    const credential = await createPasskey(begin.options);
    if (!credential) return false;
    await unwrap(
      await client.POST("/users/me/passkeys/finish", {
        body: { ceremony_id: begin.ceremony_id, name, credential },
      }),
    );
    return true;
  }

  async function renamePasskey(passkeyId: string, name: string) {
    await unwrap(
      await client.PATCH("/users/me/passkeys/{passkeyId}", {
        params: { path: { passkeyId } },
        body: { name },
      }),
    );
  }

  async function deletePasskey(passkeyId: string): Promise<void> {
    await unwrap(
      await client.DELETE("/users/me/passkeys/{passkeyId}", {
        params: { path: { passkeyId } },
      }),
    );
  }

  // Invite signup (ADR-026): the token comes from the emailed link's fragment.
  async function lookupInvite(token: string): Promise<string> {
    return (
      await unwrap(await client.POST("/signup/lookup", { body: { token } }))
    ).email;
  }

  async function signup(
    body: components["schemas"]["SignupRequest"],
  ): Promise<void> {
    me.value = (await unwrap(await client.POST("/signup", { body }))).user;
    challenge.value = undefined;
    usePrefsStore()
      .load()
      .catch(() => {});
  }

  // Android handoff: mint a one-time code for the app's PKCE challenge and
  // deep-link it back. Works for any signed-in session.
  async function handoffToApp(
    codeChallenge: string,
    state: string,
  ): Promise<void> {
    const r = await unwrap(
      await client.POST("/auth/mobile/code", {
        body: { code_challenge: codeChallenge },
      }),
    );
    window.location.href = mobileHandoffUrl(
      window.location.origin,
      r.code,
      state,
    );
  }

  async function logout(): Promise<void> {
    try {
      await disablePush(); // needs the session; the device dies with it
      await unwrap(await client.POST("/auth/logout", {}));
    } finally {
      me.value = undefined;
      bootstrapped.value = false;
      applyAccent(ACCENT_DEFAULT);
    }
  }

  return {
    me,
    bootstrapped,
    challenge,
    bootstrap,
    login,
    login2fa,
    cancel2fa,
    setupTwoFactor,
    enableTwoFactor,
    regenerateBackupCodes,
    disableTwoFactor,
    lookupInvite,
    signup,
    loginWithPasskey,
    listPasskeys,
    addPasskey,
    renamePasskey,
    deletePasskey,
    handoffToApp,
    createApiToken,
    listApiTokens,
    revokeApiToken,
    logout,
  };
});

export { ApiError };
export default useAuthStore;
