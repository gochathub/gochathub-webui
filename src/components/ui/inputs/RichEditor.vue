<script setup lang="ts">
import { watch, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import usePrefsStore from "@src/store/prefs";
import { Harper } from "@src/spellcheck/harper";
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  LinkIcon,
  ListBulletIcon,
  NumberedListIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/vue/24/outline";

// Markdown in, markdown out. Extensions are limited to the server-validated
// subset (bold/italic/strike, code, links, quotes, lists, headings).
const props = defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{
  "update:modelValue": [string];
  send: [];
}>();

const prefs = usePrefsStore();

const editor = useEditor({
  content: props.modelValue,
  contentType: "markdown",
  extensions: [
    StarterKit.configure({
      underline: false,
      horizontalRule: false,
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true },
    }),
    Markdown,
    Placeholder.configure({ placeholder: props.placeholder }),
    Harper.configure({
      enabled: () => prefs.spellcheck,
      words: () => prefs.words,
      addWord: (w) => prefs.addWord(w),
    }),
  ],
  editorProps: {
    attributes: {
      id: "compose-input",
      "aria-label": props.placeholder ?? "Message",
      class: "rich-editor outline-hidden",
      // Harper replaces Chrome's checker (squiggles would double up); users
      // with Harper off keep native checking via the watch below
      spellcheck: prefs.spellcheck ? "false" : "true",
    },
    // Enter sends; Shift+Enter is a line break. Inside lists/code blocks plain
    // Enter keeps its native job (new item / newline); Ctrl/Cmd+Enter sends there.
    handleKeyDown: (view, e) => {
      if (e.key !== "Enter" || e.shiftKey || e.isComposing) return false;
      const { $from } = view.state.selection;
      const structural = [...Array($from.depth + 1).keys()].some((d) =>
        ["listItem", "codeBlock"].includes($from.node(d).type.name),
      );
      if (e.ctrlKey || e.metaKey || !structural) {
        emit("send");
        return true;
      }
      return false;
    },
  },
  onUpdate: ({ editor }) => emit("update:modelValue", editor.getMarkdown()),
});

// toggling the setting: swap native spellcheck and make Harper re-check
// (an empty transaction triggers the extension's update hook)
watch(
  () => prefs.spellcheck,
  (on) => {
    const ed = editor.value;
    if (!ed) return;
    ed.view.dom.setAttribute("spellcheck", on ? "false" : "true");
    ed.view.dispatch(ed.state.tr);
  },
);
// prefs arrive after the editor mounts; the watch above applies them
prefs.load().catch(() => {});

// external changes (send clears, draft restore, mention pick)
watch(
  () => props.modelValue,
  (v) => {
    const ed = editor.value;
    if (ed && v !== ed.getMarkdown()) {
      ed.commands.setContent(v, { contentType: "markdown" });
      ed.commands.focus("end");
    }
  },
);

const setLink = () => {
  const ed = editor.value;
  if (!ed) return;
  const prev = ed.getAttributes("link").href as string | undefined;
  const url = window.prompt("Link URL (http/https)", prev ?? "https://");
  if (url === null) return;
  const chain = ed.chain().focus().extendMarkRange("link");
  if (url === "") chain.unsetLink().run();
  else if (/^https?:\/\//i.test(url)) chain.setLink({ href: url }).run();
};

// insert at the caret (refocuses the editor); onUpdate emits the new markdown
defineExpose({
  insert: (text: string) =>
    editor.value?.chain().focus().insertContent(text).run(),
});

onBeforeUnmount(() => editor.value?.destroy());

const buttons = [
  {
    label: "bold",
    icon: BoldIcon,
    mark: "bold",
    run: (e: any) => e.chain().focus().toggleBold().run(),
  },
  {
    label: "italic",
    icon: ItalicIcon,
    mark: "italic",
    run: (e: any) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "strikethrough",
    icon: StrikethroughIcon,
    mark: "strike",
    run: (e: any) => e.chain().focus().toggleStrike().run(),
  },
  {
    label: "inline code",
    icon: CodeBracketIcon,
    mark: "code",
    run: (e: any) => e.chain().focus().toggleCode().run(),
  },
  {
    label: "code block",
    icon: CodeBracketSquareIcon,
    mark: "codeBlock",
    run: (e: any) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: "bullet list",
    icon: ListBulletIcon,
    mark: "bulletList",
    run: (e: any) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "numbered list",
    icon: NumberedListIcon,
    mark: "orderedList",
    run: (e: any) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "quote",
    icon: ChatBubbleBottomCenterTextIcon,
    mark: "blockquote",
    run: (e: any) => e.chain().focus().toggleBlockquote().run(),
  },
  { label: "link", icon: LinkIcon, mark: "link", run: setLink },
];
</script>

<template>
  <div
    class="rounded-sm bg-card focus-within:ring-3 focus-within:ring-indigo-100"
  >
    <div
      v-if="editor"
      class="flex gap-1 px-2 pt-2"
      role="toolbar"
      aria-label="formatting"
    >
      <button
        v-for="b in buttons"
        :key="b.label"
        type="button"
        class="ic-btn ic-btn-ghost-primary w-7 h-7"
        :class="{ 'text-indigo-500': editor.isActive(b.mark) }"
        :title="b.label"
        :aria-label="b.label"
        :aria-pressed="editor.isActive(b.mark)"
        @mousedown.prevent
        @click="b.run(editor)"
      >
        <component :is="b.icon" class="w-4 h-4" />
      </button>
    </div>
    <EditorContent
      :editor="editor"
      class="max-h-32 overflow-y-auto scrollbar-thin px-4 py-2 pr-12.5 text-sm text-fg dark:text-fg/80"
    />
  </div>
</template>

<style>
.rich-editor p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  opacity: 0.5;
}
.rich-editor ul {
  list-style: disc;
  padding-left: 1.25rem;
}
.rich-editor ol {
  list-style: decimal;
  padding-left: 1.25rem;
}
.rich-editor blockquote {
  border-left: 2px solid rgb(165 180 252);
  padding-left: 0.75rem;
}
.rich-editor .harper-spell,
.rich-editor .harper-grammar {
  text-decoration: underline wavy;
  text-underline-offset: 3px;
  cursor: pointer;
}
.rich-editor .harper-spell {
  text-decoration-color: rgb(239 68 68);
}
.rich-editor .harper-grammar {
  text-decoration-color: rgb(59 130 246);
}
.rich-editor code {
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  background: rgb(0 0 0 / 0.1);
}
.rich-editor pre {
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: rgb(0 0 0 / 0.05);
  overflow-x: auto;
}
.rich-editor pre code {
  background: none;
  padding: 0;
}
.rich-editor a {
  text-decoration: underline;
}
</style>
