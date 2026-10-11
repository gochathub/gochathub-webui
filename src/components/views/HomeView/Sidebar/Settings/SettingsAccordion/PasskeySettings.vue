<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import useAuthStore from "@src/store/auth";
import { ApiError } from "@src/api/client";
import type { components } from "@src/api/schema";
import { passkeysSupported } from "@src/passkey";

import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";

const auth = useAuthStore();
const twoFactor = computed(() => !!auth.me?.two_factor_enabled);

const passkeys = ref<components["schemas"]["Passkey"][]>([]);
const adding = ref(false);
const name = ref("");
const password = ref("");
const code = ref("");
const busy = ref(false);
const error = ref("");

const run = async (fn: () => Promise<void>) => {
  error.value = "";
  busy.value = true;
  try {
    await fn();
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === "passkeys_disabled"
        ? "Passkeys are not enabled on this server."
        : e instanceof ApiError && e.code === "unauthorized"
          ? "Wrong password or code."
          : e instanceof ApiError && e.status !== 500
            ? e.message
            : "Something went wrong. Please try again.";
  } finally {
    busy.value = false;
  }
};

const refresh = async () => {
  passkeys.value = await auth.listPasskeys();
};

// (event) re-auth (password + code when 2FA is on), then the browser prompt
const handleAdd = () =>
  run(async () => {
    const added = await auth.addPasskey(
      password.value,
      code.value.trim(),
      name.value.trim(),
    );
    if (!added) return; // prompt dismissed
    password.value = "";
    code.value = "";
    name.value = "";
    adding.value = false;
    await refresh();
  });

const handleRename = (p: components["schemas"]["Passkey"]) => {
  const next = window.prompt("Passkey name", p.name)?.trim();
  if (!next || next === p.name) return;
  return run(async () => {
    await auth.renamePasskey(p.id, next);
    await refresh();
  });
};

const handleDelete = (id: string) =>
  run(async () => {
    await auth.deletePasskey(id);
    await refresh();
  });

onMounted(() => passkeysSupported && run(refresh));
</script>

<template>
  <template v-if="passkeysSupported">
    <p class="heading-2 text-fg mb-4">Passkeys</p>
    <p class="body-3 text-muted mb-4">
      Sign in with your fingerprint, face or device PIN instead of a password. A
      passkey replaces the two-factor step too.
    </p>

    <template v-if="adding">
      <LabeledTextInput
        label="Name (e.g. MacBook)"
        class="mb-5"
        :value="name"
        @value-changed="(value) => (name = value)"
      />
      <PasswordInput
        label="Current password"
        class="mb-5"
        :value="password"
        @value-changed="(value) => (password = value)"
      />
      <LabeledTextInput
        v-if="twoFactor"
        label="Authentication code"
        class="mb-5"
        :value="code"
        @value-changed="(value) => (code = value)"
      />
      <p v-if="error" role="alert" class="body-3 text-error mb-4">
        {{ error }}
      </p>
      <Button
        class="contained-primary contained-text w-full py-4 mb-4"
        :loading="busy"
        @click="handleAdd"
      >
        Continue
      </Button>
      <button
        type="button"
        class="body-3 text-muted mb-8 underline"
        @click="adding = false"
      >
        Cancel
      </button>
    </template>
    <template v-else>
      <Button
        class="contained-primary contained-text w-full py-4 mb-4"
        @click="adding = true"
      >
        Add a passkey
      </Button>
      <p v-if="error" role="alert" class="body-3 text-error mb-4">
        {{ error }}
      </p>
    </template>

    <ul v-if="passkeys.length" class="mb-8">
      <li
        v-for="p in passkeys"
        :key="p.id"
        class="flex items-center justify-between body-3 text-fg mb-2"
      >
        <span class="break-all">
          {{ p.name }}
          <span class="text-muted">
            &middot; used
            {{
              p.last_used_at
                ? new Date(p.last_used_at).toLocaleDateString()
                : "never"
            }}
          </span>
        </span>
        <span class="ml-4 shrink-0">
          <button
            type="button"
            class="body-3 text-muted underline mr-3"
            :disabled="busy"
            @click="handleRename(p)"
          >
            Rename
          </button>
          <button
            type="button"
            class="body-3 text-muted underline"
            :disabled="busy"
            @click="handleDelete(p.id)"
          >
            Delete
          </button>
        </span>
      </li>
    </ul>
  </template>
</template>
