<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from "vue";
import type { Ref } from "vue";
import { useRouter } from "vue-router";

import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import { useRoomSort } from "@src/composables/useRoomSort";
import type { RoomSort } from "@src/composables/useRoomSort";

import {
  BarsArrowDownIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import AccountDropdown from "@src/components/views/HomeView/Navigation/AccountDropdown.vue";

defineEmits<{ create: [] }>();

const store = useStore();
const auth = useAuthStore();
const router = useRouter();
const sort = useRoomSort();
const filter = inject("roomFilter") as Ref<string>;

const showAccount = ref(false);
const showSort = ref(false);
const searchEl = ref<HTMLInputElement>();

const go = (section: string) => (store.activeSidebarComponent = section);

const sortOptions: { value: RoomSort; label: string }[] = [
  { value: "activity", label: "Recent activity" },
  { value: "name", label: "Name" },
];

// Ctrl+K focuses the room search
const onKey = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    go("messages");
    searchEl.value?.focus();
  }
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <header
    class="h-14 px-4 flex items-center gap-4 bg-surface border-b border-hairline shrink-0"
  >
    <nav aria-label="Main navigation" class="flex items-center gap-1">
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="Home"
        aria-label="Home"
        :class="{
          'text-accent-text': store.activeSidebarComponent === 'messages',
        }"
        @click="go('messages')"
      >
        <HomeIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="Directory"
        aria-label="Directory"
        :class="{
          'text-accent-text': store.activeSidebarComponent === 'contacts',
        }"
        @click="go('contacts')"
      >
        <UserGroupIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
      <div class="relative">
        <IconButton
          class="ic-btn-ghost-primary w-7 h-7"
          title="Sort rooms"
          aria-label="Sort rooms"
          :aria-expanded="showSort"
          @click="showSort = !showSort"
        >
          <BarsArrowDownIcon class="w-[1.25rem] h-[1.25rem]" />
        </IconButton>
        <div
          v-if="showSort"
          class="absolute left-0 top-full mt-2 z-20 w-44 py-1 rounded-xl bg-canvas shadow-lg border border-hairline"
          role="menu"
          @mouseleave="showSort = false"
        >
          <button
            v-for="o in sortOptions"
            :key="o.value"
            role="menuitemradio"
            :aria-checked="sort === o.value"
            class="w-full text-left px-4 py-2 body-2 hover:bg-select/60"
            :class="sort === o.value ? 'text-accent-text' : 'text-fg'"
            @click="
              sort = o.value;
              showSort = false;
            "
          >
            {{ o.label }}
          </button>
        </div>
      </div>
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="Create new"
        aria-label="Create new"
        @click="$emit('create')"
      >
        <PlusIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
    </nav>

    <div
      class="grow flex items-center justify-center gap-2 min-w-0 xs:hidden md:flex"
    >
      <label
        class="w-full max-w-[48rem] h-9 px-3 flex items-center rounded border border-hairline bg-canvas text-muted focus-within:border-accent"
      >
        <input
          ref="searchEl"
          v-model="filter"
          type="search"
          name="room-filter"
          autocomplete="off"
          placeholder="Search rooms (Ctrl+K)"
          aria-label="Search rooms"
          class="grow min-w-0 bg-transparent outline-none body-2 text-fg"
          @focus="go('messages')"
        />
        <MagnifyingGlassIcon class="w-5 h-5 shrink-0" />
      </label>
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="Back"
        aria-label="Back"
        @click="router.back()"
      >
        <ChevronLeftIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="Forward"
        aria-label="Forward"
        @click="router.forward()"
      >
        <ChevronRightIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
    </div>

    <div class="flex items-center gap-1 xs:ml-auto md:ml-0">
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="Notifications"
        aria-label="Notifications"
        :class="{
          'text-accent-text': store.activeSidebarComponent === 'notifications',
        }"
        @click="go('notifications')"
      >
        <BellIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
      <IconButton
        v-if="auth.me?.role === 'admin'"
        class="ic-btn-ghost-primary w-7 h-7"
        title="Admin"
        aria-label="Admin"
        @click="router.push('/admin')"
      >
        <ShieldCheckIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        title="Settings"
        aria-label="Settings"
        :class="{
          'text-accent-text': store.activeSidebarComponent === 'settings',
        }"
        @click="go('settings')"
      >
        <Cog6ToothIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
      <AccountDropdown
        id="profile-menu"
        aria-labelledby="profile-menu-button"
        :show-dropdown="showAccount"
        :handle-show-dropdown="() => (showAccount = true)"
        :handle-close-dropdown="() => (showAccount = false)"
      />
    </div>
  </header>
</template>
