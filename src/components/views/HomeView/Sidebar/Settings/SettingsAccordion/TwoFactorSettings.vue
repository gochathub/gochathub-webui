<script setup lang="ts">
import { computed, ref } from "vue";
import QRCode from "qrcode";

import useAuthStore from "@src/store/auth";
import { ApiError } from "@src/api/client";

import Button from "@src/components/ui/inputs/Button.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";

const auth = useAuthStore();
const enabled = computed(() => !!auth.me?.two_factor_enabled);

type Step = "idle" | "setup" | "codes" | "disable";
const step = ref<Step>("idle");
const busy = ref(false);
const error = ref("");

const qr = ref("");
const secret = ref("");
const code = ref("");
const password = ref("");
const backupCodes = ref<string[]>([]);

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

// (event) start enrollment: server returns the secret + otpauth URL
const handleSetup = () =>
  run(async () => {
    const s = await auth.setupTwoFactor();
    secret.value = s.secret;
    qr.value = await QRCode.toDataURL(s.otpauth_url, { margin: 1, width: 200 });
    code.value = "";
    step.value = "setup";
  });

// (event) confirm with the first code; backup codes are shown exactly once
const handleEnable = () =>
  run(async () => {
    backupCodes.value = await auth.enableTwoFactor(code.value.trim());
    code.value = "";
    step.value = "codes";
  });

const handleRegenerate = () =>
  run(async () => {
    backupCodes.value = await auth.regenerateBackupCodes(code.value.trim());
    code.value = "";
    step.value = "codes";
  });

const handleDisable = () =>
  run(async () => {
    await auth.disableTwoFactor(password.value, code.value.trim());
    password.value = "";
    code.value = "";
    step.value = "idle";
  });

const reset = () => {
  step.value = "idle";
  code.value = "";
  password.value = "";
  error.value = "";
};
</script>

<template>
  <div class="flex items-start gap-1 mb-4">
    <p class="heading-2 text-fg">Two-factor authentication</p>
    <HelpLink
      to="/help/account-security#two-factor-authentication"
      label="two-factor authentication"
    />
  </div>

  <!--idle-->
  <template v-if="step === 'idle'">
    <p class="body-3 text-muted mb-4">
      {{
        enabled
          ? "Two-factor authentication is on."
          : "Add a second step at sign-in using an authenticator app."
      }}
    </p>
    <Button
      v-if="!enabled"
      class="contained-primary contained-text w-full py-4 mb-8"
      :loading="busy"
      @click="handleSetup"
    >
      Set up
    </Button>
    <template v-else>
      <Button
        class="contained-primary contained-text w-full py-4 mb-4"
        @click="step = 'disable'"
      >
        Turn off
      </Button>
      <Button
        class="contained-primary contained-text w-full py-4 mb-8"
        @click="step = 'codes'"
      >
        New backup codes
      </Button>
    </template>
  </template>

  <!--setup: scan, then confirm with a code-->
  <template v-else-if="step === 'setup'">
    <p class="body-3 text-muted mb-4">
      Scan this code with your authenticator app, then enter the 6-digit code.
    </p>
    <img :src="qr" alt="Authenticator QR code" class="mb-4 bg-white" />
    <p class="body-3 text-muted mb-4 break-all">
      Or enter manually: {{ secret }}
    </p>
    <LabeledTextInput
      label="Code"
      class="mb-5"
      :value="code"
      @value-changed="(value) => (code = value)"
    />
    <p v-if="error" role="alert" class="body-3 text-error mb-4">{{ error }}</p>
    <Button
      class="contained-primary contained-text w-full py-4 mb-4"
      :loading="busy"
      @click="handleEnable"
    >
      Turn on
    </Button>
    <button
      type="button"
      class="body-3 text-muted mb-8 underline"
      @click="reset"
    >
      Cancel
    </button>
  </template>

  <!--backup codes: shown once after enable; or ask for a code to regenerate-->
  <template v-else-if="step === 'codes'">
    <template v-if="backupCodes.length">
      <p class="body-3 text-muted mb-4">
        Save these backup codes somewhere safe. Each works once and they will
        not be shown again.
      </p>
      <ul class="mb-4 font-mono body-3 text-fg">
        <li v-for="c in backupCodes" :key="c">{{ c }}</li>
      </ul>
      <Button
        class="contained-primary contained-text w-full py-4 mb-8"
        @click="
          backupCodes = [];
          reset();
        "
      >
        Done
      </Button>
    </template>
    <template v-else>
      <p class="body-3 text-muted mb-4">
        Enter a current code to replace your backup codes.
      </p>
      <LabeledTextInput
        label="Code"
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
        @click="handleRegenerate"
      >
        Generate new codes
      </Button>
      <button
        type="button"
        class="body-3 text-muted mb-8 underline"
        @click="reset"
      >
        Cancel
      </button>
    </template>
  </template>

  <!--disable-->
  <template v-else>
    <PasswordInput
      label="Current password"
      class="mb-5"
      :value="password"
      @value-changed="(value) => (password = value)"
    />
    <LabeledTextInput
      label="Code or backup code"
      class="mb-5"
      :value="code"
      @value-changed="(value) => (code = value)"
    />
    <p v-if="error" role="alert" class="body-3 text-error mb-4">{{ error }}</p>
    <Button
      class="contained-primary contained-text w-full py-4 mb-4"
      :loading="busy"
      @click="handleDisable"
    >
      Turn off
    </Button>
    <button
      type="button"
      class="body-3 text-muted mb-8 underline"
      @click="reset"
    >
      Cancel
    </button>
  </template>
</template>
