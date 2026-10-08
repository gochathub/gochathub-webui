<script setup lang="ts">
import type { IContactGroup } from "@src/types";
import type { Ref } from "vue";
import { computed, ref } from "vue";

import useStore from "@src/store/store";
import useContactsStore from "@src/store/contacts";

import AddContactModal from "@src/components/shared/modals/AddContactModal.vue";
import NoContacts from "@src/components/states/empty-states/NoContacts.vue";
import MultipleLines from "@src/components/states/loading-states/MultipleLines.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";
import SortedContacts from "@src/components/views/HomeView/Sidebar/Contacts/SortedContacts.vue";
import SidebarHeader from "@src/components/views/HomeView/Sidebar/SidebarHeader.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import { UserPlusIcon } from "@heroicons/vue/24/outline";

const store = useStore();
const contactsStore = useContactsStore();

const searchText: Ref<string> = ref("");

const openModal = ref(false);

// html element containing the contact groups
const contactContainer: Ref<HTMLElement | null> = ref(null);

// contact groups filtered by search text
const filteredContactGroups = computed(() =>
  store.contactGroups
    ?.map((group) => {
      const newGroup = { ...group };

      newGroup.contacts = newGroup.contacts.filter((contact) => {
        if (
          contact.firstName
            .toLowerCase()
            .includes(searchText.value.toLowerCase())
        )
          return true;
        else if (
          contact.lastName
            .toLowerCase()
            .includes(searchText.value.toLowerCase())
        )
          return true;
      });

      return newGroup;
    })
    .filter((group) => group.contacts.length > 0),
);

// load the contact list from the server
contactsStore.loadContacts();
</script>

<template>
  <div>
    <SidebarHeader>
      <!--title-->
      <template #title>Contacts</template>

      <!--side actions-->
      <template #actions>
        <HelpLink to="/help/rooms#add-a-contact" label="adding contacts" />
        <IconButton
          class="ic-btn-ghost-primary w-7 h-7"
          title="add contacts"
          aria-label="add contacts"
          @click="openModal = true"
        >
          <UserPlusIcon class="w-[1.25rem] h-[1.25rem]" />
        </IconButton>
      </template>
    </SidebarHeader>

    <!--search-->
    <div class="px-5 xs:pb-6 md:pb-5">
      <SearchInput v-model="searchText" />
    </div>

    <!--content-->
    <div
      ref="contactContainer"
      class="w-full h-full scroll-smooth scrollbar-thin"
      style="overflow-x: visible; overflow-y: scroll"
    >
      <template v-if="store.status === 'loading' || store.delayLoading">
        <MultipleLines v-for="_idx in 5" :key="_idx" />
      </template>

      <SortedContacts
        v-else-if="
          store.status === 'success' &&
          !store.delayLoading &&
          store.user &&
          store.user.contacts.length > 0
        "
        :contact-groups="filteredContactGroups"
        :bottom-edge="
          (contactContainer as HTMLElement)?.getBoundingClientRect().bottom
        "
      />

      <NoContacts v-else />
    </div>

    <!--add contact modal-->
    <AddContactModal
      :open-modal="openModal"
      :close-modal="() => (openModal = false)"
    />
  </div>
</template>
