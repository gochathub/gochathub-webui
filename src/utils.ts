import useStore from "@src/store/store";
import type { IContact, IConversation, IMessage, IRecording } from "@src/types";
import { useRoute } from "vue-router";
import { formatDateTime } from "@src/api/mappers";
import { truncate } from "@src/emoji";

/**
 * combine first name and last name of a contact.
 * @param contact
 * @returns A string the combines the first and last names.
 */
export const getFullName = (contact: IContact, hyphen?: boolean) => {
  if (hyphen) {
    return contact.firstName + "-" + contact.lastName;
  } else {
    return contact.firstName + " " + contact.lastName;
  }
};

/**
 * get the other contact that is not the authenticated user.
 * @param conversation
 * @returns A contact object representing the other user in the conversation.
 */
export const getOddContact = (conversation: IConversation) => {
  const store = useStore();

  let oddContact;

  for (const contact of conversation.contacts) {
    if (store.user && contact.id !== store.user.id) {
      oddContact = contact;
    }
  }

  return oddContact;
};

/**
 * get avatar based on conversation type.
 * @param conversation
 * @returns A string representing the url to the avatar image
 */
export const getAvatar = (conversation: IConversation) => {
  if (["group", "broadcast"].includes(conversation.type)) {
    return conversation?.avatar;
  } else {
    const oddContact = getOddContact(conversation);
    return oddContact?.avatar;
  }
};

/**
 * get name based on conversation type.
 * @param conversation
 * @returns String
 */
export const getName = (conversation: IConversation, hyphen?: boolean) => {
  if (["group", "broadcast"].includes(conversation.type)) {
    if (hyphen) {
      return (conversation.name as string).split(" ").join("-");
    } else {
      return conversation.name;
    }
  } else {
    const oddContact = getOddContact(conversation);
    if (oddContact) {
      return getFullName(oddContact, hyphen);
    }
  }
};

// Human presence line for a peer's last-seen stamp. A zero/epoch timestamp
// means presence is unknown or opted out (ADR-013) — show nothing.
export const presence = (lastSeen?: Date | null): string => {
  if (!lastSeen || lastSeen.getTime() === 0) {
    return "";
  }
  const minutes = (Date.now() - lastSeen.getTime()) / 60000;
  if (minutes < 2) {
    return "Active now";
  }
  return `Last seen ${formatDateTime(lastSeen)}`;
};

/**
 * trim a string when it reaches a certain length and adds three dots
 * at the end.
 * @param text
 * @param maxLength
 * @returns A string that is trimmed according the length provided
 */
export const shorten = (message: IMessage | string, maxLength: number = 23) => {
  let text: string | IRecording | undefined;

  if (typeof message === "string") {
    text = message;
  } else {
    text = message.content;
  }

  if (text && typeof text === "string") {
    return truncate(text, maxLength);
  }

  return "";
};

/**
 * test if the message contains attachments
 * @param message
 * @returns A boolean indicating whether the message has attachments
 */
export const hasAttachments = (message: IMessage) => {
  const attachments = message.attachments;
  return attachments && attachments.length > 0;
};

/**
 * extract the id of the active conversation from the route; pass the route
 * from component scope (useRoute() outside setup lacks the injection context).
 */
export const getActiveConversationId = (
  route: { params: { id?: string | string[] } } | undefined,
) => {
  const id = route?.params.id;
  return id ? String(id) : undefined;
};

/**
 * get index of the conversation inside the conversations array
 * @param conversationId
 * @returns A number indicating the index of the conversation.
 */
export const getConversationIndex = (
  conversationId: string,
): number | undefined => {
  let conversationIndex;
  const store = useStore();

  store.conversations.forEach((conversation, index) => {
    if (conversation.id === conversationId) {
      conversationIndex = index;
    }
  });

  return conversationIndex;
};

export const getMessageById = (
  conversation: IConversation,
  messageId?: string,
) => {
  if (messageId) {
    return conversation.messages.find((message) => message.id === messageId);
  }
};

/**
 * Convert unicode to native emoji
 *
 * @param unicode - emoji unicode
 */
export const unicodeToEmoji = (unicode: string) => {
  return unicode
    .split("-")
    .map((hex) => parseInt(hex, 16))
    .map((hex) => String.fromCodePoint(hex))
    .join("");
};

/**
 * can this user delete the room? Room admins (mapRoom puts only my own id in
 * `admins`) and server admins — the server accepts both (DELETE /rooms/{id}).
 */
export const canDeleteRoom = (
  conversation: IConversation,
  user?: { id: string; role: string },
) =>
  Boolean(
    user && (user.role === "admin" || conversation.admins?.includes(user.id)),
  );
