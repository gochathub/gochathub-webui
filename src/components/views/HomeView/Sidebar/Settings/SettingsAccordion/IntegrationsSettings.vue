<script setup lang="ts">
import { onMounted, ref } from "vue";

import useIntegrationsStore from "@src/store/integrations";
import { ApiError } from "@src/api/client";

import AccordionButton from "@src/components/ui/data-display/AccordionButton.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import Collapse from "@src/components/ui/utils/Collapse.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";

const props = defineProps<{
  collapsed: boolean;
  handleToggle: () => void;
}>();

const integrations = useIntegrationsStore();

const baseUrl = ref("");
const rcUserId = ref("");
const token = ref("");
const busy = ref(false);
const error = ref("");

const run = async (fn: () => Promise<void>, fallback: string) => {
  error.value = "";
  busy.value = true;
  try {
    await fn();
  } catch (e) {
    // validation errors carry a user-meaningful message (bad URL, bad token)
    error.value =
      e instanceof ApiError && e.status === 400 ? e.message : fallback;
  } finally {
    busy.value = false;
  }
};

// (event) link the account; the token is cleared from memory right after
const handleConnect = () => {
  if (!baseUrl.value.trim() || !rcUserId.value.trim() || !token.value.trim()) {
    error.value = "Fill in the server, your user ID and the access token.";
    return;
  }
  return run(async () => {
    await integrations.connect(baseUrl.value, rcUserId.value, token.value);
    token.value = "";
  }, "Could not reach Rocket.Chat with those details. Check the server address, user ID and token.");
};

// (event) unlink: token deleted, mirrored rooms hidden
const handleDisconnect = () =>
  run(
    () => integrations.disconnect(),
    "Could not unlink right now. Please try again.",
  );

onMounted(() => run(() => integrations.load(), ""));
</script>

<template>
  <template v-if="integrations.available">
    <!--integrations settings-->
    <AccordionButton
      id="integrations-settings-toggler"
      class="w-full flex px-5 py-6 mb-3 rounded focus:outline-none"
      :collapsed="props.collapsed"
      chevron
      aria-controls="integrations-settings-collapse"
      @click="props.handleToggle()"
    >
      <p class="heading-2 text-fg mb-4">Rocket.Chat</p>
      <p class="body-2 text-muted">
        Show your Rocket.Chat direct messages and private groups here
      </p>
    </AccordionButton>

    <Collapse id="integrations-settings-collapse" :collapsed="props.collapsed">
      <template v-if="integrations.link.linked">
        <p class="body-3 text-fg mb-2">
          Linked to
          <span class="break-all">{{ integrations.link.base_url }}</span>
          as
          <span class="break-all">{{
            integrations.link.rc_username || integrations.link.rc_user_id
          }}</span
          >.
        </p>
        <p class="body-3 text-muted mb-4">
          Your direct messages and private groups sync every few seconds and are
          visible only to you. You can read and reply with text; files, threads
          and reactions stay in Rocket.Chat. Unlinking deletes your token and
          hides these conversations; linking again brings them back.
        </p>
        <p v-if="error" role="alert" class="body-3 text-error mb-4">
          {{ error }}
        </p>
        <Button
          class="contained-primary contained-text w-full py-4 mb-8"
          :loading="busy"
          @click="handleDisconnect"
        >
          Unlink Rocket.Chat
        </Button>
      </template>

      <template v-else>
        <p class="body-3 text-muted mb-4">
          Create a Personal Access Token in Rocket.Chat (Profile &rarr; Personal
          Access Tokens) and paste it here with the server address and your user
          ID. The token is stored encrypted and never shown again.
        </p>
        <LabeledTextInput
          label="Server address"
          class="mb-5"
          placeholder="https://chat.example.com"
          :value="baseUrl"
          @value-changed="(value: string) => (baseUrl = value)"
        />
        <LabeledTextInput
          label="User ID"
          class="mb-5"
          :value="rcUserId"
          @value-changed="(value) => (rcUserId = value)"
        />
        <PasswordInput
          label="Personal access token"
          class="mb-5"
          :value="token"
          @value-changed="(value) => (token = value)"
        />
        <p v-if="error" role="alert" class="body-3 text-error mb-4">
          {{ error }}
        </p>
        <Button
          class="contained-primary contained-text w-full py-4 mb-8"
          :loading="busy"
          @click="handleConnect"
        >
          Link Rocket.Chat
        </Button>
      </template>
    </Collapse>
  </template>
</template>
