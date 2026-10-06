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
