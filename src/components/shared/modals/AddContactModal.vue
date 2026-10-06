<script setup lang="ts">
import type { Ref } from "vue";
import { ref, watch } from "vue";

import useStore from "@src/store/store";
import useContactsStore from "@src/store/contacts";

import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import Modal from "@src/components/ui/utils/Modal.vue";

const props = defineProps<{
  openModal: boolean;
  closeModal: () => void;
}>();

const store = useStore();
const contacts = useContactsStore();

const query = ref("");
const error = ref("");
const busy = ref(false);

// search as the user types (username substring)
watch(query, async (q) => {
  error.value = "";
  try {
    await contacts.searchUsers(q);
  } catch {
    contacts.searchResults = [];
  }
});

// (event) add the first matching contact
const handleAdd = async (userId: string) => {
  busy.value = true;
  error.value = "";
  try {
    await contacts.addContact(userId);
    query.value = "";
    props.closeModal();
  } catch (e) {
    error.value =
      e && typeof e === "object" && "code" in e
        ? "Couldn't add this contact."
        : "Couldn't add this contact.";
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <Modal :open="props.openModal" :close-modal="props.closeModal">
    <template #content>
      <div class="w-75 bg-white dark:bg-gray-800 rounded py-6">
        <!--modal header-->
        <div class="flex justify-between items-center px-5">
          <p
            id="modal-title"
            class="heading-1 text-black/70 dark:text-white/70"
            tabindex="0"
          >
            Add Contact
          </p>

          <Button
            class="outlined-danger ghost-text py-2 px-4"
            @click="props.closeModal"
          >
            esc
          </Button>
        </div>

        <!--text input-->
        <div class="px-5 pb-5 pt-6">
          <LabeledTextInput
            :value="query"
            label="Username"
            type="text"
            placeholder="Search by username"
            @value-changed="
              (value) => {
                query = value;
              }
            "
          />
        </div>

        <!--search results-->
        <div class="px-5 pb-5">
          <button
            v-for="user in contacts.searchResults"
            :key="user.id"
            class="w-full flex items-center px-3 py-2 mb-2 rounded hover:bg-indigo-50 dark:hover:bg-gray-600"
            role="listitem"
            :disabled="busy"
            @click="handleAdd(user.id)"
          >
            <div
              :style="{ backgroundImage: `url(${user.avatar_url ?? ''})` }"
              class="w-7 h-7 mr-3 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-600"
            ></div>
            <div class="text-left">
              <p class="body-2 text-black/85 dark:text-white/85">
                {{ user.display_name }}
              </p>
              <p class="body-3 text-black/60 dark:text-white/60">
                @{{ user.username }}
              </p>
            </div>
          </button>

          <p
            v-if="contacts.searchResults.length === 0"
            class="body-3 text-black/60 dark:text-white/60"
          >
            {{ query ? "No users found" : "Type a username to search" }}
          </p>

          <p v-if="error" role="alert" class="body-3 text-red-400 mt-2">
            {{ error }}
          </p>

          <p
            v-if="store.user && store.user.contacts.length > 0"
            class="body-3 text-black/60 dark:text-white/60 mt-3"
          >
            {{ store.user.contacts.length }} contact(s) already added
          </p>
        </div>
      </div>
    </template>
  </Modal>
</template>
