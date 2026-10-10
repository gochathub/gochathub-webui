<script setup lang="ts">
import Avatar from "@src/components/ui/data-display/Avatar.vue";
import type { IConversation, IMessage, IRecording } from "@src/types";
import type { Ref } from "vue";

import { inject, ref, computed } from "vue";

import { getFullName, getMessageById } from "@src/utils";
import { formatDateTime } from "@src/api/mappers";
import { renderMarkdown } from "@src/api/markdown";

import Attachments from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Attachments.vue";
import MessageContextMenu from "@src/components/views/HomeView/Chat/ChatMiddle/Message/MessageContextMenu.vue";
import Receipt from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Receipt.vue";
import Recording from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Recording.vue";
import MessagePreview from "@src/components/views/HomeView/Chat/MessagePreview.vue";

const props = defineProps<{
  message: IMessage;
  followUp: boolean;
  self: boolean;
  divider?: boolean;
  selected?: boolean;
  handleSelectMessage: (messageId: string) => void;
  handleDeselectMessage: (messageId: string) => void;
}>();

const activeConversation = inject("activeConversation") as Ref<
  IConversation | undefined
>;

const showContextMenu = ref(false);

const contextMenuCoordinations: Ref<{ x: number; y: number }> = ref({
  x: 0,
  y: 0,
});

// open context menu.
const handleShowContextMenu = (event: any) => {
  showContextMenu.value = true;
  contextMenuCoordinations.value = {
    x:
      window.innerWidth - 220 <= event.pageX
        ? window.innerWidth - 250
        : event.pageX,
    y:
      window.innerHeight - 300 <= event.pageY
        ? window.innerHeight - 250
        : event.pageY,
  };
};

// closes the context menu
const handleCloseContextMenu = () => {
  showContextMenu.value = false;
};

// close context menu when opening a new one.
const contextConfig = {
  handler: handleCloseContextMenu,
  events: ["contextmenu"],
};

// decide whether to show or hide avatar next to the image.
const hideAvatar = () => {
  if (props.divider && !props.self) {
    return false;
  } else {
    if (props.followUp) {
      return true;
    }
    if (props.self) {
      return true;
    }
  }
};

// reply message
const replyMessage = computed(() =>
  activeConversation.value && props.message.replyTo
    ? getMessageById(activeConversation.value, props.message.replyTo)
    : undefined,
);
</script>

<template>
  <div>
    <div class="mb-3 flex" :class="{ 'justify-end': props.self }">
      <!--avatar-->
      <div
        class="mr-4"
        :class="{
          'ml-[2.25rem]': props.followUp && !divider,
          hidden: props.self,
        }"
      >
        <div
          v-if="!hideAvatar()"
          :aria-label="getFullName(props.message.sender)"
          class="outline-none"
        >
          <Avatar
            :src="props.message.sender.avatar"
            :name="getFullName(props.message.sender)"
            class="w-[2.25rem] h-[2.25rem]"
          />
        </div>
      </div>

      <div
        class="flex items-end grow min-w-0"
        :class="{ 'justify-end': props.self }"
      >
        <!--date above the bubble-->
        <div
          class="flex flex-col min-w-0 max-w-[80%]"
          :class="props.self ? 'items-end order-2 ml-4' : 'items-start mr-4'"
        >
          <p class="mb-1 body-1 text-muted whitespace-nowrap">
            {{ formatDateTime(props.message.date) }}
          </p>

          <!--bubble-->
          <div
            v-click-outside="contextConfig"
            class="group p-3.5 rounded-b-xl transition duration-200"
            :class="{
              'rounded-tl-xl bg-mine': props.self && !props.selected,

              'rounded-tr-xl bg-card': !props.self && !props.selected,

              'rounded-tl-xl bg-accent-soft': props.self && props.selected,

              'rounded-tr-xl bg-accent-soft': !props.self && props.selected,
            }"
            @click="handleCloseContextMenu"
            @contextmenu.prevent="handleShowContextMenu"
          >
            <!--reply to-->
            <MessagePreview
              v-if="replyMessage"
              :message="replyMessage"
              :self="props.self"
              class="mb-5 px-3"
            />

            <!--content-->
            <!-- eslint-disable vue/no-v-html -- renderMarkdown escapes the source first; every tag in the output is ours -->
            <p
              v-if="props.message.content && props.message.type !== 'recording'"
              class="body-2 outline-none [overflow-wrap:anywhere] [&_pre]:overflow-x-auto"
              :class="
                props.self && !props.selected
                  ? 'text-white'
                  : 'text-fg/90 dark:text-fg/85'
              "
              tabindex="0"
              v-html="renderMarkdown(props.message.content as string)"
            ></p>
            <!-- eslint-enable vue/no-v-html -->

            <!--recording-->
            <div
              v-else-if="
                props.message.content && props.message.type === 'recording'
              "
            >
              <Recording
                :recording="props.message.content as IRecording"
                :self="props.self"
              />
            </div>

            <!--attachments-->
            <Attachments
              v-if="(props.message.attachments as [])?.length > 0"
              :message="props.message"
              :self="props.self"
            />
          </div>
        </div>

        <!--read receipt-->
        <Receipt v-if="props.self" :state="props.message.state" />
      </div>
    </div>
    <MessageContextMenu
      :selected="props.selected"
      :message="props.message"
      :show="showContextMenu"
      :left="contextMenuCoordinations.x"
      :top="contextMenuCoordinations.y"
      :handle-close-context-menu="handleCloseContextMenu"
      :handle-select-message="handleSelectMessage"
      :handle-deselect-message="handleDeselectMessage"
    />
  </div>
</template>
