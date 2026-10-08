<script setup lang="ts">
import type { IConversation, IMessage } from "@src/types";

import { computed, ref, watch } from "vue";

import useRoomsStore from "@src/store/rooms";

import NoMessage from "@src/components/states/empty-states/NoMessage.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import MessageItem from "@src/components/shared/modals/SearchModal/MessageItem.vue";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
  conversation: IConversation;
}>();

const rooms = useRoomsStore();
const keyword = ref("");
const found = ref<IMessage[]>([]);
const results = computed(() =>
  keyword.value.trim() ? found.value : props.conversation.messages,
);

// close, then page back to the message and focus it in the thread
const handleSelect = (messageId: string) => {
  props.closeModal();
  rooms.goToMessage(props.conversation.id, messageId);
};

// debounced server search; a stale response never overwrites a newer one
let timer: ReturnType<typeof setTimeout>;
let seq = 0;
watch(keyword, (v) => {
  clearTimeout(timer);
  const q = v.trim();
  if (!q) {
    seq++;
    found.value = [];
    return;
  }
  timer = setTimeout(async () => {
    const mine = ++seq;
    try {
      const hits = await rooms.searchMessages(props.conversation.id, q);
      if (mine === seq) found.value = hits;
    } catch {
      if (mine === seq) found.value = [];
    }
  }, 250);
});
</script>

<template>
  <Modal :open="props.open" :close-modal="props.closeModal">
    <template #content>
      <div class="w-full max-w-[26rem] py-6 bg-canvas rounded">
        <!--header-->
        <div class="mb-6 px-5 flex justify-between items-center">
          <div class="flex items-center gap-1">
            <p id="modal-title" class="heading-1 text-fg" tabindex="0">
              Messages
            </p>
            <HelpLink to="/help/messages#search" label="message search" />
          </div>

          <Button
            class="outlined-danger ghost-text py-2 px-4"
            typography="body-4"
            @click="props.closeModal"
          >
            esc
          </Button>
        </div>

        <!--search-->
        <div class="mx-5 mb-5">
          <SearchInput :value="keyword" @value-changed="(v) => (keyword = v)" />
        </div>

        <!--message-->
        <div tabindex="0" class="max-h-57.5 overflow-y-scroll scrollbar-thin">
          <template v-if="results.length > 0">
            <MessageItem
              v-for="message in results"
              :key="message.id"
              :message="message"
              @click="handleSelect(message.id)"
            />
          </template>

          <NoMessage v-else vertical />
        </div>
      </div>
    </template>
  </Modal>
</template>
