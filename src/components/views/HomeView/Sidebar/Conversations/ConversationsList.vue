<script setup lang="ts">
import type { IConversation } from "@src/types";
import Conversation from "./Conversation.vue";

const props = defineProps<{
  filteredConversations?: IConversation[];
}>();
</script>

<template>
  <div>
    <Conversation
      v-for="conversation in props.filteredConversations"
      :key="conversation.id"
      :conversation="conversation"
      role="listitem"
    />
  </div>
</template>
