import { ref } from "vue";

// null = closed. slug "" = first page.
export const helpDrawer = ref<{ slug: string; anchor?: string } | null>(null);

// to: "/help/<slug>#<heading-id>"
export function openHelp(to: string) {
  const [path, anchor] = to.split("#");
  helpDrawer.value = { slug: path!.replace(/^\/help\/?/, ""), anchor };
}

export const closeHelp = () => (helpDrawer.value = null);
