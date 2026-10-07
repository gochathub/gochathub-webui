<script setup lang="ts">
import { ArchiveBoxIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import useStore from "@src/store/store";

const props = defineProps<{
  open: boolean;
}>();

const store = useStore();
</script>

<template>
  <div>
    <button
      :aria-label="'toggle archived conversations'"
      class="group w-full px-5 py-4 mb-3 flex rounded focus:bg-select hover:bg-select/50 active:bg-select dark:hover:bg-select/50 dark:active:bg-select dark:focus:bg-select focus:outline-none transition duration-200 ease-out"
      :class="{
        'bg-select': props.open,
      }"
      tabindex="0"
    >
      <!--archived icon-->
      <div class="mr-4" :class="{ hidden: props.open }">
        <div
          class="w-7 h-7 flex justify-center items-center rounded-full bg-card dark:bg-gray-500 transition duration-200"
        >
          <ArchiveBoxIcon
            class="w-5 h-5 stroke-1 text-muted dark:text-white transition duration-200"
          />
        </div>
      </div>

      <!--close archive button-->
      <div
        class="w-full h-full flex justify-center items-center"
        :class="{ hidden: !props.open }"
      >
        <XMarkIcon class="w-5 h-5 mr-3 stroke-1 text-fg" />

        <p class="body-2 text-fg">Close Archive</p>
      </div>

      <div class="w-full flex flex-col" :class="{ hidden: props.open }">
        <div class="w-full">
          <!--title-->
          <div class="flex items-start">
            <div class="grow mb-4 text-start">
              <p class="heading-2 text-fg">Archived Conversations</p>
            </div>
          </div>
        </div>

        <div>
          <!--number of conversations -->
          <p class="body-2 text-muted flex justify-start items-center">
            {{ store.archivedConversations.length }}
            conversations
          </p>
        </div>
      </div>
    </button>
  </div>
</template>
