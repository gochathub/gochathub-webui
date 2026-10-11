<script setup lang="ts">
import { computed, provide, ref } from "vue";
import { useRoute } from "vue-router";

import { getActiveConversationId } from "@src/utils";

import ClassicSidebar from "@src/components/classic/ClassicSidebar.vue";
import ClassicTopBar from "@src/components/classic/ClassicTopBar.vue";
import ComposeModal from "@src/components/shared/modals/ComposeModal/ComposeModal.vue";
import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";

const route = useRoute();
const activeConversationId = computed(() => getActiveConversationId(route));

// top-bar search box filters the room list
provide("roomFilter", ref(""));

const composeOpen = ref(false);
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <ClassicTopBar @create="composeOpen = true" />
    <div class="grow min-h-0 xs:relative md:static flex">
      <ClassicSidebar />
      <div
        id="mainContent"
        class="xs:absolute xs:z-10 md:static grow min-w-0 h-full xs:w-full bg-canvas transition-all duration-500"
        :class="
          activeConversationId
            ? ['xs:-left-[0rem]', 'xs:static']
            : ['xs:left-250']
        "
        role="region"
      >
        <router-view v-slot="{ Component }">
          <FadeTransition name="fade" mode="out-in">
            <component :is="Component" :key="activeConversationId" />
          </FadeTransition>
        </router-view>
      </div>
    </div>
    <ComposeModal
      :open="composeOpen"
      :close-modal="() => (composeOpen = false)"
    />
  </div>
</template>
