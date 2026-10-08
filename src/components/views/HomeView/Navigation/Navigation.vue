<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import useStore from "@src/store/store";

import {
  BellIcon,
  ChatBubbleOvalLeftIcon,
  Cog6ToothIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  UserIcon,
} from "@heroicons/vue/24/solid";
import AccountDropdown from "@src/components/views/HomeView/Navigation/AccountDropdown.vue";
import Logo from "@src/components/views/HomeView/Navigation/Logo.vue";
import NavLink from "@src/components/views/HomeView/Navigation/NavLink.vue";

const store = useStore();
const router = useRouter();

const showDropdown = ref(false);

// (event) change the active sidebar component when clicking on a NavLink
const handleActiveSidebarComponentChange = (value: string) => {
  store.activeSidebarComponent = value;
};
</script>

<template>
  <div
    class="xs:w-full md:w-14 md:h-full md:py-7 xs:py-5 px-5 md:px-3 flex xs:flex-row md:flex-col items-center bg-surface xs:border-b md:border-b-0 md:border-r border-hairline transition-all duration-500"
  >
    <!--logo-->
    <Logo />

    <!--main navigation-->
    <div class="grow">
      <nav aria-label="Main navigation">
        <ul class="xs:flex md:block xs:justify-between xs:items-center">
          <!--message button-->
          <li>
            <NavLink
              :icon="ChatBubbleOvalLeftIcon"
              title="Conversations"
              :active="store.activeSidebarComponent === 'messages'"
              @click="() => handleActiveSidebarComponentChange('messages')"
            />
          </li>

          <!--contacts list button-->
          <li>
            <NavLink
              :icon="UserIcon"
              title="Contacts"
              :active="store.activeSidebarComponent === 'contacts'"
              @click="() => handleActiveSidebarComponentChange('contacts')"
            />
          </li>

          <!--dropdown button small screen-->
          <li>
            <AccountDropdown
              id="small-profile-menu"
              class="xs:block md:hidden"
              aria-labelledby="small-profile-menu-button"
              :show-dropdown="showDropdown"
              :handle-show-dropdown="() => (showDropdown = true)"
              :handle-close-dropdown="() => (showDropdown = false)"
            />
          </li>

          <!--notifications button-->
          <li class="xs:hidden md:inline">
            <NavLink
              :icon="BellIcon"
              title="Notifications"
              :active="store.activeSidebarComponent === 'notifications'"
              @click="() => handleActiveSidebarComponentChange('notifications')"
            />
          </li>

          <!--settings button small screen-->
          <li class="xs:inline md:hidden">
            <NavLink
              :icon="Cog6ToothIcon"
              title="Settings"
              :active="store.activeSidebarComponent === 'settings'"
              @click="() => handleActiveSidebarComponentChange('settings')"
            />
          </li>
        </ul>
      </nav>
    </div>

    <!--secondary navigation-->
    <div>
      <nav aria-label="Extra navigation" class="xs:hidden md:block">
        <ul>
          <!--toggle dark mode button-->
          <li>
            <NavLink
              :icon="store.settings.darkMode ? SunIcon : MoonIcon"
              title="Night mode"
              @click="store.settings.darkMode = !store.settings.darkMode"
            />
          </li>
          <!--help button-->
          <li>
            <NavLink
              :icon="QuestionMarkCircleIcon"
              title="Help"
              @click="router.push('/help')"
            />
          </li>
          <!--settings button-->
          <li>
            <NavLink
              :icon="Cog6ToothIcon"
              title="Settings"
              :active="store.activeSidebarComponent === 'settings'"
              @click="() => handleActiveSidebarComponentChange('settings')"
            />
          </li>
        </ul>
      </nav>

      <!--separator-->
      <hr class="xs:hidden md:block mb-6 border-hairline" />

      <!--user avatar-->
      <AccountDropdown
        id="profile-menu"
        class="xs:hidden md:block"
        aria-labelledby="profile-menu-button"
        :show-dropdown="showDropdown"
        :handle-show-dropdown="() => (showDropdown = true)"
        :handle-close-dropdown="() => (showDropdown = false)"
      />
    </div>
  </div>
</template>
