<script setup lang="ts">
import { computed } from "vue";

import useStore from "@src/store/store";
import { useRoute } from "vue-router";

import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";
import Navigation from "@src/components/views/HomeView/Navigation/Navigation.vue";
import Sidebar from "@src/components/views/HomeView/Sidebar/Sidebar.vue";
import { getActiveConversationId } from "@src/utils";

const store = useStore();
const route = useRoute();
const activeConversationId = computed(() => getActiveConversationId(route));
</script>

<template>
  <KeepAlive>
    <div
      class="xs:relative md:static h-full flex xs:flex-col md:flex-row overflow-hidden"
    >
      <!--navigation-bar-->
      <Navigation class="xs:order-1 md:order-none" />
      <!--sidebar-->
      <Sidebar
        class="xs:grow-1 md:grow-0 xs:overflow-y-scroll md:overflow-visible scrollbar-thin"
      />
      <!--chat-->
      <div
        id="mainContent"
        class="xs:absolute xs:z-10 md:static grow h-full xs:w-full md:w-fit scrollbar-thin bg-canvas transition-all duration-500"
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
  </KeepAlive>
</template>
