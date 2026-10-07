<script setup lang="ts">
import type { IConversation } from "@src/types";

import { inject, ref, computed } from "vue";
import type { Ref } from "vue";

import router from "@src/router";
import useStore from "@src/store/store";
import { presence } from "@src/utils";
import { getAvatar, getName } from "@src/utils";

import {
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  ShareIcon,
} from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import Dropdown from "@src/components/ui/navigation/Dropdown/Dropdown.vue";
import DropdownLink from "@src/components/ui/navigation/Dropdown/DropdownLink.vue";

const props = defineProps<{
  handleOpenInfo: () => void;
  handleOpenSearch: () => void;
}>();

const store = useStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

// peer presence line: online (recent activity) or last-seen timestamp.
// Server omits last_seen_at (null) when the peer opted out (ADR-013) or for
// contacts never seen — show nothing rather than epoch.
const presenceLine = computed(() => {
  const conv = activeConversation.value;
  if (!conv) return "";
  if (conv.type === "group") {
    const n = conv.contacts.length + 1;
    return n === 1 ? "1 member" : `${n} members`;
  }
  const peer = conv.contacts[0];
  if (!peer) return "";
  return presence(peer.lastSeen);
});

const showDropdown = ref(false);

// (event) close dropdown menu when click item
const handleCloseDropdown = () => {
  showDropdown.value = false;
};

// (event) close dropdown menu when clicking outside the menu.
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  const parentElement = target.parentElement as HTMLElement;

  if (
    target &&
    !(target.classList as Element["classList"]).contains("open-top-menu") &&
    parentElement &&
    !(parentElement.classList as Element["classList"]).contains("open-top-menu")
  ) {
    handleCloseDropdown();
  }
};

// (event) navigate to the /chat/ url
const handleCloseConversation = () => {
  router.push({ path: "/chat/" });
};
</script>

<template>
  <!--conversation info-->
  <div class="w-full flex justify-center items-center">
    <div class="group mr-4 md:hidden">
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="close conversation"
        aria-label="close conversation"
        @click="handleCloseConversation"
      >
        <ChevronLeftIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
    </div>

    <div v-if="store.status !== 'loading'" class="flex grow min-w-0">
      <!--avatar-->
      <button
        class="mr-5 outline-none shrink-0"
        aria-label="profile avatar"
        @click="props.handleOpenInfo"
      >
        <div
          :style="{
            backgroundImage: `url(${getAvatar(activeConversation as IConversation)})`,
          }"
          class="w-[2.25rem] h-[2.25rem] rounded-full bg-cover bg-center"
        ></div>
      </button>

      <!--name and last seen-->
      <div class="flex flex-col min-w-0">
        <p
          class="heading-2 text-fg mb-2 cursor-pointer truncate"
          tabindex="0"
          @click="props.handleOpenInfo"
        >
          {{ getName(activeConversation as IConversation) }}
        </p>

        <p
          class="body-2 text-muted rounded-[.25rem] truncate"
          tabindex="0"
          aria-label="presence"
        >
          {{ presenceLine }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0" :class="{ hidden: store.status === 'loading' }">
      <!--search button-->
      <IconButton
        title="search messages"
        aria-label="search messages"
        class="ic-btn-ghost-primary w-7 h-7 mr-3"
        @click="props.handleOpenSearch"
      >
        <MagnifyingGlassIcon
          class="w-[1.25rem] h-[1.25rem] text-muted group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
        />
      </IconButton>

      <div class="relative">
        <!--dropdown menu button-->
        <IconButton
          id="open-conversation-menu"
          class="ic-btn-ghost-primary open-top-menu group w-7 h-7"
          :aria-expanded="showDropdown"
          tabindex="0"
          aria-controls="conversation-menu"
          title="toggle conversation menu"
          aria-label="toggle conversation menu"
          @click="showDropdown = !showDropdown"
        >
          <EllipsisVerticalIcon class="open-top-menu w-[1.25rem] h-[1.25rem]" />
        </IconButton>

        <!--dropdown menu-->
        <Dropdown
          id="conversation-menu"
          :close-dropdown="() => (showDropdown = false)"
          :show="showDropdown"
          :position="['right-0']"
          :handle-click-outside="handleClickOutside"
          aria-labelledby="open-conversation-menu"
        >
          <button
            class="dropdown-link dropdown-link-primary"
            aria-label="Show profile information"
            role="menuitem"
            @click="
              () => {
                handleCloseDropdown();
                props.handleOpenInfo();
              }
            "
          >
            <InformationCircleIcon class="h-5 w-5 mr-3 text-muted" />
            Profile Information
          </button>
          <button
            class="dropdown-link dropdown-link-primary"
            aria-label="share this contact"
            role="menuitem"
            @click="handleCloseDropdown"
          >
            <ShareIcon class="h-5 w-5 mr-3 text-muted" />
            Shared media
          </button>
          <button
            class="dropdown-link dropdown-link-danger"
            aria-label="block this contact"
            role="menuitem"
            @click="handleCloseDropdown"
          >
            <NoSymbolIcon class="h-5 w-5 mr-3" />
            Block contact
          </button>
        </Dropdown>
      </div>
    </div>
  </div>
</template>
