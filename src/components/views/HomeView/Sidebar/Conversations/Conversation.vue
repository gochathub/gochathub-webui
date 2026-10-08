<script setup lang="ts">
import Avatar from "@src/components/ui/data-display/Avatar.vue";
import type { IConversation } from "@src/types";
import type { Ref } from "vue";
import { computed, ref } from "vue";

import useStore from "@src/store/store";
import useRoomsStore from "@src/store/rooms";
import { useRoute } from "vue-router";
import {
  canDeleteRoom,
  getActiveConversationId,
  getAvatar,
  getConversationIndex,
  getName,
  shorten,
} from "@src/utils";
import router from "@src/router";

import {
  ArchiveBoxArrowDownIcon,
  CheckIcon,
  HashtagIcon,
  InformationCircleIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/vue/24/outline";
import Dropdown from "@src/components/ui/navigation/Dropdown/Dropdown.vue";
import DropdownLink from "@src/components/ui/navigation/Dropdown/DropdownLink.vue";

const props = defineProps<{
  conversation: IConversation;
}>();

const store = useStore();
const route = useRoute();

const showContextMenu = ref(false);

const contextMenuCoordinations: Ref<{ x: number; y: number } | undefined> =
  ref();

// open context menu.
const handleShowContextMenu = (event: any) => {
  showContextMenu.value = true;
  contextMenuCoordinations.value = {
    x:
      window.innerWidth - 205 <= event.pageX
        ? window.innerWidth - 220
        : event.pageX,
    y:
      window.innerHeight - 125 <= event.pageY
        ? window.innerHeight - 200
        : event.pageY,
  };
};

// (event) closes the context menu
const handleCloseContextMenu = () => {
  showContextMenu.value = false;
};

const rooms = useRoomsStore();
const isArchived = computed(() =>
  store.archivedConversations.some((c) => c.id === props.conversation.id),
);
const isAdmin = computed(() => canDeleteRoom(props.conversation, store.user));
const isGroup = computed(() => props.conversation.type === "group");
// admins delete any room (direct chats too); other members can only leave groups
const removeLabel = computed(() =>
  isAdmin.value
    ? `Delete ${isGroup.value ? "group" : "conversation"}`
    : "Leave group",
);

// failed room changes surface through the sidebar notifications
const run = async (action: () => Promise<unknown>, message: string) => {
  showContextMenu.value = false;
  try {
    await action();
    return true;
  } catch {
    store.notifications = [
      ...store.notifications,
      { flag: "account-update", title: "Something went wrong", message },
    ];
    return false;
  }
};

// (event) open the room with its info modal
const handleInfo = () => {
  showContextMenu.value = false;
  router.push({ path: `/chat/${props.conversation.id}/`, query: { info: 1 } });
};

// (event) clear unread by moving the read cursor to the newest message
const handleMarkRead = () =>
  run(
    () => rooms.markRead(props.conversation.id),
    "Could not mark the conversation as read. Please try again.",
  );

// (event) archive/unarchive for me only
const handleArchive = () =>
  run(
    () => rooms.setArchived(props.conversation.id, !isArchived.value),
    "Could not update the archive. Please try again.",
  );

// (event) admin deletes the group, other members leave it
// ponytail: native confirm(); swap for a modal if the UI wants one.
const handleRemove = () => {
  showContextMenu.value = false;
  const name = getName(props.conversation);
  const msg = isAdmin.value
    ? `Delete "${name}" for everyone? This cannot be undone.`
    : `Leave "${name}"?`;
  if (!window.confirm(msg)) return;
  const id = props.conversation.id;
  return run(
    () => (isAdmin.value ? rooms.deleteRoom(id) : rooms.leaveRoom(id)),
    isAdmin.value
      ? "Could not delete the conversation."
      : "Could not leave the group.",
  ).then((ok) => {
    if (ok && getActiveConversationId(route) === id)
      router.push({ path: "/chat/" });
  });
};

// (event) select this conversation.
const handleSelectConversation = () => {
  showContextMenu.value = false;
  router.push({ path: `/chat/${props.conversation.id}/` });
};

// (event) remove the unread indicator when opening the conversation
const handleRemoveUnread = () => {
  const index = getConversationIndex(props.conversation.id);
  if (index !== undefined) {
    store.conversations[index].unread = 0;
  }
};

// (computed property) determines if this conversation is active.
const isActive = computed(
  () => getActiveConversationId(route) === props.conversation.id,
);
</script>

<template>
  <div>
    <button
      :aria-label="'conversation with' + getName(props.conversation)"
      tabindex="0"
      class="w-full px-4 py-2 mb-1 flex items-center rounded focus:bg-select active:bg-select dark:hover:bg-select/50 hover:bg-select/50 focus:outline-none transition duration-200 ease-out"
      :class="{
        'md:bg-select': isActive,
      }"
      @contextmenu.prevent="handleShowContextMenu"
      @click="
        () => {
          handleRemoveUnread();
          handleSelectConversation();
        }
      "
    >
      <!--profile image-->
      <Avatar
        :src="getAvatar(props.conversation)"
        :name="getName(props.conversation) ?? ''"
        class="w-7 h-7 mr-3 shrink-0"
      />

      <!--group / user marker-->
      <component
        :is="isGroup ? HashtagIcon : UserIcon"
        class="w-5 h-5 mr-1.5 text-muted shrink-0"
        :aria-label="isGroup ? 'group' : 'user'"
      />

      <!--conversation name-->
      <p class="grow min-w-0 text-start heading-2 text-fg truncate">
        {{ getName(props.conversation) }}
      </p>

      <!--unsent draft in a conversation that isn't open-->
      <span
        v-if="
          props.conversation.draftMessage &&
          props.conversation.id !== getActiveConversationId(route)
        "
        class="ml-2 body-2 text-error shrink-0"
        :title="`draft: ${shorten(props.conversation.draftMessage)}`"
      >
        draft
      </span>

      <!--unread count-->
      <span
        v-if="props.conversation.unread"
        class="ml-2 min-w-4.5 h-4.5 px-1 flex justify-center items-center rounded-full bg-accent shrink-0 body-1 text-white"
      >
        {{ props.conversation.unread }}
      </span>
    </button>

    <!--custom context menu-->
    <Dropdown
      :close-dropdown="() => (showContextMenu = false)"
      :show="showContextMenu"
      :handle-close="handleCloseContextMenu"
      :handle-click-outside="handleCloseContextMenu"
      :coordinates="{
        left: contextMenuCoordinations?.x + 'px',
        top: contextMenuCoordinations?.y + 'px',
      }"
      :position="['top-0']"
    >
      <button
        class="dropdown-link dropdown-link-primary"
        aria-label="Show conversation information"
        role="menuitem"
        @click="handleInfo"
      >
        <InformationCircleIcon class="h-5 w-5 mr-3" />
        Conversation info
      </button>

      <button
        v-if="props.conversation.unread"
        class="dropdown-link dropdown-link-primary"
        aria-label="Mark all messages as read"
        role="menuitem"
        @click="handleMarkRead"
      >
        <CheckIcon class="h-5 w-5 mr-3" />
        Mark all read
      </button>

      <button
        class="dropdown-link dropdown-link-primary"
        :aria-label="
          isArchived ? 'Unarchive conversation' : 'Archive conversation'
        "
        role="menuitem"
        @click="handleArchive"
      >
        <ArchiveBoxArrowDownIcon class="h-5 w-5 mr-3" />
        {{ isArchived ? "Unarchive" : "Archive" }} conversation
      </button>

      <button
        v-if="isGroup || isAdmin"
        class="dropdown-link dropdown-link-danger"
        :aria-label="removeLabel"
        role="menuitem"
        @click="handleRemove"
      >
        <TrashIcon class="h-5 w-5 mr-3" />
        {{ removeLabel }}
      </button>
    </Dropdown>
  </div>
</template>
