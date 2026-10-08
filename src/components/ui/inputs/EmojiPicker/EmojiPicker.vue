<script setup lang="ts">
import { ref } from "vue";
import Emojis from "@src/components/ui/inputs/EmojiPicker/Emojis.vue";
import EmojiSkinTones from "@src/components/ui/inputs/EmojiPicker/EmojiSkinTones.vue";
import EmojiTabs from "@src/components/ui/inputs/EmojiPicker/EmojiTabs.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";

const props = defineProps<{
  show?: boolean;
}>();
const emit = defineEmits<{ pick: [string] }>();

// selected emoji groups
const activeTab = ref("people");

// search keyword
const keyword = ref("");

// (event) changes the selected emoji  group
const handleActiveTabChange = (tab: string) => {
  activeTab.value = tab;
};
</script>

<template>
  <div
    v-if="props.show"
    class="w-75 p-5 rounded-2xl border shadow-xl bg-canvas border-hairline"
  >
    <!--Tabs-->
    <EmojiTabs
      class="w-full mb-5"
      :active="activeTab"
      @tab-change="handleActiveTabChange"
    />

    <!--Search-->
    <SearchInput v-model="keyword" class="w-full mb-5 rounded-[.75rem]" />

    <!--Emojis-->
    <Emojis
      :keyword="keyword"
      :active-tab="activeTab"
      class="w-full mb-5"
      @pick="emit('pick', $event)"
    />

    <!--Skin tones-->
    <EmojiSkinTones class="w-full" />
  </div>
</template>
