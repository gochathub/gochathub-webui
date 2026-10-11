<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import { ACCENT_SWATCHES, applyAccent } from "@src/store/prefs";
import { ApiError } from "@src/api/client";
import { mapUser } from "@src/api/mappers";
import { turnstileSiteKey } from "@src/turnstile";

import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";
import TurnstileWidget from "@src/components/ui/inputs/TurnstileWidget.vue";
import Wordmark from "@src/components/ui/brand/Wordmark.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();
const auth = useAuthStore();

// invite token lives in the link fragment (never sent to the server or in a
// Referer); strip it from the address bar once read
const token = new URLSearchParams(route.hash.slice(1)).get("token") ?? "";
const state = ref<"loading" | "invalid" | "ready">("loading");
const email = ref("");

const username = ref("");
const displayName = ref("");
const password = ref("");
const confirm = ref("");
const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
const zones = Intl.supportedValuesOf("timeZone");
const color = ref(ACCENT_SWATCHES[0].hex);

const turnstileToken = ref<string | undefined>(undefined);
const turnstile = ref<InstanceType<typeof TurnstileWidget>>();
const needsToken = computed(() => !!turnstileSiteKey && !turnstileToken.value);
const submitting = ref(false);
const error = ref("");

onMounted(async () => {
  history.replaceState(history.state, "", route.path);
  if (!token) return (state.value = "invalid");
  try {
    email.value = await auth.lookupInvite(token);
    state.value = "ready";
  } catch {
    state.value = "invalid";
  }
});

const pickColor = (hex: string) => {
  color.value = hex;
  applyAccent(hex); // preview
};

const handleSignup = async () => {
  error.value = "";
  if (password.value.length < 12 || password.value.length > 128) {
    error.value = "Password must be 12-128 characters.";
    return;
  }
  if (password.value !== confirm.value) {
    error.value = "Passwords do not match.";
    return;
  }
  submitting.value = true;
  try {
    await auth.signup({
      token,
      username: username.value.trim().toLowerCase(),
      display_name: displayName.value.trim(),
      password: password.value,
      timezone: timezone.value,
      primary_color: color.value,
      turnstile_token: turnstileToken.value,
    });
    store.$patch({ user: mapUser(auth.me!), status: "success" });
    router.replace({ name: "No-Chat" });
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === "conflict"
        ? "That username is taken."
        : e instanceof ApiError && e.code === "not_found"
          ? "This invite is no longer valid."
          : e instanceof ApiError && e.code === "captcha_failed"
            ? "Verification failed. Please try again."
            : e instanceof ApiError && e.code === "validation"
              ? e.message
              : "Something went wrong. Please try again.";
    if (e instanceof ApiError && e.code === "not_found")
      state.value = "invalid";
  } finally {
    submitting.value = false;
    turnstile.value?.reset(); // tokens are single-use
  }
};
</script>

<template>
  <div
    class="p-5 md:basis-1/2 xs:basis-full flex flex-col justify-center items-center overflow-y-auto"
  >
    <div class="w-full max-w-md">
      <div class="mb-6 flex flex-col">
        <Wordmark size="lg" class="mb-4" />
        <template v-if="state === 'invalid'">
          <p class="heading-2 text-fg mb-4">Invite not valid</p>
          <p class="body-3 text-muted font-light">
            This invite link is invalid or has expired. Ask an administrator for
            a new one.
          </p>
        </template>
        <template v-else>
          <p class="heading-2 text-fg mb-4">Create your account</p>
          <p class="body-3 text-muted font-light">
            You were invited to join. Choose how you'll appear to others.
          </p>
        </template>
      </div>

      <form
        v-if="state === 'ready'"
        class="mb-6"
        @submit.prevent="handleSignup"
      >
        <p class="body-2 text-muted mb-3">Email</p>
        <p class="body-2 text-fg mb-5" data-testid="invite-email">
          {{ email }}
        </p>
        <LabeledTextInput
          :value="username"
          label="Username"
          name="username"
          placeholder="lowercase letters, digits, . _ -"
          class="mb-5"
          @value-changed="(v) => (username = v)"
        />
        <LabeledTextInput
          :value="displayName"
          label="Display name"
          name="name"
          placeholder="How others see you"
          class="mb-5"
          @value-changed="(v) => (displayName = v)"
        />
        <PasswordInput
          :value="password"
          label="Password (12+ characters)"
          placeholder="Choose a password"
          class="mb-5"
          @value-changed="(v) => (password = v)"
        />
        <PasswordInput
          :value="confirm"
          label="Confirm password"
          placeholder="Repeat the password"
          class="mb-5"
          @value-changed="(v) => (confirm = v)"
        />

        <label for="signup-timezone" class="body-2 text-muted mb-3 block">
          Timezone
        </label>
        <select
          id="signup-timezone"
          v-model="timezone"
          class="w-full mb-5 px-2 py-2 rounded border border-hairline bg-surface text-fg body-2"
        >
          <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
        </select>

        <p class="body-2 text-muted mb-3">Accent color</p>
        <div class="flex flex-wrap gap-3 mb-5">
          <button
            v-for="swatch in ACCENT_SWATCHES"
            :key="swatch.hex"
            type="button"
            class="h-9 w-9 rounded-full border-2"
            :class="color === swatch.hex ? 'border-fg' : 'border-transparent'"
            :style="{ backgroundColor: swatch.hex }"
            :aria-pressed="color === swatch.hex"
            :aria-label="`Accent color ${swatch.name}`"
            :title="swatch.name"
            @click="pickColor(swatch.hex)"
          />
        </div>

        <TurnstileWidget
          v-if="turnstileSiteKey"
          ref="turnstile"
          :site-key="turnstileSiteKey"
          @token="(t) => (turnstileToken = t)"
          @expired="turnstileToken = undefined"
        />

        <p v-if="error" role="alert" class="body-3 text-error mt-4">
          {{ error }}
        </p>

        <div class="mb-6 mt-6">
          <Button
            class="contained-primary contained-text w-full disabled:opacity-50"
            type="submit"
            :loading="submitting"
            :disabled="needsToken"
          >
            Create account
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
