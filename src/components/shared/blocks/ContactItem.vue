<script setup lang="ts">
import Avatar from "@src/components/ui/data-display/Avatar.vue";
import type { IContact } from "@src/types";

import useStore from "@src/store/store";
import { getFullName, presence } from "@src/utils";

defineEmits(["contactSelected"]);

const props = defineProps<{
  contact: IContact;
  variant?: string;
  active?: boolean;
  unselectable?: boolean;
}>();

const store = useStore();
</script>

<template>
  <div>
    <component
      :is="props.variant === 'card' ? 'div' : 'button'"
      class="w-full p-5 flex transition duration-200 ease-out outline-none"
      :class="{
        'hover:bg-select/50 active:bg-select focus:bg-select':
          props.variant !== 'card',
        'bg-select': props.active,
      }"
      @click="
        props.variant === 'card'
          ? () => {}
          : $emit('contactSelected', props.contact)
      "
    >
      <!--profile image-->
      <div class="mr-4">
        <Avatar
          :src="props.contact.avatar"
          :name="getFullName(props.contact)"
          class="w-7 h-7"
        />
      </div>

      <div class="w-full flex flex-col items-start">
        <div class="w-full mb-3 flex justify-between items-center">
          <!--contact name-->
          <component
            :is="props.variant === 'card' && !props.unselectable ? 'a' : 'div'"
            href="#"
            class="flex items-center"
            @click="
              props.variant === 'card'
                ? $emit('contactSelected', props.contact)
                : () => {}
            "
          >
            <p class="heading-2 text-fg">
              {{
                store.user && store.user.id === props.contact.id
                  ? "You"
                  : getFullName(props.contact)
              }}
            </p>

            <slot name="tag" />
          </component>

          <!--optional menu-->
          <div class="relative">
            <slot name="menu" />
          </div>
        </div>

        <!--contact last seen-->
        <p v-if="presence(props.contact.lastSeen)" class="body-2 text-muted">
          {{ presence(props.contact.lastSeen) }}
        </p>
      </div>

      <!--optional checkbox-->
      <div class="h-full flex flex-col justify-center items-center">
        <slot name="checkbox"></slot>
      </div>
    </component>
  </div>
</template>
