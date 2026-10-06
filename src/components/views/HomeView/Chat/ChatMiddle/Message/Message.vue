<script setup lang="ts">
import type { IConversation, IMessage, IRecording } from "@src/types";
import type { Ref } from "vue";

import { inject, ref, computed } from "vue";

import { getFullName, getMessageById } from "@src/utils";
import { formatTime } from "@src/api/mappers";
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
  <div class="select-none">
    <div class="xs:mb-6 md:mb-5 flex" :class="{ 'justify-end': props.self }">
      <!--avatar-->
      <div class="mr-4" :class="{ 'ml-[2.25rem]': props.followUp && !divider }">
        <div
          v-if="!hideAvatar()"
          :aria-label="getFullName(props.message.sender)"
          class="outline-none"
        >
          <div
            :style="{ backgroundImage: `url(${props.message.sender.avatar})` }"
            class="w-[2.25rem] h-[2.25rem] bg-cover bg-center rounded-full"
          ></div>
        </div>
      </div>

      <div class="flex items-end">
        <!--bubble-->
        <div
          v-click-outside="contextConfig"
          class="group max-w-125 p-5 rounded-b-xl transition duration-500"
          :class="{
            'rounded-tl-xl ml-4 order-2 bg-indigo-50 dark:bg-gray-600':
              props.self && !props.selected,

            'rounded-tr-xl mr-4 bg-gray-50 dark:bg-gray-600':
              !props.self && !props.selected,

            'rounded-tl-xl ml-4 order-2 bg-indigo-200 dark:bg-indigo-500':
              props.self && props.selected,

            'rounded-tr-xl mr-4 bg-indigo-200 dark:bg-indigo-500':
              !props.self && props.selected,
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
            class="body-2 outline-none text-black opacity-60 dark:text-white dark:opacity-70"
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

        <!--date-->
        <div :class="props.self ? ['ml-4', 'order-1'] : ['mr-4']">
          <p class="body-1 text-black/70 dark:text-white/70 whitespace-pre">
            {{ formatTime(props.message.date) }}
          </p>
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
