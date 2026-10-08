<script setup lang="ts">
import Avatar from "@src/components/ui/data-display/Avatar.vue";
import type { IMessage } from "@src/types";

import { UserIcon } from "@heroicons/vue/24/outline";
import { getFullName, shorten } from "@src/utils";
import { formatDateTime } from "@src/api/mappers";

const props = defineProps<{
  message: IMessage;
}>();
</script>

<template>
  <button
    type="button"
    class="w-full p-5 flex outline-none hover:bg-select/50 focus:bg-select/70 active:bg-select dark:hover:bg-select/50 dark:focus:bg-select/70 dark:active:bg-select duration-200"
  >
    <!--profile image-->
    <div class="mr-4">
      <Avatar
        :src="props.message.sender.avatar"
        :name="getFullName(props.message.sender)"
        class="w-7 h-7"
      />
    </div>

    <!--name and message-->
    <div class="grow min-w-0">
      <div class="flex flex-col items-start min-w-0">
        <div class="flex items-center mb-4 min-w-0 max-w-full">
          <UserIcon
            class="w-5 h-5 mr-1.5 text-muted shrink-0"
            aria-label="user"
          />
          <p class="heading-2 text-fg truncate">
            {{ getFullName(props.message.sender) }}
          </p>
        </div>

        <p class="body-2 text-muted truncate max-w-full">
          {{ shorten(String(props.message.content ?? "")) }}
        </p>
      </div>
    </div>

    <!--message date-->
    <div class="shrink-0 ml-3">
      <p class="body-4 text-muted whitespace-pre">
        {{ formatDateTime(props.message.date) }}
      </p>
    </div>
  </button>
</template>
