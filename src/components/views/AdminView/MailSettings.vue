<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { ApiError } from "@src/api/client";
import useMailSettingsStore from "@src/store/mailSettings";

import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";

const mail = useMailSettingsStore();

const selected = ref("");
// field name -> typed value for the selected provider (secrets start blank)
const form = ref<Record<string, string>>({});
const testTo = ref("");

const busy = ref(false);
const error = ref("");
const notice = ref("");
const loadFailed = ref(false);

const provider = computed(() =>
  mail.settings?.providers.find((p) => p.id === selected.value),
);
const isActive = computed(() => mail.settings?.active === selected.value);

const fill = () => {
  form.value = {};
  for (const f of provider.value?.fields ?? [])
    form.value[f.name] = f.secret ? "" : (provider.value!.values[f.name] ?? "");
};
watch(selected, () => {
  error.value = notice.value = "";
  fill();
});

onMounted(async () => {
  try {
    await mail.load();
    // start on the active provider, else the first
    selected.value =
      mail.settings!.active || (mail.settings!.providers[0]?.id ?? "");
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

const save = (activate: boolean) =>
  run(
    async () => {
      await mail.save(selected.value, form.value, activate);
      fill();
    },
    activate ? "Saved and activated." : "Saved.",
  );
const deactivate = () => run(() => mail.setActive(""), "Mail is off.");
const activate = () =>
  run(() => mail.setActive(selected.value), "Provider activated.");
const wipe = () =>
  run(async () => {
    await mail.clear(selected.value);
    fill();
  }, "Credentials removed.");
const test = () =>
  run(() => mail.sendTest(testTo.value.trim()), "Test message sent.");

const label = (id: string) =>
  mail.settings?.providers.find((p) => p.id === id)?.label ?? id;
</script>

<template>
  <section class="max-w-xl">
    <p class="heading-2 text-fg mb-2">Email provider</p>
    <p class="body-3 text-muted mb-6">
      Outgoing mail for signup invites. Each provider keeps its own saved
      credentials; only the active one is used.
    </p>

    <p v-if="loadFailed" role="alert" class="body-3 text-error">
      Could not load mail settings.
    </p>
    <p
      v-else-if="mail.settings && !mail.settings.encryption_available"
      class="body-3 text-error"
    >
      The server has no SECRETS_KEY, so credentials cannot be stored. Set
      SECRETS_KEY in the server environment and restart.
    </p>
    <template v-else-if="mail.settings && provider">
      <p class="body-3 text-muted mb-4" data-testid="active-provider">
        Active:
        <span class="text-fg">{{
          mail.settings.active ? label(mail.settings.active) : "none (mail off)"
        }}</span>
      </p>

      <label for="mail-provider" class="body-2 text-muted mb-3 block">
        Provider
      </label>
      <select
        id="mail-provider"
        v-model="selected"
        class="w-full mb-6 px-2 py-2 rounded border border-hairline bg-surface text-fg body-2"
      >
        <option v-for="p in mail.settings.providers" :key="p.id" :value="p.id">
          {{ p.label }}{{ p.id === mail.settings.active ? " (active)" : ""
          }}{{
            p.configured && p.id !== mail.settings.active ? " (saved)" : ""
          }}
        </option>
      </select>

      <form @submit.prevent="save(false)">
        <template v-for="f in provider.fields" :key="provider.id + f.name">
          <label
            v-if="f.options?.length"
            :for="'mail-' + f.name"
            class="body-2 text-muted mb-3 block"
          >
            {{ f.label }}
          </label>
          <select
            v-if="f.options?.length"
            :id="'mail-' + f.name"
            v-model="form[f.name]"
            class="w-full mb-5 px-2 py-2 rounded border border-hairline bg-surface text-fg body-2"
          >
            <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
          </select>
          <PasswordInput
            v-else-if="f.secret"
            :value="form[f.name]"
            :label="
              f.label +
              (provider.has_secret[f.name]
                ? ' (saved — leave blank to keep)'
                : '')
            "
            placeholder="••••••••"
            class="mb-5"
            @value-changed="(v) => (form[f.name] = v)"
          />
          <LabeledTextInput
            v-else
            :value="form[f.name]"
            :label="f.label + (f.required ? '' : ' (optional)')"
            :name="'mail-' + f.name"
            :placeholder="f.help"
            class="mb-5"
            @value-changed="(v) => (form[f.name] = v)"
          />
        </template>

        <p v-if="error" role="alert" class="body-3 text-error mb-4">
          {{ error }}
        </p>
        <p v-if="notice" role="status" class="body-3 text-muted mb-4">
          {{ notice }}
        </p>

        <div class="flex flex-wrap gap-3 mb-8">
          <Button
            class="contained-primary contained-text"
            type="submit"
            :loading="busy"
          >
            Save
          </Button>
          <Button
            v-if="!isActive"
            class="contained-primary contained-text"
            type="button"
            :loading="busy"
            @click="save(true)"
          >
            Save &amp; make active
          </Button>
          <Button
            v-if="!isActive && provider.configured"
            class="contained-primary contained-text"
            type="button"
            :loading="busy"
            @click="activate"
          >
            Make active
          </Button>
          <Button
            v-if="mail.settings.active"
            class="contained-primary contained-text"
            type="button"
            :loading="busy"
            @click="deactivate"
          >
            Turn mail off
          </Button>
          <button
            v-if="provider.configured"
            type="button"
            class="body-3 underline text-muted"
            :disabled="busy"
            @click="wipe"
          >
            Remove saved credentials
          </button>
        </div>
      </form>

      <form
        v-if="mail.settings.active"
        class="flex items-end gap-3"
        @submit.prevent="test"
      >
        <div class="grow">
          <!-- type=text + ignore hints: password managers must not fill the admin's own address -->
          <LabeledTextInput
            :value="testTo"
            :label="`Send a test message via ${label(mail.settings.active)} to`"
            name="test-target"
            placeholder="Recipient"
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
            @value-changed="(v) => (testTo = v)"
          />
        </div>
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
