<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import QRCode from "qrcode";

import useAuthStore from "@src/store/auth";
import { ApiError } from "@src/api/client";
import type { components } from "@src/api/schema";
import { mobileSignInUrl } from "@src/mobileSignIn";

import Button from "@src/components/ui/inputs/Button.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";

const auth = useAuthStore();

const tokens = ref<components["schemas"]["ApiToken"][]>([]);
const qr = ref(""); // data URL; exists only while the one-time view is open
const busy = ref(false);
const error = ref("");

const run = async (fn: () => Promise<void>) => {
  error.value = "";
  busy.value = true;
  try {
    await fn();
  } catch (e) {
    error.value =
      e instanceof ApiError && e.status !== 500
        ? e.message
        : "Something went wrong. Please try again.";
  } finally {
    busy.value = false;
  }
};

const refresh = async () => {
  tokens.value = await auth.listApiTokens();
};

// (event) mint a token and show it as a QR, once. The page origin is the
// server URL the phone should use (API and web UI share an origin).
const handleCreate = () =>
  run(async () => {
    const day = new Date().toLocaleDateString();
    const t = await auth.createApiToken(`Mobile ${day}`);
    qr.value = await QRCode.toDataURL(
      mobileSignInUrl(window.location.origin, t.token),
      // quiet zone of 4 modules (the QR spec): cameras need it against a dark UI
      { margin: 4, width: 288 },
    );
    await refresh();
  });

const handleRevoke = (id: string) =>
  run(async () => {
    await auth.revokeApiToken(id);
    await refresh();
  });

onMounted(() => run(refresh));
onBeforeUnmount(() => (qr.value = ""));
</script>

<template>
  <div class="flex items-start gap-1 mb-4">
    <p class="heading-2 text-fg">Mobile sign-in</p>
    <HelpLink
      to="/help/account-security#sign-in-on-your-phone-with-a-qr-code"
      label="mobile sign-in"
    />
  </div>

  <template v-if="qr">
    <p class="body-3 text-muted mb-4">
      Scan this in the goChatHub app (Sign in &rarr; Scan QR). It signs in
      without a password or two-factor code, so anyone who scans it can use your
      account. It will not be shown again.
    </p>
    <img
      :src="qr"
      alt="Mobile sign-in QR code"
      class="mb-4 bg-white w-72 h-72 max-w-full"
    />
    <Button
      class="contained-primary contained-text w-full py-4 mb-8"
      @click="qr = ''"
    >
      Done
    </Button>
  </template>
  <template v-else>
    <p class="body-3 text-muted mb-4">
      Sign in on your phone by scanning a QR code instead of typing a password.
    </p>
    <Button
      class="contained-primary contained-text w-full py-4 mb-4"
      :loading="busy"
      @click="handleCreate"
    >
      Create QR code
    </Button>
  </template>

  <p v-if="error" role="alert" class="body-3 text-error mb-4">{{ error }}</p>

  <ul v-if="tokens.length" class="mb-8">
    <li
      v-for="t in tokens"
      :key="t.id"
      class="flex items-center justify-between body-3 text-fg mb-2"
    >
      <span class="break-all">
        {{ t.name }}
        <span class="text-muted">
          &middot; used
          {{
            t.last_used_at
              ? new Date(t.last_used_at).toLocaleDateString()
              : "never"
          }}
        </span>
      </span>
      <button
        type="button"
        class="body-3 text-muted underline ml-4"
        :disabled="busy"
        @click="handleRevoke(t.id)"
      >
        Revoke
      </button>
    </li>
  </ul>
</template>
