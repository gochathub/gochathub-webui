<script setup lang="ts">
import type { Ref } from "vue";

import { computed, ref, watch } from "vue";

import useContactsStore from "@src/store/contacts";
import ContactsTab from "@src/components/shared/modals/ComposeModal/ContactsTab.vue";
import GroupTab from "@src/components/shared/modals/ComposeModal/GroupTab/GroupTab.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import Tabs from "@src/components/ui/navigation/Tabs/Tabs.vue";
import Tab from "@src/components/ui/navigation/Tabs/Tab.vue";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
}>();

// the contact list drives both tabs; load fresh when the modal opens
const contacts = useContactsStore();
watch(
  () => props.open,
  (open) => {
    if (open) contacts.loadContacts();
  },
);

// the p element containing the modal title
const modalTitle: Ref<HTMLElement | null> = ref(null);

// the name of the selected tab
const activeTabName = ref("contacts");

// (event) switch between the contacts and group tabs
const handleSwitchTab = (tabName: string) => {
  activeTabName.value = tabName;
};

// the active tab contacts or group.
const activeTab = computed(() => {
  if (activeTabName.value === "contacts") {
    return ContactsTab;
  } else {
    return GroupTab;
  }
});
</script>

<template>
  <Modal :open="props.open" :close-modal="props.closeModal">
    <template #content>
      <div class="w-full max-w-[26rem] bg-canvas rounded pt-6">
        <!--header-->
        <div class="flex justify-between items-center mb-6 px-5">
          <div class="flex items-center gap-1">
            <p
              id="modal-title"
              ref="modalTitle"
              class="heading-1 text-fg"
              tabindex="0"
            >
              Compose
            </p>
            <HelpLink
              to="/help/rooms#start-a-conversation"
              label="starting a conversation"
            />
          </div>

          <Button
            class="outlined-danger ghost-text py-2 px-4"
            @click="props.closeModal"
          >
            esc
          </Button>
        </div>

        <!--tabs-->
        <div class="px-5 pb-5">
          <Tabs>
            <Tab
              name="Contact"
              :active="activeTabName === 'contacts'"
              @click="handleSwitchTab('contacts')"
            />
            <Tab
              name="Group"
              :active="activeTabName === 'group'"
              @click="handleSwitchTab('group')"
            />
          </Tabs>
        </div>

        <!--ActiveTab-->
        <FadeTransition>
          <component
            :is="activeTab"
            :key="activeTabName"
            :close-modal="props.closeModal"
          />
        </FadeTransition>
      </div>
    </template>
  </Modal>
</template>
