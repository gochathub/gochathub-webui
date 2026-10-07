// Monogram fallback for avatars with no image.

// White text on each of these is >= 4.5:1 (AA).
const PALETTE = [
  "#b45309",
  "#047857",
  "#0e7490",
  "#1d4ed8",
  "#6d28d9",
  "#a21caf",
  "#be123c",
  "#475569",
];

export function initials(name: string): string {
  const words = name.split(/[\s_.-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0]);
  const letters =
    words.length > 1
      ? first[0] + Array.from(words[1])[0]
      : first.slice(0, 2).join("");
  return letters.toUpperCase();
}

// Stable per name, so one person keeps one colour everywhere.
export function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length] as string;
}
