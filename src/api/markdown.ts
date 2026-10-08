// Markdown renderer over the server-validated subset: bold, italic, strike,
// inline + fenced code, links, quotes, lists, headings, @mentions.
// HTML in the source is escaped first — every tag in the output is ours.

import { slugify } from "../help";
import { lookupShortcode } from "../emoji";

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c]!);
}

function safeUrl(url: string): string | null {
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return url;
  return null;
}

const PARKED = "\\`*_[]~";
const PARK = [...PARKED].map((_c, i) => String.fromCharCode(0xe010 + i));

// inline formatting on already-escaped text
function inline(s: string, doc = false): string {
  let out = s;

  // fenced/inline code first: contents stay literal
  out = out.replace(
    /(?<!\\)`([^`\n]+)`/g,
    (_m, code) =>
      `<code class="px-1 rounded bg-black/10 dark:bg-white/10">${code}</code>`,
  );

  // Tiptap backslash-escapes _ * [ ] ~ ` \ in text: park them as private-use
  // chars so no pass below treats them as syntax; restored at the end
  out = out.replace(
    /(<code[^>]*>.*?<\/code>)|\\([\\`*_[\]~])/g,
    (m, code, ch) => code ?? PARK[PARKED.indexOf(ch)],
  );

  // links [text](url)
  out = out.replace(
    /\[([^\]\n]+)]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g,
    (_m, text, url) =>
      doc && url.startsWith("/")
        ? `<a class="underline" href="${url}">${text}</a>`
        : `<a class="underline" href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`,
  );

  // mentions @username
  out = out.replace(
    /(^|[\s(])@([a-zA-Z0-9_-]+)/g,
    (_m, pre, name) =>
      `${pre}<span class="font-semibold" data-mention="${name}">@${name}</span>`,
  );

  // emphasis passes: bold, italic, strike (non-nested, single pass each)
  out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

  // shortcodes last; skip code spans and tag attributes
  out = out.replace(
    /(<code[^>]*>.*?<\/code>|<[^>]*>)|:([a-z0-9+\-]+):/g,
    (m, skip, name) => skip ?? lookupShortcode(name.replaceAll("", "_")) ?? m,
  );

  return out.replace(/[-]/g, (c) => PARKED[c.charCodeAt(0) - 0xe010]!);
}

// doc: help pages keep heading levels and open /paths in the same tab
export function renderMarkdown(
  src: string,
  { doc = false }: { doc?: boolean } = {},
): string {
  const lines = esc(src).split("\n");
  const html: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listBuf: string[] | null = null;
  let listTag = "ul";

  function flushList() {
    if (listBuf) {
      html.push(
        `<${listTag} class="pl-5 list-disc">${listBuf.join("")}</${listTag}>`,
      );
      listBuf = null;
    }
  }

  for (const line of lines) {
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      if (inCode) {
        html.push(
          `<pre class="p-2 rounded bg-black/5 dark:bg-white/10 overflow-x-auto"><code>${codeBuf.join("\n")}</code></pre>`,
        );
        codeBuf = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const quote = line.match(/^&gt;\s?(.*)$/);
    const ulItem = line.match(/^\s*[+-]\s+(.*)$/);
    const olItem = line.match(/^\s*\d+\.\s+(.*)$/);

    if (ulItem) {
      if (listTag !== "ul") flushList();
      listTag = "ul";
      listBuf = listBuf ?? [];
      listBuf.push(`<li>${inline(ulItem[1]!, doc)}</li>`);
    } else if (olItem) {
      if (listTag !== "ol") flushList();
      listTag = "ol";
      listBuf = listBuf ?? [];
      listBuf.push(`<li>${inline(olItem[1]!, doc)}</li>`);
    } else {
      flushList();
      if (heading) {
        const n = doc ? heading[1]!.length : 3;
        const cls =
          doc && n < 3
            ? `${n === 1 ? "text-2xl" : "text-xl"} font-semibold text-fg mt-6 mb-3`
            : "font-semibold mt-2";
        const id = doc ? ` id="${slugify(heading[2]!)}"` : "";
        html.push(
          `<h${n}${id} class="${cls}">${inline(heading[2]!, doc)}</h${n}>`,
        );
      } else if (quote) {
        html.push(
          `<blockquote class="border-l-2 border-indigo-300 pl-3">${inline(quote[1]!, doc)}</blockquote>`,
        );
      } else if (line.trim() === "") {
        html.push("");
      } else {
        html.push("<p>" + inline(line, doc) + "</p>");
      }
    }
  }
  if (inCode) {
    html.push(
      `<pre class="p-2 rounded bg-black/5 dark:bg-white/10 overflow-x-auto"><code>${codeBuf.join("\n")}</code></pre>`,
    );
  }
  flushList();
  return html.filter(Boolean).join("\n");
}
