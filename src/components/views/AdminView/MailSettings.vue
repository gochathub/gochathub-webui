<script setup lang="ts">
import { onMounted, ref } from "vue";

import { ApiError } from "@src/api/client";
import useMailSettingsStore from "@src/store/mailSettings";

import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";

const mail = useMailSettingsStore();

const host = ref("");
const port = ref("587");
const user = ref("");
const password = ref("");
const tls = ref<"starttls" | "implicit" | "none">("starttls");
const from = ref("");
const testTo = ref("");

const busy = ref(false);
const error = ref("");
const notice = ref("");
const loadFailed = ref(false);

const fill = () => {
  const s = mail.settings;
  if (!s) return;
  host.value = s.host;
  port.value = s.port || "587";
  user.value = s.user;
  tls.value = (s.tls || "starttls") as typeof tls.value;
  from.value = s.from;
  password.value = "";
};

onMounted(async () => {
  try {
    await mail.load();
    fill();
  } catch {
    loadFailed.value = true;
  }
});

const run = async (fn: () => Promise<void>, done: string) => {
  error.value = notice.value = "";
  busy.value = true;
  try {
    await fn();
    notice.value = done;
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === "validation"
        ? e.message
        : "Something went wrong. Please try again.";
  } finally {
    busy.value = false;
  }
};

// blank password keeps the stored one (omit the field)
const save = () =>
  run(async () => {
    await mail.save({
      host: host.value.trim(),
      port: port.value.trim(),
      user: user.value.trim(),
      password: password.value ? password.value : undefined,
      tls: tls.value,
      from: from.value.trim(),
    });
    fill();
  }, "Saved.");

const test = () =>
  run(() => mail.sendTest(testTo.value.trim()), "Test message sent.");
</script>

<template>
  <section class="max-w-xl">
    <p class="heading-2 text-fg mb-2">Email (SMTP)</p>
    <p class="body-3 text-muted mb-6">
      Outgoing mail for signup invites. Leave the host empty and save to turn
      invites off.
    </p>

    <p v-if="loadFailed" role="alert" class="body-3 text-error">
      Could not load mail settings.
    </p>
    <p
      v-else-if="mail.settings && !mail.settings.encryption_available"
      class="body-3 text-error"
    >
      The server has no SECRETS_KEY, so the SMTP password cannot be stored. Set
      SECRETS_KEY in the server environment and restart.
    </p>
    <template v-else-if="mail.settings">
      <form @submit.prevent="save">
        <LabeledTextInput
          :value="host"
          label="Host"
          name="host"
          placeholder="smtp.example.com"
          class="mb-5"
          @value-changed="(v) => (host = v)"
        />
        <LabeledTextInput
          :value="port"
          label="Port"
          name="port"
          class="mb-5"
          @value-changed="(v) => (port = v)"
        />
        <label for="smtp-tls" class="body-2 text-muted mb-3 block">
          Encryption
        </label>
        <select
          id="smtp-tls"
          v-model="tls"
          class="w-full mb-5 px-2 py-2 rounded border border-hairline bg-surface text-fg body-2"
        >
          <option value="starttls">STARTTLS (port 587)</option>
          <option value="implicit">TLS (port 465)</option>
          <option value="none">None (no login allowed)</option>
        </select>
        <LabeledTextInput
          :value="user"
          label="Username (optional)"
          name="smtp-user"
          class="mb-5"
          @value-changed="(v) => (user = v)"
        />
        <PasswordInput
          :value="password"
          :label="
            mail.settings.has_password
              ? 'Password (leave blank to keep the saved one)'
              : 'Password'
          "
          placeholder="••••••••"
          class="mb-5"
          @value-changed="(v) => (password = v)"
        />
        <LabeledTextInput
          :value="from"
          label="From address"
          name="from"
          placeholder="goChatHub <chat@example.com>"
          class="mb-5"
          @value-changed="(v) => (from = v)"
        />

        <p v-if="error" role="alert" class="body-3 text-error mb-4">
          {{ error }}
        </p>
        <p v-if="notice" role="status" class="body-3 text-muted mb-4">
          {{ notice }}
        </p>

        <Button
          class="contained-primary contained-text mb-8"
          type="submit"
          :loading="busy"
        >
          Save
        </Button>
      </form>

      <form
        v-if="mail.settings.configured"
        class="flex items-end gap-3"
        @submit.prevent="test"
      >
        <LabeledTextInput
          :value="testTo"
          label="Send a test message to"
          type="email"
          name="test-to"
          placeholder="you@example.com"
          class="grow"
          @value-changed="(v) => (testTo = v)"
        />
        <Button
          class="contained-primary contained-text disabled:opacity-50"
          type="submit"
          :loading="busy"
          :disabled="!testTo.trim()"
        >
          Send test
        </Button>
      </form>
    </template>
  </section>
</template>
