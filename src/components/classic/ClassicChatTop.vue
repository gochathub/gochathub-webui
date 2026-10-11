<script setup lang="ts">
import type { IConversation } from "@src/types";

import { computed, inject, ref, watch } from "vue";
import type { Ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getName } from "@src/utils";

import {
  ChevronLeftIcon,
  HashtagIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  UserIcon,
} from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import ConversationInfoModal from "@src/components/shared/modals/ConversationInfoModal/ConversationInfoModal.vue";
import SearchModal from "@src/components/shared/modals/SearchModal/SearchModal.vue";
import PinnedMessage from "@src/components/views/HomeView/Chat/ChatTop/PinnedMessage.vue";
import SelectSection from "@src/components/views/HomeView/Chat/ChatTop/SelectSection.vue";

const props = defineProps<{
  selectMode: boolean;
  selectAll: boolean;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleCloseSelect: () => void;
}>();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;
const conv = computed(() => activeConversation.value as IConversation);
const isGroup = computed(() => conv.value.type === "group");

const openSearch = ref(false);
const openInfo = ref(false);
const infoTab = ref<string>();

// sidebar "Conversation info" routes here with ?info=1
const route = useRoute();
const router = useRouter();
watch(
  () => route.query.info,
  (info) => {
    if (!info) return;
    infoTab.value = undefined;
    openInfo.value = true;
    router.replace({ query: {} });
  },
  { immediate: true },
);

const showInfo = (tab?: string) => {
  infoTab.value = tab;
  openInfo.value = true;
};
</script>

<template>
  <div class="w-full">
    <div
      class="w-full h-[3.375rem] px-5 flex items-center border-b border-hairline"
    >
      <SelectSection
        v-if="props.selectMode"
        :select-mode="props.selectMode"
        :select-all="props.selectAll"
        :handle-close-select="props.handleCloseSelect"
        :handle-select-all="props.handleSelectAll"
        :handle-deselect-all="props.handleDeselectAll"
      />
      <template v-else>
        <IconButton
          class="ic-btn-ghost-primary w-7 h-7 mr-3 md:hidden"
          title="close conversation"
          aria-label="close conversation"
          @click="router.push({ path: '/chat/' })"
        >
          <ChevronLeftIcon class="w-[1.25rem] h-[1.25rem]" />
        </IconButton>
        <component
          :is="isGroup ? HashtagIcon : UserIcon"
          class="w-[1.25rem] h-[1.25rem] mr-2 text-muted shrink-0"
        />
        <button
          class="heading-1 text-fg truncate"
          title="Conversation info"
          @click="showInfo()"
        >
          {{ getName(conv) }}
        </button>
        <span
          v-if="conv.description"
          class="ml-4 body-2 text-fg truncate xs:hidden md:inline"
        >
          {{ conv.description }}
        </span>
        <div class="ml-auto pl-4 flex shrink-0 gap-1">
          <IconButton
            class="ic-btn-ghost-primary w-7 h-7"
            title="Conversation info"
            aria-label="Conversation info"
            @click="showInfo()"
          >
            <InformationCircleIcon class="w-[1.25rem] h-[1.25rem]" />
          </IconButton>
          <IconButton
            class="ic-btn-ghost-primary w-7 h-7"
            title="Shared media"
            aria-label="Shared media"
            @click="showInfo('shared-media')"
          >
            <PhotoIcon class="w-[1.25rem] h-[1.25rem]" />
          </IconButton>
          <IconButton
            class="ic-btn-ghost-primary w-7 h-7"
            title="Search messages"
            aria-label="Search messages"
            @click="openSearch = true"
          >
            <MagnifyingGlassIcon class="w-[1.25rem] h-[1.25rem]" />
          </IconButton>
        </div>
      </template>
    </div>

    <div
      class="relative transition-[padding] duration-200"
      :class="{
        'pb-15': conv.pinnedMessage && !conv.pinnedMessageHidden,
      }"
    >
      <PinnedMessage :active-conversation="conv" />
    </div>

    <SearchModal
      :open="openSearch"
      :close-modal="() => (openSearch = false)"
      :conversation="conv"
    />
    <ConversationInfoModal
      :open="openInfo"
      :initial-tab="infoTab"
      :close-modal="() => (openInfo = false)"
      :conversation="conv"
    />
  </div>
</template>
