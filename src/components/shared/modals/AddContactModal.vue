<script setup lang="ts">
import Avatar from "@src/components/ui/data-display/Avatar.vue";
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
      <div class="w-full max-w-[26rem] bg-canvas rounded py-6">
        <!--modal header-->
        <div class="flex justify-between items-center px-5">
          <p id="modal-title" class="heading-1 text-fg" tabindex="0">
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
            class="w-full flex items-center px-3 py-2 mb-2 rounded hover:bg-select/50"
            role="listitem"
            :disabled="busy"
            @click="handleAdd(user.id)"
          >
            <Avatar
              :src="user.avatar_url"
              :name="user.display_name"
              class="w-7 h-7 mr-3"
            />
            <div class="text-left min-w-0">
              <p class="body-2 text-fg truncate">{{ user.display_name }}</p>
              <p class="body-3 text-muted truncate">@{{ user.username }}</p>
            </div>
          </button>

          <p
            v-if="contacts.searchResults.length === 0"
            class="body-3 text-muted"
          >
            {{ query ? "No users found" : "Type a username to search" }}
          </p>

          <p v-if="error" role="alert" class="body-3 text-error mt-2">
            {{ error }}
          </p>

          <p
            v-if="store.user && store.user.contacts.length > 0"
            class="body-3 text-muted mt-3"
          >
            {{ store.user.contacts.length }} contact(s) already added
          </p>
        </div>
      </div>
    </template>
  </Modal>
</template>
