<script setup lang="ts">
import type { IAttachment, IMessage } from "@src/types";

import useStore from "@src/store/store";
import { getFullName, hasAttachments, shorten } from "@src/utils";

const props = defineProps<{
  message: IMessage;
  self?: boolean;
}>();

const store = useStore();
</script>

<template>
  <div
    v-if="props.message"
    class="border-l-2 pl-3 cursor-pointer outline-none duration-200"
    :class="['border-fg/50']"
    tabindex="0"
    :aria-label="'reply to: ' + getFullName(props.message.sender)"
  >
    <!--name-->
    <p
      class="mb-3 font-semibold text-xs leading-4 tracking-[.01rem] text-muted"
    >
      {{
        store.user && message.sender.id !== store.user.id
          ? getFullName(props.message.sender)
          : "You"
      }}
    </p>

    <!--content-->
    <p
      v-if="props.message.type !== 'recording' && props.message.content"
      class="body-2 text-muted"
    >
      {{ shorten(props.message, 60) }}
    </p>

    <!--attachments title-->
    <p v-else-if="hasAttachments(props.message)" class="body-2 text-muted">
      {{ (props.message?.attachments as IAttachment[])[0].name }}
    </p>

    <!--recording title-->
    <p v-else-if="props.message.type === 'recording'" class="body-2 text-muted">
      recording 23s
    </p>
  </div>
</template>
