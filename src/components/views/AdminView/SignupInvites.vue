<script setup lang="ts">
import { onMounted, ref } from "vue";

import { ApiError } from "@src/api/client";
import useSignupInvitesStore from "@src/store/signupInvites";

import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";

const invites = useSignupInvitesStore();
const email = ref("");
const busy = ref(false);
const error = ref("");
const loadFailed = ref(false);

onMounted(() => invites.load().catch(() => (loadFailed.value = true)));

// run an action, surfacing the server's message (409 existing account,
// 502 mail_failed, ...) instead of failing silently
const run = async (fn: () => Promise<void>) => {
  error.value = "";
  busy.value = true;
  try {
    await fn();
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === "mail_failed"
        ? "Saved, but the email could not be sent. Use Resend to retry."
        : e instanceof ApiError && e.code === "conflict"
          ? "That email already has an account."
          : e instanceof ApiError && e.code === "validation"
            ? e.message
            : "Something went wrong. Please try again.";
  } finally {
    busy.value = false;
  }
};

const send = () =>
  run(async () => {
    await invites.invite(email.value.trim());
    email.value = "";
  });

const fmt = (iso: string) => new Date(iso).toLocaleString();
</script>

<template>
  <section class="max-w-3xl">
    <p class="heading-2 text-fg mb-2">Signup invites</p>
    <p class="body-3 text-muted mb-6">
      Email someone a one-time link (valid 7 days) to create their account.
    </p>

    <p v-if="loadFailed" role="alert" class="body-3 text-error">
      Could not load invites.
    </p>
    <p v-else-if="!invites.enabled" class="body-3 text-muted">
      Email is not configured yet. Choose a provider under Email provider in the
      Admin menu.
    </p>
    <template v-else>
      <form class="flex items-end gap-3 mb-4" @submit.prevent="send">
        <div class="grow">
          <!-- type=text + ignore hints: password managers (Bitwarden, LastPass, 1Password) must not fill an invitee's address with the admin's own -->
          <LabeledTextInput
            :value="email"
            label="Invite by email"
            name="invitee-address"
            placeholder="person@example.com"
            class="h-16! text-xl!"
            :input-attrs="{
              inputmode: 'email',
              autocomplete: 'off',
              autocapitalize: 'off',
              spellcheck: 'false',
              'data-bwignore': 'true',
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
              'data-form-type': 'other',
            }"
            @value-changed="(v) => (email = v)"
          />
        </div>
        <Button
          class="contained-primary contained-text disabled:opacity-50"
          type="submit"
          :loading="busy"
          :disabled="!email.trim()"
        >
          Send invite
        </Button>
      </form>
      <p v-if="error" role="alert" class="body-3 text-error mb-4">
        {{ error }}
      </p>

      <table class="w-full body-2 text-fg">
        <thead class="text-muted text-left">
          <tr>
            <th class="py-2">Email</th>
            <th>Status</th>
            <th>Sent</th>
            <th>Expires</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="i in invites.invites"
            :key="i.id"
            class="border-t border-hairline"
          >
            <td class="py-2">{{ i.email }}</td>
            <td>{{ i.status }}</td>
            <td>{{ fmt(i.last_sent_at) }}</td>
            <td>{{ fmt(i.expires_at) }}</td>
            <td class="text-right whitespace-nowrap">
              <template v-if="i.status === 'open' || i.status === 'expired'">
                <button
                  type="button"
                  class="underline mr-3"
                  :disabled="busy"
                  @click="run(() => invites.resend(i.id))"
                >
                  Resend
                </button>
                <button
                  type="button"
                  class="underline"
                  :disabled="busy"
                  @click="run(() => invites.revoke(i.id))"
                >
                  Revoke
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!invites.invites.length" class="body-3 text-muted mt-4">
        No invites yet.
      </p>
    </template>
  </section>
</template>
