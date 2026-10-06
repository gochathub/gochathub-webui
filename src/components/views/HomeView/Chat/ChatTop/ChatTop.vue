<script setup lang="ts">
import type { IConversation } from "@src/types";

import { inject, ref } from "vue";
import type { Ref } from "vue";

import useStore from "@src/store/store";

import ConversationInfoModal from "@src/components/shared/modals/ConversationInfoModal/ConversationInfoModal.vue";
import SearchModal from "@src/components/shared/modals/SearchModal/SearchModal.vue";
import PinnedMessage from "@src/components/views/HomeView/Chat/ChatTop/PinnedMessage.vue";
import ConversationInfoSection from "./ConversationInfoSection.vue";
import SelectSection from "./SelectSection.vue";

const props = defineProps<{
  selectMode: boolean;
  selectAll: boolean;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleCloseSelect: () => void;
}>();

const store = useStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

const openSearch = ref(false);

const openInfo = ref(false);

// (event) open search modal
const handleOpenSearch = () => {
  openSearch.value = true;
};

// (event) open info modal
const handleOpenInfo = () => {
  openInfo.value = true;
};
</script>

<template>
  <div class="w-full">
    <!--Top section-->
    <div class="w-full min-h-21 px-5 py-6">
      <SelectSection
        v-if="props.selectMode"
        :select-mode="props.selectMode"
        :select-all="props.selectAll"
        :handle-close-select="props.handleCloseSelect"
        :handle-select-all="props.handleSelectAll"
        :handle-deselect-all="props.handleDeselectAll"
      />
      <ConversationInfoSection
        v-else
        :handle-open-info="handleOpenInfo"
        :handle-open-search="handleOpenSearch"
      />
    </div>

    <!--Pinned Message-->
    <div
      class="relative transition-[padding] duration-200"
      :class="{
        'pb-15':
          activeConversation?.pinnedMessage &&
          !activeConversation?.pinnedMessageHidden,
      }"
    >
      <PinnedMessage
        :active-conversation="activeConversation as IConversation"
      />
    </div>

    <!--Search modal-->
    <SearchModal
      :open="openSearch"
      :close-modal="() => (openSearch = false)"
      :conversation="activeConversation as IConversation"
    />

    <!--Contact info modal-->
    <ConversationInfoModal
      :open="openInfo"
      :close-modal="() => (openInfo = false)"
      :conversation="activeConversation as IConversation"
    />
  </div>
</template>
