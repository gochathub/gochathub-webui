<script setup lang="ts">
import Avatar from "@src/components/ui/data-display/Avatar.vue";
import type { IContactGroup } from "@src/types";
import type { Ref } from "vue";

import { computed, ref } from "vue";

import { getFullName, presence } from "@src/utils";

import {
  EllipsisVerticalIcon,
  InformationCircleIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import Dropdown from "@src/components/ui/navigation/Dropdown/Dropdown.vue";
import DropdownLink from "@src/components/ui/navigation/Dropdown/DropdownLink.vue";

const props = defineProps<{
  contactGroups?: IContactGroup[];
  bottomEdge?: number;
}>();

// letter headings only earn their width in a long roster
const showLetters = computed(
  () =>
    (props.contactGroups ?? []).reduce((n, g) => n + g.contacts.length, 0) >=
    12,
);

// the position of the dropdown menu.
const dropdownMenuPosition = ref(["top-6", "right-0"]);

// open-dropdown state keyed by contact id — safe across contact-list reloads
const dropdownMenuStates: Ref<Record<string, boolean>> = ref({});

// close all contact dropdown menus
const handleCloseAllMenus = () => {
  dropdownMenuStates.value = {};
};

// (event) open/close the selected dropdown menu.
const handleToggleDropdown = (event: Event, contactId: string) => {
  if (props.bottomEdge) {
    const buttonBottom = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect().bottom;

    if (buttonBottom >= props.bottomEdge - 75) {
      dropdownMenuPosition.value = ["bottom-6", "right-0"];
    } else {
      dropdownMenuPosition.value = ["top-6", "right-0"];
    }
  }

  const next = !dropdownMenuStates.value[contactId];
  handleCloseAllMenus();
  dropdownMenuStates.value[contactId] = next;
};

// (event) close dropdown menu when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  const parentElement = target.parentElement as HTMLElement;

  if (
    target &&
    !target.classList.contains("open-menu") &&
    !(parentElement && parentElement.classList.contains("open-menu"))
  ) {
    handleCloseAllMenus();
  }
};
</script>

<template>
  <div v-for="group in props.contactGroups" :key="group.letter">
    <!--group title-->
    <p v-if="showLetters" class="heading-3 text-muted w-full px-5 pb-3 pt-5">
      {{ group.letter }}
    </p>

    <!--contacts-->
    <div v-for="contact in group.contacts" :key="contact.id">
      <div class="w-full p-5 flex justify-between items-center">
        <button
          class="flex items-center min-w-0 transition-all duration-200 ease-out"
          :aria-label="getFullName(contact)"
        >
          <Avatar
            :src="contact.avatar"
            :name="getFullName(contact)"
            class="w-[2.25rem] h-[2.25rem] mr-4"
          />

          <div class="flex flex-col items-start min-w-0">
            <!--contact name-->
            <p class="heading-2 text-fg truncate">
              {{ getFullName(contact) }}
            </p>

            <!--presence-->
            <p
              v-if="presence(contact.lastSeen)"
              class="body-3 text-muted truncate"
            >
              {{ presence(contact.lastSeen) }}
            </p>
          </div>
        </button>

        <!--dropdown menu-->
        <div class="relative shrink-0">
          <!--dropdown menu button-->
          <IconButton
            :id="'open-contact-menu-' + contact.id"
            class="open-menu w-6 h-6"
            :aria-expanded="
              (dropdownMenuStates as Record<string, boolean>)[contact.id] ===
              true
            "
            :aria-controls="'contact-menu-' + contact.id"
            title="toggle contact menu"
            aria-label="toggle contact menu"
            @click="
              (event: MouseEvent) => handleToggleDropdown(event, contact.id)
            "
          >
            <EllipsisVerticalIcon class="open-menu h-5 w-5" tabindex="0" />
          </IconButton>

          <Dropdown
            :id="'contact-menu-' + contact.id"
            :close-dropdown="handleCloseAllMenus"
            :handle-click-outside="handleClickOutside"
            :aria-labelledby="'open-contact-menu-' + contact.id"
            :show="
              (dropdownMenuStates as Record<string, boolean>)[contact.id] ===
              true
            "
            :position="dropdownMenuPosition"
          >
            <button
              class="dropdown-link dropdown-link-primary"
              aria-label="Show profile information"
              role="menuitem"
            >
              <InformationCircleIcon class="h-5 w-5 mr-3 text-muted" />
              Personal information
            </button>

            <button
              class="dropdown-link dropdown-link-danger"
              aria-label="Delete contact"
              role="menuitem"
            >
              <TrashIcon class="h-5 w-5 mr-3" />
              Delete contact
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  </div>
</template>
