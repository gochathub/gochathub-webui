<script setup lang="ts">
import Avatar from "@src/components/ui/data-display/Avatar.vue";
import type { IAttachment, IConversation, IRecording } from "@src/types";
import type { Ref } from "vue";
import { computed, ref } from "vue";

import useStore from "@src/store/store";
import useRoomsStore from "@src/store/rooms";
import { useRoute } from "vue-router";
import {
  getActiveConversationId,
  getAvatar,
  getConversationIndex,
  getName,
  hasAttachments,
  shorten,
} from "@src/utils";
import { formatTime } from "@src/api/mappers";
import router from "@src/router";

import {
  ArchiveBoxArrowDownIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  TrashIcon,
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
const isAdmin = computed(() =>
  Boolean(props.conversation.admins?.includes(store.user?.id ?? "")),
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

// (event) archive/unarchive for me only
const handleArchive = () =>
  run(
    () => rooms.setArchived(props.conversation.id, !isArchived.value),
    "Could not update the archive. Please try again.",
  );

// (event) admin deletes the group, other members leave it
// ponytail: native confirm(); swap for a modal if the UI wants one.
const handleRemove = () => {
  const name = getName(props.conversation);
  const msg = isAdmin.value
    ? `Delete "${name}" for everyone? This cannot be undone.`
    : `Leave "${name}"?`;
  if (!window.confirm(msg)) return;
  const id = props.conversation.id;
  return run(
    () => (isAdmin.value ? rooms.deleteRoom(id) : rooms.leaveRoom(id)),
    isAdmin.value
      ? "Could not delete the group."
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

// last message in conversation to display
const lastMessage = computed(
  () => props.conversation.messages[props.conversation.messages.length - 1],
);

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
      class="w-full px-5 py-4 mb-3 flex rounded focus:bg-select active:bg-select dark:hover:bg-select/50 hover:bg-select/50 focus:outline-none transition duration-200 ease-out"
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
      <div class="mr-4">
        <Avatar
          :src="getAvatar(props.conversation)"
          :name="getName(props.conversation) ?? ''"
          class="w-7 h-7"
        />
      </div>

      <div class="w-full flex flex-col">
        <div class="w-full">
          <!--conversation name-->
          <div class="flex items-start">
            <div class="grow mb-3 text-start min-w-0">
              <p class="heading-2 text-fg truncate">
                {{ getName(props.conversation) }}
              </p>
            </div>

            <!--last message date-->
            <p class="body-1 text-muted shrink-0 ml-3">
              {{ lastMessage ? formatTime(lastMessage.date) : "" }}
            </p>
          </div>
        </div>

        <div class="flex justify-between">
          <div>
            <!--empty conversation-->
            <p v-if="!lastMessage" class="body-2 text-muted">no messages yet</p>

            <!--draft Message-->
            <p
              v-else-if="
                props.conversation.draftMessage &&
                props.conversation.id !== getActiveConversationId(route)
              "
              class="body-2 flex justify-start items-center text-error truncate"
            >
              draft: {{ shorten(props.conversation.draftMessage) }}
            </p>

            <!--recording name-->
            <p
              v-else-if="
                lastMessage?.type === 'recording' && lastMessage?.content
              "
              class="body-2 text-muted flex justify-start items-center"
            >
              <MicrophoneIcon class="w-4 h-4 mr-2 text-muted shrink-0" />
              <span
                class="truncate"
                :class="{
                  'text-accent dark:text-indigo-400': props.conversation.unread,
                }"
              >
                Recording
                {{ (lastMessage.content as IRecording).duration }}
              </span>
            </p>

            <!--attachments title-->
            <p
              v-else-if="hasAttachments(lastMessage)"
              class="body-2 text-muted flex justify-start items-center"
              :class="{
                'text-accent dark:text-indigo-400': props.conversation.unread,
              }"
            >
              <span class="truncate">
                {{ (lastMessage?.attachments as IAttachment[])[0].name }}
              </span>
            </p>

            <!--last message content -->
            <p
              v-else
              class="body-2 text-muted flex justify-start items-center"
              :class="{
                'text-accent dark:text-indigo-400': props.conversation.unread,
              }"
            >
              <span class="truncate">
                {{ shorten(String(lastMessage.content ?? "")) }}
              </span>
            </p>
          </div>

          <div
            v-if="props.conversation.unread"
            class="min-w-4.5 h-4.5 px-1 mt-1 flex justify-center items-center rounded-full bg-accent shrink-0 ml-2"
          >
            <p class="body-1 text-white">
              {{ props.conversation.unread }}
            </p>
          </div>
        </div>
      </div>
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
        v-if="props.conversation.type === 'group'"
        class="dropdown-link dropdown-link-danger"
        :aria-label="isAdmin ? 'Delete the group' : 'Leave the group'"
        role="menuitem"
        @click="handleRemove"
      >
        <TrashIcon class="h-5 w-5 mr-3" />
        {{ isAdmin ? "Delete group" : "Leave group" }}
      </button>
    </Dropdown>
  </div>
</template>
