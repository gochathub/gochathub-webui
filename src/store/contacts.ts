// Contacts: GET/POST/DELETE /contacts + user search. The sidebar and direct
// rooms render from store.user.contacts.
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { unwrap } from "@src/api/client";
import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import { mapContact } from "@src/api/mappers";
import type { components } from "@src/api/schema";

export const useContactsStore = defineStore("contacts", () => {
  const chat = useStore();
  const auth = useAuthStore();

  const searchResults = ref<components["schemas"]["User"][]>([]);

  async function loadContacts() {
    if (!auth.me) return;
    const contacts = await unwrap(await client.GET("/contacts"));
    chat.user = chat.user
      ? {
          ...chat.user,
          contacts: contacts.map((c) =>
            mapContact(c.user, c.user.last_seen_at ?? null),
          ),
        }
      : chat.user;
  }

  async function searchUsers(q: string) {
    if (!q) {
      searchResults.value = [];
      return;
    }
    const users = await unwrap(
      await client.GET("/users/search", { params: { query: { q } } }),
    );
    searchResults.value = users;
  }

  async function addContact(userId: string) {
    await unwrap(await client.POST("/contacts", { body: { user_id: userId } }));
    await loadContacts();
    searchResults.value = [];
  }

  // Contact.id is the contact user's id server-side.
  async function removeContact(contactUserId: string) {
    await unwrap(
      await client.DELETE("/contacts/{contactId}", {
        params: { path: { contactId: contactUserId } },
      }),
    );
    if (chat.user) {
      chat.user.contacts = chat.user.contacts.filter(
        (c) => c.id !== contactUserId,
      );
    }
  }

  return {
    searchResults,
    loadContacts,
    searchUsers,
    addContact,
    removeContact,
  };
});

export default useContactsStore;
