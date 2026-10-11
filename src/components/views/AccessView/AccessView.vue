<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed } from "vue";

import LoginForm from "@src/components/views/AccessView/LoginForm.vue";
import SignupForm from "@src/components/views/AccessView/SignupForm.vue";
import Cover from "@src/components/views/AccessView/Cover.vue";
import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";

const route = useRoute();

const ActiveMethod = computed((): any => {
  if (route.name === "Signup") {
    return SignupForm;
  }
  if (route.params.method === "sign-in") {
    return LoginForm;
  }
  return undefined;
});
</script>

<template>
  <div class="w-full h-full">
    <div class="w-full h-full flex">
      <!--login and invite-signup forms-->
      <FadeTransition>
        <component :is="ActiveMethod" />
      </FadeTransition>
      <Cover />
    </div>
  </div>
</template>
