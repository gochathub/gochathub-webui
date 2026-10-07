<script setup lang="ts">
import type { IMessage } from "@src/types";

import { getFullName, shorten } from "@src/utils";
import { formatTime } from "@src/api/mappers";

const props = defineProps<{
  message: IMessage;
}>();
</script>

<template>
  <button
    class="w-full p-5 flex outline-none hover:bg-select/50 focus:bg-select/70 active:bg-select dark:hover:bg-select/50 dark:focus:bg-select/70 dark:active:bg-select duration-200"
  >
    <!--profile image-->
    <div class="mr-4">
      <div
        :style="{ backgroundImage: `url(${props.message.sender.avatar})` }"
        class="w-7 h-7 rounded-full bg-cover bg-center"
      ></div>
    </div>

    <!--name and message-->
    <div class="grow min-w-0">
      <div class="flex flex-col items-start min-w-0">
        <p class="heading-2 text-fg mb-4 truncate max-w-full">
          {{ getFullName(props.message.sender) }}
        </p>

        <p class="body-2 text-muted truncate max-w-full">
          {{ shorten(String(props.message.content ?? "")) }}
        </p>
      </div>
    </div>

    <!--message date-->
    <div class="shrink-0 ml-3">
      <p class="body-4 text-muted whitespace-pre">
        {{ formatTime(props.message.date) }}
      </p>
    </div>
  </button>
</template>
