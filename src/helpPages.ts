import { parsePage, type HelpPage } from "@src/help";

// lazy: one chunk per page. Kept apart from help.ts because import.meta.glob
// only exists under Vite (help.ts is unit-tested under bun).
const files = import.meta.glob("/docs/help/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const slugOf = (path: string) => path.replace(/^.*\/|\.md$/g, "");

export async function loadHelpPage(
  slug: string,
): Promise<HelpPage | undefined> {
  const load = files[`/docs/help/${slug}.md`];
  return load ? parsePage(await load()) : undefined;
}

async function buildIndex() {
  const pages = await Promise.all(
    Object.entries(files).map(async ([path, load]) => ({
      slug: slugOf(path),
      ...parsePage(await load()),
    })),
  );
  return pages.sort((a, b) => a.weight - b.weight);
}

// page list needs every title, so loads every page once per session
let index: ReturnType<typeof buildIndex> | undefined;
export const loadHelpIndex = () => (index ??= buildIndex());
