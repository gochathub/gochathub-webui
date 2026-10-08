// Help page = Markdown with minimal TOML front matter (title, weight). Same
// files are meant to be readable by Hugo, so keep the format boring.

export interface HelpPage {
  title: string;
  weight: number;
  body: string;
}

export function parsePage(raw: string): HelpPage {
  const m = raw.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("help page: missing +++ front matter");
  const fm: Record<string, string> = {};
  for (const line of m[1]!.split(/\r?\n/)) {
    const kv = line.match(/^(\w+)\s*=\s*(?:"(.*)"|(\d+))\s*$/);
    if (kv) fm[kv[1]!] = kv[2] ?? kv[3]!;
  }
  if (!fm.title || fm.weight === undefined) {
    throw new Error("help page: front matter needs title and weight");
  }
  return { title: fm.title, weight: Number(fm.weight), body: m[2]! };
}
