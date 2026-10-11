// Grouping rules for the flat (classic) message list: a message stacks under
// the previous one's header when it is the same sender, the same local day,
// and within STACK_WINDOW_MS of it. A new local day always starts a day pill.
export const STACK_WINDOW_MS = 5 * 60 * 1000;

interface Groupable {
  date: string;
  sender: { id: string };
}

export interface GroupInfo {
  /** first message of a local calendar day (or of the list): render a day pill */
  newDay: boolean;
  /** render without avatar/name; the time shows on hover */
  stacked: boolean;
}

export function groupMessages(messages: Groupable[]): GroupInfo[] {
  return messages.map((m, i) => {
    const prev = messages[i - 1];
    if (!prev) return { newDay: true, stacked: false };
    const a = new Date(prev.date);
    const b = new Date(m.date);
    const newDay = a.toDateString() !== b.toDateString();
    const stacked =
      !newDay &&
      prev.sender.id === m.sender.id &&
      b.getTime() - a.getTime() <= STACK_WINDOW_MS;
    return { newDay, stacked };
  });
}
