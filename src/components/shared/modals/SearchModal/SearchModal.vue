<script setup lang="ts">
import type { IConversation } from "@src/types";

import NoMessage from "@src/components/states/empty-states/NoMessage.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import MessageItem from "@src/components/shared/modals/SearchModal/MessageItem.vue";
import ScrollBox from "@src/components/ui/utils/ScrollBox.vue";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
  conversation: IConversation;
}>();
</script>

<template>
  <Modal :open="props.open" :close-modal="props.closeModal">
    <template #content>
      <div class="w-full max-w-[26rem] py-6 bg-canvas rounded">
        <!--header-->
        <div class="mb-6 px-5 flex justify-between items-center">
          <p id="modal-title" class="heading-1 text-fg" tabindex="0">
            Messages
          </p>

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
          <SearchInput />
        </div>

        <!--message-->
        <ScrollBox class="max-h-57.5 overflow-y-scroll">
          <template v-if="props.conversation.messages.length > 0">
            <MessageItem
              v-for="(message, index) in props.conversation.messages"
              :key="index"
              :message="message"
            />
          </template>

          <NoMessage v-else vertical />
        </ScrollBox>
      </div>
    </template>
  </Modal>
</template>
