// Server payloads → template view models.
import type { components } from "./schema";
import type {
  IAttachment,
  IContact,
  IConversation,
  IMessage,
  IUser,
} from "@src/types";

type ServerUser = components["schemas"]["User"];
type ServerRoom = components["schemas"]["Room"];
type ServerMessage = components["schemas"]["Message"];

// display_name "First Last" → template's firstName/lastName pair.
function splitName(displayName: string): [string, string] {
  const at = displayName.indexOf(" ");
  if (at === -1) return [displayName, ""];
  return [displayName.slice(0, at), displayName.slice(at + 1)];
}

export function mapUser(u: ServerUser): IUser {
  const [firstName, lastName] = splitName(u.display_name);
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    firstName,
    lastName,
    email: u.email ?? "",
    avatar: u.avatar_url ?? "",
    timezone: u.timezone ?? undefined,
    contacts: [],
  };
}

export function mapContact(u: ServerUser, lastSeen?: string | null): IContact {
  const [firstName, lastName] = splitName(u.display_name);
  return {
    id: u.id,
    username: u.username,
    firstName,
    lastName,
    avatar: u.avatar_url ?? "",
    email: u.email ?? "",
    lastSeen: lastSeen ? new Date(lastSeen) : new Date(0),
  };
}

export { splitName };

// Direct rooms render from the peer contact; public/private/group_direct
// render from the room row itself (no special-cased broadcast type in the fork).
export function roomViewType(r: ServerRoom): "direct" | "group" {
  return r.type === "direct" ? "direct" : "group";
}

export function mapRoom(
  r: ServerRoom,
  contacts: IContact[] = [],
  messages: IMessage[] = [],
  meId?: string,
): IConversation {
  return {
    id: r.id,
    type: roomViewType(r),
    name: r.name ?? undefined,
    avatar: r.avatar_url ?? undefined,
    // RoomMember roles arrive with the members list (stage 4); my_role
    // covers self-gating for pin/admin UI until then.
    admins: r.my_role === "admin" && meId ? [meId] : [],
    contacts,
    messages,
    unread: r.unread_count ?? 0,
    draftMessage: "",
  };
}

// ADR-009 receipts → template state string. For a message I authored the
// receipts carry the aggregate (read_at ⇒ read; delivered_at ⇒ delivered);
// for a message someone else authored they are my own (never shown).
export function receiptState(m: ServerMessage, self: boolean): string {
  if (!self || !m.receipts) {
    return "delivered";
  }
  if (m.receipts.read_at) return "read";
  if (m.receipts.delivered_at) return "delivered";
  return "sent";
}

export function mapMessage(m: ServerMessage, meId: string): IMessage {
  const self = m.author_id === meId;
  // an empty body with every attachment deleted would be a blank bubble
  if (m.deleted_at || (!m.body && !m.attachments?.length)) {
    // tombstone, same shape the message.deleted event produces
    return {
      id: m.id,
      content: "Message deleted",
      date: m.created_at,
      sender: mapAuthorStub(m.author_id),
      state: "deleted",
    };
  }
  return {
    id: m.id,
    content: m.body,
    date: m.created_at,
    // server hydrates author on room/message reads; the stub covers events
    // that arrive without one
    sender: m.author
      ? mapContact(m.author, m.author.last_seen_at ?? null)
      : mapAuthorStub(m.author_id),
    replyTo: m.reply_to_message_id ?? undefined,
    state: receiptState(m, self),
    attachments: m.attachments?.map(mapAttachment),
  };
}

export function mapAttachment(
  a: components["schemas"]["Attachment"],
): IAttachment {
  return {
    id: a.id,
    type: (a.mime_type ?? "").startsWith("image")
      ? "image"
      : (a.mime_type ?? "").startsWith("video")
        ? "video"
        : "file",
    name: a.filename,
    size: String(a.size_bytes),
    url: a.url ?? "",
    thumbnail: a.thumbnail_url ?? undefined,
  };
}

// Author stub — message payloads carry only author_id. The contacts/room
// members store fills display data; until then the ID renders.
export function mapAuthorStub(id: string): IContact {
  return {
    id,
    username: id,
    firstName: id,
    lastName: "",
    avatar: "",
    email: "",
    lastSeen: new Date(0),
  };
}

// Render helpers (viewer locale; peer timezone grouping comes later).
const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : timeFmt.format(d);
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dayFmt.format(d);
}
