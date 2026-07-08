import { describe, expect, it } from "vitest";
import { isSafeUrl, renderMarkdownToStaticMarkup } from "../src/index.js";

describe("URL safety", () => {
  it("rejects dangerous URL schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("/relative")).toBe(true);
  });
});

describe("rawHtml policy", () => {
  it("sanitizes raw HTML by default", () => {
    const html = renderMarkdownToStaticMarkup('<a href="javascript:alert(1)" onclick="alert(1)">x</a>');
    expect(html).toBe("<p><a>x</a></p>");
  });

  it("drops script tags in sanitize mode", () => {
    const html = renderMarkdownToStaticMarkup("<script>alert(1)</script><b>ok</b>");
    expect(html).not.toContain("script");
    expect(html).toContain("<b>ok</b>");
  });

  it("can escape raw HTML", () => {
    const html = renderMarkdownToStaticMarkup("<b>x</b>", { rawHtml: "escape" });
    expect(html).toBe("<p>&lt;b&gt;x&lt;/b&gt;</p>");
  });

  it("can drop raw HTML", () => {
    const html = renderMarkdownToStaticMarkup("<b>x</b>", { rawHtml: "drop" });
    expect(html).toBe("<p>x</p>");
  });

  it("hardens external links", () => {
    const html = renderMarkdownToStaticMarkup("[x](https://example.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
    expect(html).toContain("noreferrer");
  });

  it("removes unsafe image URLs", () => {
    const html = renderMarkdownToStaticMarkup("![x](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });
});
