<script setup lang="ts">
import type { Ref } from "vue";
import type { IContact } from "@src/types";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import useRoomsStore from "@src/store/rooms";

import GroupInfo from "@src/components/shared/modals/ComposeModal/GroupTab/GroupInfo.vue";
import GroupMembers from "@src/components/shared/modals/ComposeModal/GroupTab/GroupMembers.vue";
import SlideTransition from "@src/components/ui/transitions/SlideTransition.vue";

const props = defineProps<{
  closeModal: () => void;
}>();

const rooms = useRoomsStore();
const router = useRouter();

// used to determine whether to slide left or right
const animation = ref("slide-left");

// name of the active modal page
const activePageName = ref("group-info");

// the group name entered on the first page
const groupName: Ref<string> = ref("");

// contacts selected on the members page
const selectedContacts: Ref<IContact[]> = ref([]);

// the active page component
const ActivePage = computed((): any => {
  if (activePageName.value === "group-info") return GroupInfo;
  else if (activePageName.value === "group-members") return GroupMembers;
  return undefined;
});

// (event) to move between modal pages
const handleChangeActiveTab = (event: {
  tabName: string;
  animationName: string;
}) => {
  animation.value = event.animationName;
  activePageName.value = event.tabName;
};

// (event) create the group room with the selected co-members
const handleCreateGroup = async () => {
  const roomId = await rooms.createRoom(
    "group_direct",
    selectedContacts.value.map((c) => c.id),
    groupName.value,
  );
  props.closeModal();
  await router.push({ path: `/chat/${roomId}/` });
};
</script>

<template>
  <div>
    <!--content-->
    <div class="overflow-x-hidden">
      <SlideTransition :animation="animation">
        <component
          :is="ActivePage"
          :key="activePageName"
          :group-name="groupName"
          :selected-contacts="selectedContacts"
          @group-name-changed="(value: string) => (groupName = value)"
          @selected-contacts-change="
            (list: IContact[]) => (selectedContacts = list)
          "
          @finish="handleCreateGroup"
          @active-page-change="handleChangeActiveTab"
        />
      </SlideTransition>
    </div>
  </div>
</template>
