<script setup lang="ts">
import type { Ref } from "vue";

import { ref } from "vue";
import { useRouter } from "vue-router";

import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import client, { unwrap } from "@src/api/client";

import AccordionButton from "@src/components/ui/data-display/AccordionButton.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";
import Collapse from "@src/components/ui/utils/Collapse.vue";
import TwoFactorSettings from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/TwoFactorSettings.vue";
import MobileSignInSettings from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/MobileSignInSettings.vue";

// Types
interface AccountValues {
  displayName: string | undefined;
}

// Variables
const props = defineProps<{
  collapsed: boolean;
  handleToggle: () => void;
}>();

const store = useStore();
const auth = useAuthStore();
const router = useRouter();

// display name = firstName + optional lastName split across the two inputs
const accountValues: Ref<AccountValues> = ref({
  displayName: store.user?.firstName
    ? [store.user.firstName, store.user.lastName].filter(Boolean).join(" ")
    : undefined,
});

const loading = ref(false);

// (event) save the display name (server field, PATCH /users/me)
const handleSubmit = async () => {
  const name = (accountValues.value.displayName ?? "").trim();
  if (!name) return;
  loading.value = true;
  try {
    await unwrap(
      await client.PATCH("/users/me", { body: { display_name: name } }),
    );
    if (auth.me) auth.me = { ...auth.me, display_name: name };
    store.user = store.user ? { ...store.user, firstName: name } : store.user;
  } finally {
    loading.value = false;
  }
};

// --- change password -----------------------------------------------------

const oldPassword = ref("");
const newPassword = ref("");
const pwBusy = ref(false);
const pwError = ref("");

// (event) change password → server revokes ALL sessions → forced relogin
const handleChangePassword = async () => {
  pwError.value = "";
  if (!oldPassword.value || !newPassword.value) {
    pwError.value = "Fill in both password fields.";
    return;
  }
  pwBusy.value = true;
  try {
    await unwrap(
      await client.PATCH("/users/me/password", {
        body: {
          old_password: oldPassword.value,
          new_password: newPassword.value,
        },
      }),
    );
    // session revoked server-side; route the user back to login
    auth.me = undefined;
    auth.bootstrapped = false;
    store.status = "idle";
    router.push({ name: "Access", params: { method: "sign-in" } });
  } catch {
    pwError.value = "Wrong current password or new password too short.";
  } finally {
    pwBusy.value = false;
  }
};
</script>

<template>
  <!--account settings-->
  <AccordionButton
    id="account-settings-toggler"
    class="w-full flex px-5 py-6 mb-3 rounded focus:outline-none"
    :collapsed="props.collapsed"
    chevron
    aria-controls="account-settings-collapse"
    @click="handleToggle()"
  >
    <p class="heading-2 text-fg mb-4">Account</p>
    <p class="body-2 text-muted">Update your profile details</p>
  </AccordionButton>

  <Collapse id="account-settings-collapse" :collapsed="props.collapsed">
    <LabeledTextInput
      label="Display name"
      class="mb-5"
      :value="accountValues?.displayName"
      @value-changed="(value) => (accountValues.displayName = value)"
    />
    <Button
      class="contained-primary contained-text w-full py-4 mb-8"
      :loading="loading"
      @click="handleSubmit"
    >
      Save Settings
    </Button>

    <!--change password-->
    <div class="flex items-start gap-1 mb-4">
      <p class="heading-2 text-fg">Change password</p>
      <HelpLink
        to="/help/account-security#change-your-password"
        label="changing your password"
      />
    </div>
    <PasswordInput
      label="Current password"
      class="mb-5"
      :value="oldPassword"
      @value-changed="(value) => (oldPassword = value)"
    />
    <PasswordInput
      label="New password"
      class="mb-5"
      :value="newPassword"
      @value-changed="(value) => (newPassword = value)"
    />
    <p v-if="pwError" role="alert" class="body-3 text-error mb-4">
      {{ pwError }}
    </p>
    <Button
      class="contained-primary contained-text w-full py-4 mb-8"
      :loading="pwBusy"
      @click="handleChangePassword"
    >
      Update password
    </Button>

    <TwoFactorSettings />
    <MobileSignInSettings />
  </Collapse>
</template>
