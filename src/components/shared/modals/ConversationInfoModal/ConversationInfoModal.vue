<script setup lang="ts">
import type { Ref } from "vue";
import type { IContact, IConversation } from "@src/types";

import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import ConversationInfoTab from "@src/components/shared/modals/ConversationInfoModal/ConversationInfoTab/ConversationInfoTab.vue";
import DeleteGroupTab from "@src/components/shared/modals/ConversationInfoModal/DeleteGroupTab.vue";
import EditGroupInfoTab from "@src/components/shared/modals/ConversationInfoModal/EditGroupInfoTab.vue";
import ConversationMembersTab from "@src/components/shared/modals/ConversationInfoModal/ConversationMembersTab.vue";
import SharedMediaTab from "@src/components/shared/modals/ConversationInfoModal/SharedMediaTab/SharedMediaTab.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import SlideTransition from "@src/components/ui/transitions/SlideTransition.vue";
import useStore from "@src/store/store";
import useRoomsStore from "@src/store/rooms";
import useContactsStore from "@src/store/contacts";

defineEmits(["activePageChange"]);

const props = defineProps<{
  open: boolean;
  conversation: IConversation;
  closeModal: () => void;
}>();

const store = useStore();
const rooms = useRoomsStore();
const router = useRouter();

// selected group member
const selectedMember: Ref<IContact | undefined> = ref();

// used to determine whether to slide left or right
const animation = ref("slide-left");

// name of the active modal page
const activePageName = ref("conversation-info");

// the active modal page component
const ActiveTab = computed((): any => {
  if (activePageName.value === "conversation-info") return ConversationInfoTab;
  else if (activePageName.value === "members") return ConversationMembersTab;
  else if (activePageName.value === "group-member") return ConversationInfoTab;
  else if (activePageName.value === "shared-media") return SharedMediaTab;
  else if (activePageName.value === "edit-group") return EditGroupInfoTab;
  else if (activePageName.value === "delete-group") return DeleteGroupTab;
  return undefined;
});

// failed room changes surface through the sidebar notifications
function handleError(message: string) {
  store.notifications = [
    ...store.notifications,
    {
      flag: "account-update",
      title: "Something went wrong",
      message,
    },
  ];
}

// (event) leave the group; the member_removed event or removal keeps state true
const handleLeaveGroup = async () => {
  try {
    await rooms.leaveRoom(props.conversation.id);
    props.closeModal();
    router.push({ name: "Home" });
  } catch {
    handleError("Could not leave the group. Please try again.");
  }
};

// (event) creator deletes the group; room.archived removes it everywhere
const handleDeleteGroup = async () => {
  try {
    await rooms.deleteRoom(props.conversation.id);
    props.closeModal();
    router.push({ name: "Home" });
  } catch {
    handleError("Could not delete the group. Please try again.");
  }
};

// (event) move between modal pages
const handleChangeActiveTab = async (event: {
  tabName: string;
  animationName: string;
  contact?: IContact;
  removeContact?: boolean;
}) => {
  animation.value = event.animationName;
  activePageName.value = event.tabName;

  if (event.contact) {
    selectedMember.value = event.contact;
  }

  if (event.removeContact) {
    if (selectedMember.value) {
      await useContactsStore().removeContact(selectedMember.value.id);
    }
    selectedMember.value = undefined;
    props.closeModal();
  }
};
</script>

<template>
  <Modal :open="props.open" :close-modal="props.closeModal">
    <template #content>
      <div class="overflow-x-hidden">
        <div class="w-full max-w-[26rem] bg-canvas rounded py-6">
          <!--content-->
          <SlideTransition :animation="animation">
            <component
              :is="ActiveTab"
              :key="activePageName"
              :conversation="props.conversation"
              :close-modal="props.closeModal"
              :contact="selectedMember"
              @active-page-change="handleChangeActiveTab"
              @leave-group="handleLeaveGroup"
              @delete-group="handleDeleteGroup"
            />
          </SlideTransition>
        </div>
      </div>
    </template>
  </Modal>
</template>
