// Grammar + spelling for the compose editor via Harper (wasm, runs locally in
// a worker). harper.js is lazy-loaded on first check, so users with the
// feature off never download the ~16 MB wasm.
import { Extension } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import type { Lint, WorkerLinter } from "harper.js";

export interface HarperConfig {
  enabled: () => boolean;
  words: () => string[];
  addWord: (word: string) => void;
}

type Found = { lint: Lint; source: string };

const key = new PluginKey<DecorationSet>("harper");
const DEBOUNCE_MS = 400;
// mentions, :emoji: aliases and bare URLs are not prose; blank them (same
// length, so offsets stay valid)
const NOT_PROSE = /@[\w-]+|:\w+:|https?:\/\/\S+/g;

let linterP: Promise<WorkerLinter> | undefined;
let failed = false;
const sentWords = new Set<string>();

function getLinter() {
  return (linterP ??= (async () => {
    const [{ WorkerLinter, Dialect }, { binary }] = await Promise.all([
      import("harper.js"),
      import("harper.js/binary"),
    ]);
    const l = new WorkerLinter({ binary, dialect: Dialect.American });
    await l.setup();
    return l;
  })());
}

// one string per textblock; code/link text blanked, code blocks skipped.
// Text offsets equal ProseMirror offsets inside the block (1 char = 1 pos).
function blocks(doc: Node) {
  const out: { from: number; text: string }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "codeBlock") return false;
    if (!node.isTextblock) return true;
    let text = "";
    node.forEach((child) => {
      if (!child.isText) text += "\n";
      else if (child.marks.some((m) => ["code", "link"].includes(m.type.name)))
        text += " ".repeat(child.nodeSize);
      else text += child.text;
    });
    out.push({
      from: pos + 1,
      text: text.replace(NOT_PROSE, (m) => " ".repeat(m.length)),
    });
    return false;
  });
  return out;
}

async function lintDoc(doc: Node, cfg: HarperConfig) {
  const linter = await getLinter();
  // ponytail: words are only ever added to Harper, never removed, until reload
  const fresh = cfg.words().filter((w) => !sentWords.has(w));
  if (fresh.length) {
    await linter.importWords(fresh);
    fresh.forEach((w) => sentWords.add(w));
  }
  const decos: Decoration[] = [];
  for (const b of blocks(doc)) {
    if (!b.text.trim()) continue;
    // Harper spans count code points; ProseMirror counts UTF-16 units
    const cps = Array.from(b.text);
    const u16 = (i: number) => cps.slice(0, i).join("").length;
    for (const lint of await linter.lint(b.text, { language: "plaintext" })) {
      const s = lint.span();
      decos.push(
        Decoration.inline(
          b.from + u16(s.start),
          b.from + u16(s.end),
          {
            class:
              lint.lint_kind() === "Spelling"
                ? "harper-spell"
                : "harper-grammar",
          },
          { lint, source: b.text } satisfies Found,
        ),
      );
    }
  }
  return decos;
}

function harperPlugin(cfg: HarperConfig) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastEnabled = false;
  let menu: HTMLElement | undefined;

  const closeMenu = () => {
    menu?.remove();
    menu = undefined;
    document.removeEventListener("mousedown", onOutside, true);
    document.removeEventListener("keydown", onKey, true);
  };
  const onOutside = (e: Event) => {
    if (menu && !menu.contains(e.target as globalThis.Node)) closeMenu();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeMenu();
  };

  const run = async (view: EditorView) => {
    const doc = view.state.doc;
    let decos: Decoration[] = [];
    if (cfg.enabled() && !failed) {
      try {
        decos = await lintDoc(doc, cfg);
      } catch (e) {
        failed = true; // wasm blocked/unsupported: stop trying this session
        console.warn("harper unavailable", e);
      }
    }
    // doc moved on while linting; the next debounce re-lints
    if (view.isDestroyed || view.state.doc !== doc) return;
    view.dispatch(view.state.tr.setMeta(key, DecorationSet.create(doc, decos)));
  };
  const schedule = (view: EditorView) => {
    clearTimeout(timer);
    timer = setTimeout(() => run(view), DEBOUNCE_MS);
  };

  const showMenu = (view: EditorView, dec: Decoration) => {
    closeMenu();
    const { lint, source } = dec.spec as Found;
    const { from, to } = dec;
    const el = (menu = document.createElement("div"));
    el.setAttribute("role", "menu");
    el.className =
      "fixed z-50 w-64 rounded-sm bg-card p-2 text-sm text-fg shadow-lg";
    const msg = document.createElement("p");
    msg.className = "mb-2 text-muted";
    msg.textContent = lint.message();
    el.append(msg);
    const item = (label: string, fn: () => void) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.className =
        "block w-full rounded-sm px-2 py-1 text-left hover:bg-accent-soft dark:hover:bg-white/10";
      b.textContent = label;
      b.onmousedown = (e) => e.preventDefault();
      b.onclick = () => {
        closeMenu();
        fn();
        view.focus();
      };
      el.append(b);
    };
    const edit = (text: string | null, a = from, b = to) =>
      view.dispatch(
        text === null
          ? view.state.tr.delete(a, b)
          : view.state.tr.insertText(text, a, b),
      );
    for (const s of lint.suggestions().slice(0, 3)) {
      const text = s.get_replacement_text();
      const kind = s.kind(); // 0 replace, 1 remove, 2 insert after
      if (kind === 1) item("Remove", () => edit(null));
      else if (kind === 2) item(`Insert "${text}"`, () => edit(text, to, to));
      else item(text, () => edit(text));
    }
    if (lint.lint_kind() === "Spelling")
      item("Add to dictionary", () =>
        cfg.addWord(view.state.doc.textBetween(from, to)),
      );
    item("Ignore", () => {
      getLinter().then((l) => l.ignoreLint(source, lint));
    });
    document.body.append(el);
    const c = view.coordsAtPos(from);
    el.style.left = `${Math.min(c.left, innerWidth - el.offsetWidth - 8)}px`;
    // the composer sits at the bottom of the screen: open upward
    el.style.top = `${Math.max(8, c.top - el.offsetHeight - 4)}px`;
    document.addEventListener("mousedown", onOutside, true);
    document.addEventListener("keydown", onKey, true);
    // Add/Ignore change what Harper reports without touching the doc
    el.addEventListener("click", () => schedule(view));
  };

  return new Plugin<DecorationSet>({
    key,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, prev) => {
        const next = tr.getMeta(key) as DecorationSet | undefined;
        return next ?? prev.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations: (s) => key.getState(s),
      handleClick: (view, pos) => {
        const dec = key.getState(view.state)?.find(pos, pos)[0];
        if (dec) showMenu(view, dec);
        return false;
      },
    },
    view: (view) => {
      if (cfg.enabled()) schedule(view);
      lastEnabled = cfg.enabled();
      return {
        update: (v, prev) => {
          const on = cfg.enabled();
          if (!v.state.doc.eq(prev.doc) || on !== lastEnabled) schedule(v);
          lastEnabled = on;
        },
        destroy: () => {
          clearTimeout(timer);
          closeMenu();
        },
      };
    },
  });
}

export const Harper = Extension.create<HarperConfig>({
  name: "harper",
  addProseMirrorPlugins() {
    return [harperPlugin(this.options)];
  },
});
