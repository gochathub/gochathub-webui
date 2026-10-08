<script setup lang="ts">
import type { IAttachment, IContact, IConversation } from "@src/types";
import { computed, ref } from "vue";

import { refreshAttachment } from "@src/api/attachments";
import { hasAttachments } from "@src/utils";
import Carousel from "@src/components/ui/data-display/Carousel/Carousel.vue";

import { ArrowUturnLeftIcon } from "@heroicons/vue/24/outline";
import MediaItem from "@src/components/shared/modals/ConversationInfoModal/SharedMediaTab/MediaItem.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";
import NoMedia from "@src/components/states/empty-states/NoMedia.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";

defineEmits(["active-page-change"]);

const props = defineProps<{
  closeModal: () => void;
  conversation: IConversation;
  contact?: IContact;
}>();

const keyword = ref("");

// attachments of the conversation (or of one member), filtered by filename.
const items = computed(() => {
  const q = keyword.value.toLowerCase();
  const out: { attachment: IAttachment; date: string }[] = [];
  for (const message of props.conversation.messages) {
    if (!hasAttachments(message)) continue;
    if (props.contact && message.sender.id !== props.contact.id) continue;
    for (const attachment of message.attachments ?? []) {
      if (attachment.name.toLowerCase().includes(q)) {
        out.push({ attachment, date: message.date });
      }
    }
  }
  return out;
});

const media = computed(() =>
  items.value
    .map((i) => i.attachment)
    .filter((a) => ["image", "video"].includes(a.type)),
);

const open = ref(false);
const startingId = ref<string>();

// (event) media opens in the carousel; files open via a fresh presigned URL
// ponytail: carousel uses the URLs from the message payload, as the chat view does.
const handleView = async (a: IAttachment) => {
  if (["image", "video"].includes(a.type)) {
    startingId.value = a.id;
    open.value = true;
    return;
  }
  const fresh = await refreshAttachment(a.id);
  if (fresh.url) window.open(fresh.url, "_blank", "noopener");
};
</script>

<template>
  <div>
    <!--header-->
    <div class="mb-6 px-5 flex justify-between items-center">
      <div class="flex items-center gap-1">
        <p id="modal-title" class="heading-1 text-fg" tabindex="0">
          Shared Media
        </p>
        <HelpLink to="/help/attachments#shared-media" label="shared media" />
      </div>

      <!--return button-->
      <IconButton
        class="ic-btn-outlined-danger p-2"
        @click="
          $emit('active-page-change', {
            tabName: 'conversation-info',
            animationName: 'slide-right',
          })
        "
      >
        <ArrowUturnLeftIcon class="w-5 h-5" />
      </IconButton>
    </div>

    <!--search-->
    <div class="mb-5 mx-5">
      <SearchInput :value="keyword" @value-changed="(v) => (keyword = v)" />
    </div>

    <!--media messages-->
    <div tabindex="0" class="overflow-y-scroll max-h-55.5 scrollbar-thin">
      <template v-if="items.length > 0">
        <MediaItem
          v-for="item in items"
          :key="item.attachment.id"
          :attachment="item.attachment"
          :date="item.date"
          @view="handleView"
        />
      </template>

      <NoMedia v-else vertical />
    </div>

    <!--teleported so the modal's overflow and stacking don't clip it-->
    <Teleport to="body">
      <Carousel
        class="z-50!"
        :open="open"
        :items="media"
        :starting-id="startingId"
        :close-carousel="() => (open = false)"
      />
    </Teleport>
  </div>
</template>
