<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed } from "vue";

import LoginForm from "@src/components/views/AccessView/LoginForm.vue";
import Cover from "@src/components/views/AccessView/Cover.vue";
import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";

const route = useRoute();

const ActiveMethod = computed((): any => {
  if (route.params.method === "sign-in") {
    return LoginForm;
  }
  return undefined;
});
</script>

<template>
  <div class="w-full h-full">
    <div class="w-full h-full flex dark:bg-gray-800">
      <!--login and register forms-->
      <FadeTransition>
        <component :is="ActiveMethod" />
      </FadeTransition>
      <Cover />
    </div>
  </div>
</template>
