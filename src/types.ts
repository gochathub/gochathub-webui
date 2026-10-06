// Server-mapped view types. IDs are opaque strings (server-issued UUIDs);
// dates are ISO strings parsed for display only, never compared for order.

export interface IUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  timezone?: string | null;
  contacts: IContact[];
}

export interface IContact {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  email: string;
  lastSeen: Date;
}

export interface IAttachment {
  id: string;
  type: string;
  name: string;
  size: string;
  url: string;
  thumbnail?: string;
  file?: File;
}

export interface IRecording {
  id: string;
  size: string;
  src: string;
  duration: string;
  file?: File;
}

export interface IMessage {
  id: string;
  type?: string;
  content?: string | IRecording;
  date: string;
  sender: IContact;
  replyTo?: string;
  attachments?: IAttachment[];
  state: string;
}

export interface IConversation {
  id: string;
  type: string;
  name?: string;
  avatar?: string;
  admins?: string[];
  contacts: IContact[];
  messages: IMessage[];
  pinnedMessage?: IMessage;
  pinnedMessageHidden?: boolean;
  replyMessage?: IMessage;
  unread?: number;
  draftMessage: string;
}

export interface IContactGroup {
  letter: string;
  contacts: IContact[];
}

export interface INotification {
  flag: string;
  title: string;
  message: string;
}

export interface ISettings {
  lastSeen: boolean;
  readReceipt: boolean;
  joiningGroups: boolean;
  privateMessages: boolean;
  darkMode: boolean;
  allowNotifications: boolean;
  keepNotifications: boolean;
}

export interface IEmoji {
  n: string[];
  u: string;
  r?: string;
  v?: string[];
}
