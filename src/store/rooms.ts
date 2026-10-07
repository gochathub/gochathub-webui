// Rooms + messages integration: REST is authoritative, WS delivers changes
// (WEBSOCKETS.md reliability model — reconnect refetches, no replay).
import { defineStore } from "pinia";
import { ref } from "vue";

import client, { unwrap } from "@src/api/client";
import useStore from "@src/store/store";
import useAuthStore from "@src/store/auth";
import useInvitesStore from "@src/store/invites";
import useContactsStore from "@src/store/contacts";
import {
  mapAuthorStub,
  mapContact,
  mapMessage,
  mapRoom,
  receiptState,
} from "@src/api/mappers";
import type { IContact, IConversation, IMessage } from "@src/types";
import type { components } from "@src/api/schema";
import type { WSEnvelope } from "@src/ws/client";
import ws from "@src/ws/client";

type ServerRoom = components["schemas"]["Room"];
type ServerMessage = components["schemas"]["Message"];

export const useRoomsStore = defineStore("rooms", () => {
  const chat = useStore();
  const auth = useAuthStore();

  const loadingMessages = ref(false);
  // oldest cursor per room — next page of older history
  const olderCursor = ref<Record<string, string | undefined>>({});
  // user ids currently typing per room (ephemeral)
  const typingUsers = ref<Record<string, string[]>>({});

  // --- helpers -----------------------------------------------------------

  function convById(id: string): IConversation | undefined {
    return (
      chat.conversations.find((c) => c.id === id) ??
      chat.archivedConversations.find((c) => c.id === id)
    );
  }

  function patchRoom(id: string, patch: Partial<IConversation>) {
    for (const list of [chat.conversations, chat.archivedConversations]) {
      const conv = list.find((c) => c.id === id);
      if (conv) Object.assign(conv, patch);
    }
  }

  function serverMessage(m: ServerMessage): IMessage {
    return mapMessage(m, auth.me?.id ?? "");
  }

  // newest page first on the wire; the UI renders oldest-first
  function insertMessages(
    conv: IConversation,
    page: ServerMessage[],
    prepend: boolean,
  ) {
    const mapped = [...page].reverse().map(serverMessage);
    for (const msg of mapped) {
      const existing = conv.messages.findIndex((m) => m.id === msg.id);
      if (existing >= 0) conv.messages[existing] = msg;
      else if (prepend) conv.messages.unshift(msg);
      else conv.messages.push(msg);
    }
  }

  // (event) create a room: direct (one co-member) or group_direct (named).
  async function createRoom(
    type: "direct" | "group_direct",
    members: string[],
    name?: string,
  ) {
    const room = await unwrap(
      await client.POST("/rooms", {
        body: { type, name: name ?? null, members },
      }),
    );
    await loadRooms();
    return room.id;
  }

  // open a room from the UI: switch subscriptions, load or reload messages,
  // mark the newest as read.
  async function openRoom(roomId: string) {
    const prev = chat.conversationOpen;
    if (prev && prev !== roomId) ws.unsubscribeAll();
    chat.conversationOpen = roomId;
    ws.subscribe(roomId);
    await loadMessages(roomId);
  }

  // --- REST --------------------------------------------------------------

  async function loadRooms() {
    if (!auth.me) return;
    const rooms = (await unwrap(await client.GET("/rooms"))) as ServerRoom[];
    const active: IConversation[] = [];
    const archived: IConversation[] = [];

    for (const r of rooms) {
      const conv = convById(r.id);
      const view = conv ?? mapRoom(r, [], [], auth.me.id);
      view.unread = r.unread_count ?? 0;
      view.type = mapRoom(r, [], [], auth.me.id).type;
      view.name = r.name ?? undefined;
      if (r.archived) archived.push(view);
      else active.push(view);
    }

    // direct rooms render the peer's display name/avatar (members endpoint)
    for (const conv of active.concat(archived)) {
      // ponytail: one members call per direct room; rooms are capped by
      // deployment size — batch/hydrate server-side if this ever sprawls.
      if (conv.type === "direct" && conv.contacts.length === 0) {
        try {
          const members = (await unwrap(
            await client.GET("/rooms/{roomId}/members", {
              params: { path: { roomId: conv.id } },
            }),
          )) as components["schemas"]["User"][];
          conv.contacts = members
            .filter((m) => m.id !== auth.me?.id)
            .map((u) => mapContact(u, u.last_seen_at ?? null));
        } catch {
          conv.contacts = [];
        }
      }
    }

    chat.conversations = active;
    chat.archivedConversations = archived;
    chat.status = "success";
  }

  async function loadMessages(roomId: string) {
    loadingMessages.value = true;
    try {
      const page = await unwrap(
        await client.GET("/rooms/{roomId}/messages", {
          params: { query: { limit: 50 }, path: { roomId } },
        }),
      );
      const conv = convById(roomId);
      if (!conv) return;
      conv.messages = [];
      insertMessages(conv, page.items, false);
      olderCursor.value[roomId] = page.next_cursor ?? undefined;

      await resyncMembers(roomId);

      // delivered receipts for this page + read cursor for the newest
      const received = page.items
        .filter((m) => m.author_id !== auth.me?.id)
        .map((m) => m.id);
      ws.ack(received);
      if (page.items.length > 0) {
        ws.read(roomId, page.items[0].id);
        conv.unread = 0;
      }
    } finally {
      loadingMessages.value = false;
    }
  }

  async function loadOlderMessages(roomId: string) {
    const cursor = olderCursor.value[roomId];
    if (!cursor) return;
    const page = await unwrap(
      await client.GET("/rooms/{roomId}/messages", {
        params: { query: { limit: 50, before: cursor }, path: { roomId } },
      }),
    );
    const conv = convById(roomId);
    if (!conv) return;
    insertMessages(conv, page.items, true);
    olderCursor.value[roomId] = page.next_cursor ?? undefined;
  }

  async function resyncMembers(roomId: string) {
    const conv = convById(roomId);
    if (!conv || !auth.me) return;
    // ponytail: full members refetch on membership events — deltas would be
    // premature without real-time member lists in the room payload.
    try {
      const members = (await unwrap(
        await client.GET("/rooms/{roomId}/members", {
          params: { path: { roomId } },
        }),
      )) as components["schemas"]["User"][];
      conv.contacts = members
        .filter((m) => m.id !== auth.me?.id)
        .map((u) => mapContact(u, u.last_seen_at ?? null));
    } catch {
      // not a member anymore — leave as-is
    }
  }

  async function sendMessage(
    body: string,
    roomId: string,
    replyTo?: string,
    attachmentIds: string[] = [],
  ) {
    const result = await client.POST("/rooms/{roomId}/messages", {
      params: { path: { roomId } },
      body: {
        body,
        format: "markdown",
        reply_to_message_id: replyTo ?? null,
        attachment_ids: attachmentIds,
      },
    });
    const msg = serverMessage(await unwrap(result));
    const conv = convById(roomId);
    if (conv && !conv.messages.some((m) => m.id === msg.id)) {
      conv.messages.push(msg);
    }
    conv?.replyMessage && (conv.replyMessage = undefined);
    return msg;
  }

  // (event) a room left its lists for good (creator deleted, member left):
  // forget it and close it if it is open.
  function dropConversation(roomId: string) {
    chat.conversations = chat.conversations.filter((c) => c.id !== roomId);
    chat.archivedConversations = chat.archivedConversations.filter(
      (c) => c.id !== roomId,
    );
    if (chat.conversationOpen === roomId) {
      ws.unsubscribeAll();
      chat.conversationOpen = undefined;
    }
  }

  // (event) delete a group (room admin — the creator): server soft-deletes
  // via archived_at and broadcasts room.archived.
  async function deleteRoom(roomId: string) {
    await unwrap(
      await client.DELETE("/rooms/{roomId}", {
        params: { path: { roomId } },
      }),
    );
    dropConversation(roomId);
  }

  // (event) leave a group (self-remove).
  async function leaveRoom(roomId: string) {
    await unwrap(
      await client.DELETE("/rooms/{roomId}/members/{userId}", {
        params: { path: { roomId, userId: auth.me!.id } },
      }),
    );
    dropConversation(roomId);
  }

  // --- WS ----------------------------------------------------------------

  async function handleEvent(raw: WSEnvelope) {
    const roomId = raw.room_id ?? "";
    const data = (raw.data ?? {}) as Record<string, any>;

    switch (raw.type) {
      case "connected":
        // server acked the upgrade; initial subscribe happens per room open
        break;

      case "message.created": {
        const msg = data.message as ServerMessage | undefined;
        if (!msg) return;
        const conv = convById(roomId);
        if (conv) {
          if (!conv.messages.some((m) => m.id === msg.id)) {
            conv.messages.push(serverMessage(msg));
          }
        } else {
          pushNotification(
            "message",
            "New room activity",
            `A message arrived in a room that is not loaded (event ${raw.id ?? ""}).`,
          );
        }
        ws.ack([msg.id]);
        if (conv && msg.author_id !== auth.me?.id) {
          conv.unread = (conv.unread ?? 0) + 1;
          // opening state tracks the newest message; keep the cursor fresh
          if (chat.conversationOpen === roomId) {
            ws.read(roomId, msg.id);
            conv.unread = 0;
          } else if (
            document.hidden &&
            chat.settings.allowNotifications &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const who = msg.author?.display_name ?? "New message";
            const title =
              conv.type === "group" ? `${conv.name ?? "Room"} — ${who}` : who;
            const body = msg.body.slice(0, 80);
            try {
              new Notification(title, { body });
            } catch {
              // notifications can throw on some platforms; delivery is best effort
            }
          }
        }
        break;
      }

      case "message.updated": {
        const msg = data.message as ServerMessage | undefined;
        const conv = convById(roomId);
        const existing = conv?.messages.find((m) => m.id === msg?.id);
        if (conv && msg && existing) {
          const idx = conv.messages.indexOf(existing);
          conv.messages[idx] = serverMessage(msg);
        }
        break;
      }

      case "message.deleted": {
        const msg = data.message as ServerMessage | undefined;
        if (!msg) return;
        const conv = convById(roomId);
        const existing = conv?.messages.find((m) => m.id === msg.id);
        if (conv && existing) {
          existing.content = "Message deleted";
          existing.state = "deleted";
          existing.attachments = undefined;
          existing.sender = mapAuthorStub(existing.sender.id);
        }
        break;
      }

      case "message.receipts_changed": {
        const messageId = data.message_id as string | undefined;
        const conv = convById(roomId);
        const existing = conv?.messages.find((m) => m.id === messageId);
        if (
          !conv ||
          !messageId ||
          !existing ||
          existing.sender.id !== auth.me?.id
        )
          return;
        const fresh = await unwrap(
          await client.GET("/messages/{messageId}", {
            params: { path: { messageId } },
          }),
        );
        existing.state = receiptState(fresh, true);
        break;
      }

      case "message.reaction_added":
      case "message.reaction_removed":
        // reactions render from the message payload (stage 4)
        break;

      case "room.pinned_changed": {
        const conv = convById(roomId);
        if (!conv) return;
        void (data.pinned_message_id as string | null); // stage 4: fetch pinned message body
        break;
      }

      case "room.read_state_changed":
        // receipts refresh covers display; no local bookkeeping needed
        break;

      case "room.archived": {
        // group (soft-)deleted by its creator: it vanishes for everyone
        dropConversation(roomId);
        break;
      }

      case "room.member_added":
        await resyncMembers(roomId);
        break;

      case "room.member_removed":
        if (data.user_id === auth.me?.id) {
          // we left — same handling as the delete
          dropConversation(roomId);
        } else {
          await resyncMembers(roomId);
        }
        break;

      case "typing.started":
      case "typing.stopped": {
        const started = raw.type === "typing.started";
        const who = (data.user_id as string) ?? "";
        if (!who) return;
        const list = new Set(typingUsers.value[roomId] ?? []);
        if (started) list.add(who);
        else list.delete(who);
        typingUsers.value = { ...typingUsers.value, [roomId]: [...list] };
        break;
      }

      case "presence.changed": {
        // peer went online/offline: refresh the contact's last-seen stamp
        const userId = (data.user_id as string) ?? "";
        const state = (data.state as string) ?? "";
        if (!userId) return;
        const stamp = state === "online" ? new Date() : new Date(0);
        for (const list of [chat.conversations, chat.archivedConversations]) {
          for (const conv of list) {
            const peer = conv.contacts.find((c) => c.id === userId);
            if (peer) peer.lastSeen = stamp;
          }
        }
        break;
      }

      case "invite.created": {
        await useInvitesStore().loadInvites();
        pushNotification(
          "added-to-group",
          "New invitation",
          (data.room_name as string) ?? "You have a new room invitation",
        );
        break;
      }

      case "invite.accepted":
      case "invite.revoked":
        // sidebar notifications stage 4
        break;

      case "contact.added":
      case "contact.removed":
      case "contact.updated": {
        const contacts = useContactsStore();
        if (raw.type !== "contact.updated") {
          await contacts.loadContacts();
        }
        if (raw.type === "contact.added") {
          pushNotification(
            "account-update",
            "New contact",
            "Someone added you as a contact",
          );
        }
        break;
      }

      default:
        break;
    }
  }

  function pushNotification(flag: string, title: string, message: string) {
    chat.notifications = [...chat.notifications, { flag, title, message }];
  }

  // reconnect resync: REST reauthoritative, then re-subscribe
  async function resync() {
    await loadRooms();
    if (chat.conversationOpen) {
      await loadMessages(chat.conversationOpen);
      ws.subscribe(chat.conversationOpen);
    }
  }

  function setDraft(draft: string, roomId: string) {
    patchRoom(roomId, { draftMessage: draft });
  }

  return {
    loadingMessages,
    olderCursor,
    typingUsers,
    loadRooms,
    loadMessages,
    loadOlderMessages,
    resyncMembers,
    sendMessage,
    openRoom,
    createRoom,
    deleteRoom,
    leaveRoom,
    setDraft,
    handleEvent,
    resync,
    convById,
  };
});
export default useRoomsStore;
