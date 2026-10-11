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
    <!--small screens: room list, or the open room (no top bar), never both-->
    <ClassicTopBar
      :class="{ 'xs:hidden md:flex': activeConversationId }"
      @create="composeOpen = true"
    />
    <div class="grow min-h-0 flex">
      <ClassicSidebar :class="{ 'xs:hidden md:flex': activeConversationId }" />
      <div
        id="mainContent"
        class="grow min-w-0 h-full xs:w-full bg-canvas"
        :class="{ 'xs:hidden md:block': !activeConversationId }"
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
