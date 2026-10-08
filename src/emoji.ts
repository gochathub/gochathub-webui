// Pure emoji helpers (no DOM, no Vue) — shared by the renderer, picker,
// composer autocomplete and the service worker.

// Flat alias -> codepoint map so the service worker doesn't bundle the whole
// picker dataset. Regenerate after editing emojis.json (a test checks sync):
//   jq -S 'reduce (.[]|.[]) as $e ({}; reduce $e.n[1:][] as $a (.; .[$a] = $e.u))' \
//     src/components/ui/inputs/EmojiPicker/emojis.json > src/shortcodes.json
import aliases from "./shortcodes.json";

const toChar = (u: string) =>
  String.fromCodePoint(...u.split("-").map((h) => parseInt(h, 16)));

const SHORTCODES = new Map<string, string>(
  Object.entries(aliases as Record<string, string>).map(([n, u]) => [
    n,
    toChar(u),
  ]),
);

// Tiptap's markdown output backslash-escapes these in plain text
export const unescapeMd = (s: string) => s.replace(/\\([\\`*_[\]~])/g, "$1");

export const lookupShortcode = (name: string) => SHORTCODES.get(name);

export const replaceShortcodes = (s: string) =>
  s.replace(
    /:((?:[a-z0-9+-]|\\?_)+):/g,
    (m, name) => SHORTCODES.get(name.replaceAll("\\", "")) ?? m,
  );

// composer autocomplete: shortcodes starting with prefix
export function findShortcodes(prefix: string, limit = 5) {
  const out: { name: string; char: string }[] = [];
  const p = prefix.replaceAll("\\", "");
  if (!p) return out;
  for (const [name, char] of SHORTCODES) {
    if (name.startsWith(p)) out.push({ name, char });
    if (out.length === limit) break;
  }
  return out;
}

const segmenter = new Intl.Segmenter();

// cut by grapheme so emoji / ZWJ sequences / flags are never split
export function truncate(s: string, max: number) {
  const parts = [...segmenter.segment(s)];
  if (parts.length <= max) return s;
  return (
    parts
      .slice(0, max)
      .map((p) => p.segment)
      .join("") + "..."
  );
}

// notification / preview text: no markdown, shortcodes resolved
export function plainText(md: string, max = 80) {
  const flat = md
    .replace(/^```\w*\s*$/gm, "")
    .replace(/\[([^\]\n]+)]\([^)\s]+\)/g, "$1")
    .replace(/^\s*(#{1,3}|>|[+-]|\d+\.)\s+/gm, "")
    .replace(/(?<!\\)(\*\*|~~|`|\*)/g, "")
    .replace(/\s*\n\s*/g, " ")
    .trim();
  return truncate(unescapeMd(replaceShortcodes(flat)), max);
}

// picker search: any alias contains the keyword
export const nameMatches = (names: string[], keyword: string) => {
  const k = keyword.toLowerCase();
  return names.some((n) => n.includes(k));
};

// skin-tone variant for an emoji, base when neutral or no such variant
export const withTone = (
  u: string,
  variants: string[] | undefined,
  tone: string,
) => (tone === "neutral" ? u : (variants?.find((v) => v.includes(tone)) ?? u));
