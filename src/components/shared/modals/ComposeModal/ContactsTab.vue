<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import useStore from "@src/store/store";
import useRoomsStore from "@src/store/rooms";
import type { IContact } from "@src/types";

import NoContacts from "@src/components/states/empty-states/NoContacts.vue";
import AddContactModal from "@src/components/shared/modals/AddContactModal.vue";
import Circle2Lines from "@src/components/states/loading-states/Circle2Lines.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";
import ContactItem from "@src/components/shared/blocks/ContactItem.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import ScrollBox from "@src/components/ui/utils/ScrollBox.vue";

const props = defineProps<{
  closeModal: () => void;
}>();

const store = useStore();
const rooms = useRoomsStore();
const router = useRouter();

const addOpen = ref(false);

// (event) click a contact → open (or create) a direct room → close modal
const handleContactClick = async (contact: IContact) => {
  const roomId = await rooms.createRoom("direct", [contact.id]);
  props.closeModal();
  await router.push({ path: `/chat/${roomId}/` });
};
</script>

<template>
  <div class="pb-6">
    <!--search-->
    <div class="mx-5 mb-5">
      <SearchInput />
    </div>

    <!--contacts-->
    <ScrollBox class="overflow-y-scroll max-h-50">
      <template v-if="store.status === 'loading' || store.delayLoading">
        <Circle2Lines v-for="_idx in 3" :key="_idx" />
      </template>

      <ContactItem
        v-for="(contact, index) in store.user.contacts"
        v-else-if="
          store.status === 'success' &&
          !store.delayLoading &&
          store.user &&
          store.user.contacts.length > 0
        "
        :key="index"
        :contact="contact"
        @contact-selected="handleContactClick"
      />

      <NoContacts v-else vertical />
    </ScrollBox>

    <!--add affordance when there is nothing to pick from yet-->
    <div class="flex justify-center px-5 mt-2">
      <Button
        class="outlined-primary outlined-text px-4 py-2"
        @click="addOpen = true"
      >
        Add a contact
      </Button>
    </div>

    <AddContactModal
      :open-modal="addOpen"
      :close-modal="() => (addOpen = false)"
    />
  </div>
</template>
