<script setup lang="ts">
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import {
  FaceSmileIcon,
  FireIcon,
  CakeIcon,
  FlagIcon,
  RocketLaunchIcon,
  GlobeAsiaAustraliaIcon,
  LightBulbIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps<{
  active: string;
}>();

defineEmits(["tab-change"]);
</script>

<template>
  <div class="flex justify-between">
    <!--people-->
    <div
      class="pb-[.3125rem] border-b transition-colors duration-200"
      :class="[
        props.active === 'people'
          ? 'border-accent rounded-1'
          : 'border-transparent',
      ]"
    >
      <IconButton
        title="people and smiles"
        aria-label="people and smiles"
        @click="$emit('tab-change', 'people')"
      >
        <FaceSmileIcon
          class="w-5 h-5 transition-colors duration-200"
          :class="[
            props.active === 'people'
              ? ['text-accent dark:text-indigo-400']
              : ['text-muted'],
          ]"
        />
      </IconButton>
    </div>

    <!--nature-->
    <div
      class="pb-[.3125rem] border-b transition-colors duration-200"
      :class="[
        props.active === 'nature'
          ? 'border-accent rounded-1'
          : 'border-transparent',
      ]"
    >
      <IconButton
        title="nature"
        aria-label="nature"
        @click="$emit('tab-change', 'nature')"
      >
        <FireIcon
          class="w-5 h-5 transition-colors duration-200"
          :class="[
            props.active === 'nature'
              ? ['text-accent dark:text-indigo-400']
              : ['text-muted'],
          ]"
        />
      </IconButton>
    </div>

    <!--food-->
    <div
      class="pb-[.3125rem] border-b transition-colors duration-200"
      :class="[
        props.active === 'food'
          ? 'border-accent rounded-1'
          : 'border-transparent',
      ]"
    >
      <IconButton
        title="food"
        aria-label="food"
        @click="$emit('tab-change', 'food')"
      >
        <CakeIcon
          class="w-5 h-5 transition-colors duration-200"
          :class="[
            props.active === 'food'
              ? ['text-accent dark:text-indigo-400']
              : ['text-muted'],
          ]"
        />
      </IconButton>
    </div>

    <!--activity-->
    <div
      class="pb-[.3125rem] border-b transition-colors duration-200"
      :class="[
        props.active === 'activity'
          ? 'border-accent rounded-1'
          : 'border-transparent',
      ]"
    >
      <IconButton
        title="activities and sports"
        aria-label="activities and sports"
        @click="$emit('tab-change', 'activity')"
      >
        <RocketLaunchIcon
          class="w-5 h-5 transition-colors duration-200"
          :class="[
            props.active === 'activity'
              ? ['text-accent dark:text-indigo-400']
              : ['text-muted'],
          ]"
        />
      </IconButton>
    </div>

    <!--objects-->
    <div
      class="pb-[.3125rem] border-b transition-colors duration-200"
      :class="[
        props.active === 'objects'
          ? 'border-accent rounded-1'
          : 'border-transparent',
      ]"
    >
      <IconButton @click="$emit('tab-change', 'objects')">
        <LightBulbIcon
          class="w-5 h-5 transition-colors duration-200"
          :class="[
            props.active === 'objects'
              ? ['text-accent dark:text-indigo-400']
              : ['text-muted'],
          ]"
        />
      </IconButton>
    </div>

    <!--travel-->
    <div
      class="pb-[.3125rem] border-b transition-colors duration-200"
      :class="[
        props.active === 'travel'
          ? 'border-accent rounded-1'
          : 'border-transparent',
      ]"
    >
      <IconButton
        title="travel"
        aria-label="travel"
        @click="$emit('tab-change', 'travel')"
      >
        <GlobeAsiaAustraliaIcon
          class="w-5 h-5 transition-colors duration-200"
          :class="[
            props.active === 'travel'
              ? ['text-accent dark:text-indigo-400']
              : ['text-muted'],
          ]"
        />
      </IconButton>
    </div>

    <!--flags-->
    <div
      class="pb-[.3125rem] border-b transition-colors duration-200"
      :class="[
        props.active === 'flags'
          ? 'border-accent rounded-1'
          : 'border-transparent',
      ]"
    >
      <IconButton
        title="flags"
        aria-label="flags"
        @click="$emit('tab-change', 'flags')"
      >
        <FlagIcon
          class="w-5 h-5 transition-colors duration-200"
          :class="[
            props.active === 'flags'
              ? ['text-accent dark:text-indigo-400']
              : ['text-muted'],
          ]"
        />
      </IconButton>
    </div>
  </div>
</template>
