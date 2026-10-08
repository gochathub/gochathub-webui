<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import { ApiError } from "@src/api/client";
import { mapUser } from "@src/api/mappers";

import Button from "@src/components/ui/inputs/Button.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";
import TurnstileWidget from "@src/components/ui/inputs/TurnstileWidget.vue";
import Wordmark from "@src/components/ui/brand/Wordmark.vue";
import { turnstileSiteKey } from "@src/turnstile";

const router = useRouter();
const store = useStore();
const auth = useAuthStore();

const username = ref("");
const password = ref("");
const code = ref("");
// Turnstile: no site key configured = no widget, no gating
const turnstileToken = ref<string | undefined>(undefined);
const turnstile = ref<InstanceType<typeof TurnstileWidget>>();
const needsToken = computed(
  () => !!turnstileSiteKey && !auth.challenge && !turnstileToken.value,
);
const submitting = ref(false);
const error = ref("");

// (event) log in with the httpOnly session cookie; a 2FA account stops after
// the password (auth.challenge set) and finishes with a code.
const handleLogin = async () => {
  error.value = "";
  submitting.value = true;
  const secondStep = !!auth.challenge;

  try {
    if (secondStep) await auth.login2fa(code.value.trim());
    else await auth.login(username.value, password.value, turnstileToken.value);
    if (auth.challenge) return; // now waiting for the code
    store.$patch({ user: mapUser(auth.me!), status: "success" });
    router.push({ name: "No-Chat" });
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === "unauthorized"
        ? secondStep
          ? "Invalid or expired code."
          : "Wrong username or password."
        : e instanceof ApiError && e.code === "captcha_failed"
          ? "Verification failed. Please try again."
          : "Something went wrong. Please try again.";
  } finally {
    submitting.value = false;
    // tokens are single-use: every password attempt needs a fresh one
    if (!secondStep) turnstile.value?.reset();
  }
};

const handleBack = () => {
  auth.cancel2fa();
  code.value = "";
  error.value = "";
};
</script>

<template>
  <div
    class="p-5 md:basis-1/2 xs:basis-full flex flex-col justify-center items-center"
  >
    <div class="w-full max-w-md">
      <!--header-->
      <div class="mb-6 flex flex-col">
        <Wordmark size="lg" class="mb-4" />
        <p class="heading-2 text-fg mb-4">Welcome back</p>
        <p class="body-3 text-muted font-light">
          Sign in to your account to start messaging.
        </p>
      </div>

      <!--form-->
      <form class="mb-6" @submit.prevent="handleLogin">
        <template v-if="!auth.challenge">
          <LabeledTextInput
            :value="username"
            label="Username"
            placeholder="Enter your username"
            class="mb-5"
            @value-changed="
              (value) => {
                username = value;
              }
            "
          />
          <PasswordInput
            :value="password"
            label="Password"
            placeholder="Enter your password"
            @value-changed="
              (value) => {
                password = value;
              }
            "
          />
          <TurnstileWidget
            v-if="turnstileSiteKey"
            ref="turnstile"
            :site-key="turnstileSiteKey"
            @token="(t) => (turnstileToken = t)"
            @expired="turnstileToken = undefined"
          />
        </template>
        <template v-else>
          <div class="mb-2">
            <HelpLink
              to="/help/account-security#two-factor-authentication"
              label="two-factor sign-in"
            />
          </div>
          <LabeledTextInput
            :value="code"
            label="Authentication code"
            placeholder="6-digit code or backup code"
            @value-changed="
              (value) => {
                code = value;
              }
            "
          />
          <button
            type="button"
            class="body-3 text-muted mt-3 underline"
            @click="handleBack"
          >
            Back
          </button>
        </template>

        <p v-if="error" role="alert" class="body-3 text-error mt-4">
          {{ error }}
          <HelpLink to="/help/troubleshooting" label="sign-in problems" />
        </p>

        <!--local controls-->
        <div class="mb-6 mt-6">
          <Button
            class="contained-primary contained-text w-full mb-4 disabled:opacity-50"
            type="submit"
            :loading="submitting"
            :disabled="needsToken"
          >
            {{ auth.challenge ? "Verify" : "Sign in" }}
          </Button>
        </div>
      </form>

      <p class="body-3 text-muted text-center">
        Need an account? Ask your administrator — accounts are created via the
        server CLI.
        <router-link to="/help" class="underline">Help</router-link>
      </p>
    </div>
  </div>
</template>
