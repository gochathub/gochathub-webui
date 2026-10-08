import { test, expect } from "bun:test";
import { renderMarkdown } from "../src/api/markdown";

test("escapes HTML before any formatting", () => {
  const out = renderMarkdown("<img src=x onerror=alert(1)> **hi**");
  expect(out).not.toContain("<img");
  expect(out).toContain("&lt;img");
  expect(out).toContain("<strong>hi</strong>");
});

test("renders subset: heading, list, mention, link, code, quote, strike, italic", () => {
  const out = renderMarkdown(
    [
      "## Title",
      "- item one",
      "1. item two",
      "> quoted",
      "`code` ~~gone~~ *soft* @brian [go](https://example.com)",
    ].join("\n"),
  );
  expect(out).toContain("Title");
  expect(out).toContain("<ul");
  expect(out).toContain("<ol");
  expect(out).toContain("<blockquote");
  expect(out).toContain(">code</code>");
  expect(out).toContain("<del>gone</del>");
  expect(out).toContain("<em>soft</em>");
  expect(out).toContain('data-mention="brian"');
  expect(out).toContain('href="https://example.com"');
});

test("fenced code stays literal and escaped", () => {
  const out = renderMarkdown("```\n<script>\n```");
  expect(out).toContain("&lt;script&gt;");
  expect(out).toContain("<pre");
});

test("javascript: links never become hrefs", () => {
  const out = renderMarkdown("[x](javascript:alert(1))");
  expect(out).not.toContain('href="javascript');
});

test("renders :shortcode: aliases, leaves unknown names and code alone", () => {
  expect(renderMarkdown(":poop: and :nope:")).toBe("<p>💩 and :nope:</p>");
  expect(renderMarkdown("`:poop:` 12:30:45")).toContain("<code");
  expect(renderMarkdown("`:poop:`")).not.toContain("💩");
  expect(renderMarkdown("12:30:45")).toBe("<p>12:30:45</p>");
});

test("doc mode keeps heading levels and opens /paths in the same tab", () => {
  const out = renderMarkdown(
    "# One\n## Two\n[x](/help/rooms) [y](https://a.b)",
    {
      doc: true,
    },
  );
  expect(out).toContain("<h1");
  expect(out).toContain("<h2");
  expect(out).toContain('<a class="underline" href="/help/rooms">x</a>');
  expect(out).toContain('target="_blank"');
});

test("default mode is unchanged by doc mode", () => {
  const out = renderMarkdown("# One\n[x](/help/rooms)");
  expect(out).toContain("<h3");
  expect(out).toContain('href="/help/rooms" target="_blank"');
});
