import { test, expect } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { parsePage, slugify } from "../src/help";

const dir = new URL("../docs/help/", import.meta.url).pathname;
const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
const slugs = new Set(files.map((f) => f.slice(0, -3)));

// cheap tells from the humanizer's ai-tells.md; the real pass is still manual
const banned = [
  /\bdelve\b/i,
  /\btapestry\b/i,
  /\bleverag(e|es|ing)\b/i,
  /\bseamless(ly)?\b/i,
  /\brobust\b/i,
  /\bAdditionally,/,
  /it'?s (important|worth) (to note|noting)/i,
];

test("parsePage splits TOML front matter from the body", () => {
  const p = parsePage('+++\ntitle = "Hi"\nweight = 5\n+++\n# Body\n');
  expect(p).toEqual({ title: "Hi", weight: 5, body: "# Body\n" });
});

test("parsePage rejects pages without front matter or title/weight", () => {
  expect(() => parsePage("# no front matter")).toThrow();
  expect(() => parsePage('+++\ntitle = "x"\n+++\n')).toThrow();
});

test("there is at least one help page", () => {
  expect(files.length).toBeGreaterThan(0);
});

for (const f of files) {
  test(`docs/help/${f} follows the shared Markdown subset`, () => {
    const raw = readFileSync(dir + f, "utf8");
    const { body } = parsePage(raw);
    expect(body).not.toMatch(/^\|.*\|\s*$/m); // tables
    expect(body).not.toMatch(/!\[/); // images
    expect(body).not.toMatch(/^#{4,}\s/m); // h4+
    expect(body).not.toMatch(/<[a-z]/i); // raw HTML
    expect(body).not.toMatch(
      /https?:\/\/(?!(www\.)?(example\.com|github\.com))/,
    );
    for (const m of body.matchAll(/\]\(\/help\/([^)#\s]+)/g)) {
      expect(slugs.has(m[1]!)).toBe(true);
    }
    for (const re of banned) expect(body).not.toMatch(re);
  });
}

test("slugify matches Hugo-style heading ids", () => {
  expect(slugify("Why a message may stay &quot;delivered&quot;")).toBe(
    "why-a-message-may-stay-delivered",
  );
  expect(slugify("Sign in on your phone with a QR code")).toBe(
    "sign-in-on-your-phone-with-a-qr-code",
  );
});

// every HelpLink target must be a real page + heading, so renaming a heading
// breaks CI instead of a link
function vueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? vueFiles(dir + e.name + "/")
      : e.name.endsWith(".vue")
        ? [dir + e.name]
        : [],
  );
}

test("every HelpLink points at an existing page and heading", () => {
  const src = new URL("../src/", import.meta.url).pathname;
  let found = 0;
  for (const file of vueFiles(src)) {
    for (const m of readFileSync(file, "utf8").matchAll(
      /(?:<HelpLink[^>]*?\s|\bhelp-)to="\/help\/([^"#]+)(?:#([^"]+))?"/g,
    )) {
      found++;
      const [, slug, anchor] = m;
      expect(slugs.has(slug!)).toBe(true);
      if (anchor) {
        const { body } = parsePage(readFileSync(dir + slug + ".md", "utf8"));
        const ids = [...body.matchAll(/^#{1,3}\s+(.*)$/gm)].map((h) =>
          slugify(h[1]!),
        );
        expect(ids).toContain(anchor);
      }
    }
  }
  expect(found).toBeGreaterThan(0);
});
