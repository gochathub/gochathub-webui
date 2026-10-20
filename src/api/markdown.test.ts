import { expect, test } from "bun:test";

import { renderMarkdown } from "./markdown";

const A = (u: string) =>
  `<a class="underline" href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`;

test("bare URL becomes a link, trailing punctuation excluded", () => {
  expect(renderMarkdown("see https://example.com/a?x=1&y=2.")).toBe(
    `<p>see ${A("https://example.com/a?x=1&amp;y=2")}.</p>`,
  );
  expect(renderMarkdown("(https://example.com)")).toContain(
    `(${A("https://example.com")})`,
  );
});

test("URLs in code spans and markdown links are left alone", () => {
  expect(renderMarkdown("`https://example.com`")).not.toContain("<a ");
  const md = renderMarkdown("[https://a.com](https://a.com)");
  expect(md.match(/<a /g)).toHaveLength(1);
});
