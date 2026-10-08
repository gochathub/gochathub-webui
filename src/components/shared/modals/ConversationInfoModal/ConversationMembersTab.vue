<script setup lang="ts">
import type { IContact, IConversation } from "@src/types";
import type { Ref } from "vue";

import { computed, ref, watch } from "vue";

import { mapContact } from "@src/api/mappers";
import useContactsStore from "@src/store/contacts";
import useRoomsStore from "@src/store/rooms";
import useStore from "@src/store/store";
import { canDeleteRoom, getFullName } from "@src/utils";

import { EllipsisVerticalIcon, UserPlusIcon } from "@heroicons/vue/24/outline";
import { ArrowUturnLeftIcon } from "@heroicons/vue/24/solid";
import ContactItem from "@src/components/shared/blocks/ContactItem.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import HelpLink from "@src/components/shared/HelpLink.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";
import Dropdown from "@src/components/ui/navigation/Dropdown/Dropdown.vue";

const props = defineProps<{
  closeModal: () => void;
  conversation: IConversation;
}>();

defineEmits(["active-page-change"]);

const store = useStore();
const rooms = useRoomsStore();

// html container of the contacts list
const contactContainer: Ref<HTMLElement | undefined> = ref();

const keyword = ref("");
// false: current members; true: pick one of my contacts to add
const adding = ref(false);

// room admins and server admins manage members (the server enforces it too)
const canManage = computed(() => canDeleteRoom(props.conversation, store.user));

// me first, then everyone else (the members endpoint list excludes me here)
const members = computed<IContact[]>(() => {
  const me = store.user;
  const self = me ? [{ ...me, lastSeen: new Date() } as IContact] : [];
  return [...self, ...props.conversation.contacts];
});

const isAdmin = (id: string) =>
  Boolean(props.conversation.admins?.includes(id));

const matches = (c: IContact) =>
  getFullName(c).toLowerCase().includes(keyword.value.toLowerCase());

const shown = computed(() => members.value.filter(matches));

// typing searches every user (debounced); empty shows my contacts
const contactsStore = useContactsStore();
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(keyword, (q) => {
  if (!adding.value) return;
  clearTimeout(searchTimer);
  contactsStore.searchResults = [];
  searchTimer = setTimeout(
    () => contactsStore.searchUsers(q).catch(() => {}),
    200,
  );
});

// candidates that are not in the group yet
const addable = computed(() => {
  const inRoom = new Set(members.value.map((c) => c.id));
  const list = keyword.value
    ? contactsStore.searchResults.map((u) =>
        mapContact(u, u.last_seen_at ?? null),
      )
    : (store.user?.contacts ?? []);
  return list.filter((c) => !inRoom.has(c.id));
});

// the member whose dropdown is open
const openMenu = ref<string>();
const dropdownMenuPosition = ref(["top-6", "right-0"]);

// (event) open/close the dropdown menu
const handleToggleDropdown = (event: Event, id: string) => {
  if (contactContainer.value) {
    const buttonBottom = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect().bottom;
    const containerBottom =
      contactContainer.value.getBoundingClientRect().bottom;
    dropdownMenuPosition.value =
      buttonBottom >= containerBottom - 50
        ? ["bottom-6", "right-0"]
        : ["top-6", "right-0"];
  }
  openMenu.value = openMenu.value === id ? undefined : id;
};

// (event) close dropdown menu when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (
    target.parentElement &&
    !target.classList.contains("open-menu") &&
    !target.parentElement.classList.contains("open-menu")
  ) {
    openMenu.value = undefined;
  }
};

// failed member changes surface through the sidebar notifications
const run = async (action: () => Promise<unknown>, message: string) => {
  openMenu.value = undefined;
  try {
    await action();
  } catch {
    store.notifications = [
      ...store.notifications,
      { flag: "account-update", title: "Something went wrong", message },
    ];
  }
};

const roomId = () => props.conversation.id;

const handleSetRole = (c: IContact, role: "admin" | "member") =>
  run(
    () => rooms.setMemberRole(roomId(), c.id, role),
    // last admin cannot be demoted — the server answers 409
    "Could not change the role. A group needs at least one admin.",
  );

const handleRemove = (c: IContact) => {
  if (!window.confirm(`Remove ${getFullName(c)} from the group?`)) return;
  return run(
    () => rooms.removeMember(roomId(), c.id),
    "Could not remove the member.",
  );
};

const handleAdd = async (c: IContact) => {
  await run(() => rooms.addMember(roomId(), c.id), "Could not add the member.");
  adding.value = false;
  keyword.value = "";
};
</script>

<template>
  <div>
    <!--header-->
    <div class="flex justify-between items-center mb-6 px-5">
      <div class="flex items-center gap-1">
        <p id="modal-title" class="heading-1 text-fg">
          {{ adding ? "Add members" : "Members" }}
        </p>
        <HelpLink to="/help/rooms#roles" label="group roles" />
      </div>

      <div class="flex items-center">
        <!--add members-->
        <IconButton
          v-if="canManage && !adding"
          title="add members"
          aria-label="add members"
          class="ic-btn-ghost-primary w-7 h-7 mr-3"
          @click="((keyword = ''), (adding = true))"
        >
          <UserPlusIcon class="w-5 h-5" />
        </IconButton>

        <!--return button-->
        <IconButton
          class="ic-btn-outlined-danger p-2"
          @click="
            adding
              ? ((adding = false), (keyword = ''))
              : $emit('active-page-change', {
                  tabName: 'conversation-info',
                  animationName: 'slide-right',
                })
          "
        >
          <ArrowUturnLeftIcon class="w-5 h-5" />
        </IconButton>
      </div>
    </div>

    <!--search-->
    <div class="mb-5 mx-5">
      <SearchInput :value="keyword" @value-changed="(v) => (keyword = v)" />
    </div>

    <!--pick a contact to add-->
    <div
      v-if="adding"
      tabindex="0"
      class="max-h-58 overflow-y-scroll scrollbar-thin"
    >
      <ContactItem
        v-for="contact in addable"
        :key="contact.id"
        :contact="contact"
        @contact-selected="handleAdd"
      />
      <p v-if="addable.length === 0" class="px-5 body-2 text-muted">
        No contacts to add.
      </p>
    </div>

    <!--members-->
    <div v-else ref="contactContainer">
      <div tabindex="0" class="max-h-58 overflow-y-scroll scrollbar-thin">
        <ContactItem
          v-for="contact in shown"
          :key="contact.id"
          variant="card"
          :contact="contact"
        >
          <template
            v-if="isAdmin(contact.id) || contact.id === store.user?.id"
            #tag
          >
            <div class="ml-3 flex">
              <p
                v-if="contact.id === store.user?.id"
                class="body-4 text-muted mr-2"
              >
                you
              </p>
              <p v-if="isAdmin(contact.id)" class="body-4 text-indigo-400">
                admin
              </p>
            </div>
          </template>

          <template v-if="canManage && contact.id !== store.user?.id" #menu>
            <div>
              <!--dropdown menu button-->
              <IconButton
                title="menu"
                class="open-menu w-6 h-6"
                @click="
                  (event: MouseEvent) => handleToggleDropdown(event, contact.id)
                "
              >
                <EllipsisVerticalIcon class="open-menu h-5 w-5" tabindex="0" />
              </IconButton>

              <!--dropdown menu-->
              <Dropdown
                :close-dropdown="() => (openMenu = undefined)"
                :handle-click-outside="handleClickOutside"
                :show="openMenu === contact.id"
                :position="dropdownMenuPosition"
              >
                <button
                  v-if="!isAdmin(contact.id)"
                  class="dropdown-link dropdown-link-primary"
                  aria-label="give admin permissions"
                  role="menuitem"
                  @click="handleSetRole(contact, 'admin')"
                >
                  Promote to admin
                </button>
                <button
                  v-else
                  class="dropdown-link dropdown-link-primary"
                  aria-label="remove admin permissions"
                  role="menuitem"
                  @click="handleSetRole(contact, 'member')"
                >
                  Demote to member
                </button>
                <button
                  class="dropdown-link dropdown-link-danger"
                  aria-label="remove from group"
                  role="menuitem"
                  @click="handleRemove(contact)"
                >
                  Remove from group
                </button>
              </Dropdown>
            </div>
          </template>
        </ContactItem>
      </div>
    </div>
  </div>
</template>
