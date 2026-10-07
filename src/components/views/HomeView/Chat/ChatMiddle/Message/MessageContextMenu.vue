<script setup lang="ts">
import type { IConversation, IMessage } from "@src/types";
import { computed, inject } from "vue";
import type { Ref } from "vue";

import useAuthStore from "@src/store/auth";
import useRoomsStore from "@src/store/rooms";
import useStore from "@src/store/store";
import { canDeleteRoom, getConversationIndex } from "@src/utils";

import {
  ArrowUturnLeftIcon,
  BookmarkSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
} from "@heroicons/vue/24/outline";
import Dropdown from "@src/components/ui/navigation/Dropdown/Dropdown.vue";
import DropdownLink from "@src/components/ui/navigation/Dropdown/DropdownLink.vue";

const props = defineProps<{
  message: IMessage;
  show: boolean;
  left: number;
  top: number;
  selected: boolean;
  handleCloseContextMenu: () => void;
  handleSelectMessage: (messageId: string) => void;
  handleDeselectMessage: (messageId: string) => void;
}>();

const store = useStore();
const auth = useAuthStore();
const rooms = useRoomsStore();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

// author, room admin or server admin (the server enforces the same rule)
const canDelete = computed(
  () =>
    props.message.state !== "deleted" &&
    (props.message.sender.id === auth.me?.id ||
      (activeConversation.value !== undefined &&
        canDeleteRoom(activeConversation.value, auth.me))),
);

// (event) copy the message text; clipboard API needs a secure context, so
// LAN http origins fall back to execCommand.
const handleCopy = async () => {
  props.handleCloseContextMenu();
  const text = props.message.content;
  if (typeof text !== "string") return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
};

// (event) delete the message; failures surface in the sidebar notifications
const handleDelete = async () => {
  props.handleCloseContextMenu();
  if (!activeConversation.value) return;
  if (!window.confirm("Delete this message for everyone?")) return;
  try {
    await rooms.deleteMessage(activeConversation.value.id, props.message.id);
  } catch {
    store.notifications = [
      ...store.notifications,
      {
        flag: "account-update",
        title: "Something went wrong",
        message: "Could not delete the message.",
      },
    ];
  }
};

// (event) pin message to conversation
const handlePinMessage = () => {
  props.handleCloseContextMenu();

  if (activeConversation.value) {
    // get the active conversation index in the state store
    const activeConversationIndex = getConversationIndex(
      activeConversation.value.id,
    );

    if (
      store.conversations &&
      activeConversationIndex !== undefined &&
      activeConversationIndex !== null
    ) {
      // update the conversation in the state store
      store.conversations[activeConversationIndex].pinnedMessage =
        props.message;
      store.conversations[activeConversationIndex].pinnedMessageHidden = false;
    }
  }
};

// (event) select the reply message.
const handleReplyToMessage = () => {
  props.handleCloseContextMenu();

  if (activeConversation.value) {
    // get the active conversation index in the state store
    const activeConversationIndex = getConversationIndex(
      activeConversation.value.id,
    );

    if (
      store.conversations &&
      activeConversationIndex !== undefined &&
      activeConversationIndex !== null
    ) {
      // update the conversation in the state store
      store.conversations[activeConversationIndex].replyMessage = props.message;
    }
  }
};
</script>

<template>
  <!--custom context menu-->
  <Dropdown
    :close-dropdown="handleCloseContextMenu"
    :handle-click-outside="handleCloseContextMenu"
    :show="show"
    :coordinates="{
      left: props.left + 'px',
      top: props.top + 'px',
    }"
    :position="['top-0']"
  >
    <button
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="reply to this message"
      @click="handleReplyToMessage"
    >
      <ArrowUturnLeftIcon class="h-5 w-5 mr-3" />
      Reply
    </button>

    <button
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="copy this message"
      @click="handleCopy"
    >
      <ClipboardDocumentIcon class="h-5 w-5 mr-3" />
      Copy
    </button>

    <button
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="pin this message"
      @click="handlePinMessage"
    >
      <BookmarkSquareIcon class="h-5 w-5 mr-3" />
      Pin
    </button>

    <button
      v-if="props.selected"
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="deselect this message"
      @click="
        () => {
          handleCloseContextMenu();
          props.handleDeselectMessage(props.message.id);
        }
      "
    >
      <XCircleIcon class="h-5 w-5 mr-3" />
      Deselect
    </button>

    <button
      v-else
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="select this message"
      @click="
        () => {
          handleCloseContextMenu();
          props.handleSelectMessage(props.message.id);
        }
      "
    >
      <CheckCircleIcon class="h-5 w-5 mr-3" />
      Select
    </button>

    <button
      v-if="canDelete"
      class="dropdown-link dropdown-link-danger"
      role="menuitem"
      aria-label="delete this message"
      @click="handleDelete"
    >
      <TrashIcon class="h-5 w-5 mr-3" />
      Delete Message
    </button>
  </Dropdown>
</template>
