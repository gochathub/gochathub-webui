<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import { ApiError } from "@src/api/client";
import { mapUser } from "@src/api/mappers";

import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";
import Wordmark from "@src/components/ui/brand/Wordmark.vue";

const router = useRouter();
const store = useStore();
const auth = useAuthStore();

const username = ref("");
const password = ref("");
const submitting = ref(false);
const error = ref("");

// (event) log in with the httpOnly session cookie; on failure surface the
// server's stable code so the UI can branch later.
const handleLogin = async () => {
  error.value = "";
  submitting.value = true;

  try {
    await auth.login(username.value, password.value);
    store.$patch({ user: mapUser(auth.me!), status: "success" });
    router.push({ name: "No-Chat" });
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === "unauthorized"
        ? "Wrong username or password."
        : "Something went wrong. Please try again.";
  } finally {
    submitting.value = false;
  }
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

        <p v-if="error" role="alert" class="body-3 text-error mt-4">
          {{ error }}
        </p>

        <!--local controls-->
        <div class="mb-6 mt-6">
          <Button
            class="contained-primary contained-text w-full mb-4"
            type="submit"
            :loading="submitting"
          >
            Sign in
          </Button>
        </div>
      </form>

      <p class="body-3 text-muted text-center">
        Need an account? Ask your administrator — accounts are created via the
        server CLI.
      </p>
    </div>
  </div>
</template>
