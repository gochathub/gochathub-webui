<script setup lang="ts">
import type { Ref } from "vue";
import type { IContact } from "@src/types";

import { ref, watch } from "vue";

import useStore from "@src/store/store";

import Circle2Lines from "@src/components/states/loading-states/Circle2Lines.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";
import ContactItem from "@src/components/shared/blocks/ContactItem.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import Checkbox from "@src/components/ui/inputs/Checkbox.vue";

const props = defineProps<{
  selectedContacts?: IContact[];
}>();

const emits = defineEmits<{
  selectedContactsChange: [IContact[]];
  finish: [];
  activePageChange: [{ tabName: string; animationName: string }];
}>();

const store = useStore();

const picked: Ref<IContact[]> = ref([]);

// sync upward selection changes
watch(
  () => props.selectedContacts,
  (list) => {
    picked.value = list ?? [];
  },
  { immediate: true },
);

// checks whether a contact is selected or not
const isContactSelected = (contact: IContact) => {
  if (contact) {
    return Boolean(picked.value.find((item) => item.id === contact.id));
  } else {
    return false;
  }
};

// (event) change the value of selected contacts (and mirror to the parent)
const handleSelectedContactsChange = (contact: IContact) => {
  const contactIndex = picked.value.findIndex((item) => item.id === contact.id);
  if (contactIndex !== -1) {
    picked.value.splice(contactIndex, 1);
  } else {
    picked.value.push(contact);
  }
  emits("selectedContactsChange", [...picked.value]);
};
</script>

<template>
  <div>
    <!--search-->
    <div class="mx-5 mt-3 mb-5">
      <SearchInput />
    </div>

    <!--contacts-->
    <div tabindex="0" class="overflow-y-scroll max-h-50 scrollbar-thin mb-5">
      <template
        v-if="store.status === 'success' && !store.delayLoading && store.user"
      >
        <ContactItem
          v-for="(contact, index) in store.user.contacts"
          :key="index"
          :contact="contact"
          :active="isContactSelected(contact)"
          @click="handleSelectedContactsChange(contact)"
        >
          <template #checkbox>
            <Checkbox :value="isContactSelected(contact)" />
          </template>
        </ContactItem>
      </template>

      <template v-if="store.status === 'loading' || store.delayLoading">
        <Circle2Lines v-for="_idx in 3" :key="_idx" />
      </template>
    </div>

    <div class="flex px-5 mt-5 pb-6">
      <div class="grow"></div>
      <!--previous button-->
      <Button
        class="ghost-primary ghost-text mr-4"
        @click="
          emits('activePageChange', {
            tabName: 'group-info',
            animationName: 'slide-right',
          })
        "
      >
        <p class="body-5">Previous</p>
      </Button>

      <!--next button-->
      <Button class="contained-primary contained-text" @click="emits('finish')">
        Finish
      </Button>
    </div>
  </div>
</template>
