<script setup lang="ts">
import Avatar from "@src/components/ui/data-display/Avatar.vue";
import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import { useRouter } from "vue-router";

import {
  ArrowLeftOnRectangleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";
import Dropdown from "@src/components/ui/navigation/Dropdown/Dropdown.vue";
import DropdownLink from "@src/components/ui/navigation/Dropdown/DropdownLink.vue";

const props = defineProps<{
  showDropdown: boolean;
  handleCloseDropdown: () => void;
  handleShowDropdown: () => void;
  id: string;
}>();

const store = useStore();
const auth = useAuthStore();
const router = useRouter();

// (event) close dropdown menu when clicking outside
// The toggle button (either layout's instance) and its children are "inside".
const handleCloseOnClickOutside = (event: Event) => {
  if (
    !(event.target as HTMLElement).closest('[aria-controls="profile-menu"]')
  ) {
    props.handleCloseDropdown();
  }
};

// profile info & password change live in the settings sidebar (Account
// section carries the display-name form and the change-password form).
const handleOpenAccountSettings = () => {
  store.activeSidebarComponent = "settings";
  props.handleCloseDropdown();
};

// (event) log out: server clears the session cookie, socket stops via the
// App watcher on auth.me.
const handleLogout = async () => {
  props.handleCloseDropdown();
  await auth.logout();
  store.user = undefined;
  store.status = "idle";
  await router.push({ name: "Access", params: { method: "sign-in" } });
};
</script>

<template>
  <div class="relative">
    <!--toggle dropdown button-->
    <button
      :id="props.id + '-button'"
      class="bg-white rounded-full active:scale-110 focus:outline-none focus:scale-110 transition duration-200 ease-out"
      :style="{
        'box-shadow': !store.settings.darkMode
          ? '0 .125rem .3125rem rgba(193, 202, 255, 0.5),.125rem 0 .3125rem rgba(193, 202, 255, 0.5),-0.125rem 0 .3125rem rgba(193, 202, 255, 0.5),0 -0.125rem .3125rem rgba(193, 202, 255, 0.5)'
          : '0 .125rem .3125rem rgba(0, 70, 128, 0.5),.125rem 0 .3125rem rgba(0, 70, 128, 0.5),-0.125rem 0 .3125rem rgba(0, 70, 128, 0.5),0 -0.125rem .3125rem rgba(0, 70, 128, 0.5)',
      }"
      :aria-expanded="showDropdown"
      aria-controls="profile-menu"
      aria-label="toggle profile menu"
      @click="handleShowDropdown"
    >
      <Avatar
        id="user-avatar"
        :src="store.user?.avatar"
        :name="`${store.user?.firstName ?? ''} ${store.user?.lastName ?? ''}`"
        class="w-7 h-7"
      />
    </button>

    <!--dropdown menu-->
    <Dropdown
      :id="props.id + '-dropdown'"
      :aria-labelledby="props.id + '-button'"
      :show="props.showDropdown"
      :position="[
        'md:bottom-0',
        'md:left-8',
        'md:top-auto',
        'bottom-12.5',
        'left-[-4.8125rem]',
      ]"
      :handle-click-outside="handleCloseOnClickOutside"
      :close-dropdown="props.handleCloseDropdown"
    >
      <button
        class="dropdown-link dropdown-link-primary"
        aria-label="Show profile information"
        role="menuitem"
        @click="handleOpenAccountSettings"
      >
        <InformationCircleIcon class="h-5 w-5 mr-3 text-muted" />
        Profile Information
      </button>

      <button
        class="dropdown-link dropdown-link-primary"
        aria-label="change password"
        role="menuitem"
        @click="handleOpenAccountSettings"
      >
        <ArrowPathIcon class="h-5 w-5 mr-3 text-muted" />
        Password Change
      </button>

      <button
        class="dropdown-link dropdown-link-danger"
        aria-label="logout"
        role="menuitem"
        @click="handleLogout"
      >
        <ArrowLeftOnRectangleIcon class="h-5 w-5 mr-3" />
        Logout
      </button>
    </Dropdown>
  </div>
</template>
