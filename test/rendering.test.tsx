import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { renderMarkdownToStaticMarkup, Streamdown } from "../src/index.js";

describe("Satteri block renderer", () => {
  it("renders basic Markdown", () => {
    expect(renderMarkdownToStaticMarkup("# Hello, *world*")).toBe("<h1>Hello, <em>world</em></h1>");
  });

  it("renders GFM task lists and tables", () => {
    const task = renderMarkdownToStaticMarkup("- [x] done");
    expect(task).toContain("contains-task-list");
    expect(task).toContain("checked=\"\"");

    const table = renderMarkdownToStaticMarkup("| a | b |\n| - | - |\n| 1 | 2 |");
    expect(table).toContain("<table>");
    expect(table).toContain("<th>a</th>");
    expect(table).toContain("<td>2</td>");
  });

  it("renders GFM footnotes", () => {
    const html = renderMarkdownToStaticMarkup("note[^a]\n\n[^a]: footnote");
    expect(html).toContain("footnote");
    expect(html).toContain("aria-describedby");
    expect(html).toContain("data-footnote-backref");
  });

  it("renders code language and metadata-friendly output", () => {
    const html = renderMarkdownToStaticMarkup("~~~js meta\nconsole.log(1)\n~~~");
    expect(html).toContain("<pre>");
    expect(html).toContain("language-js");
    expect(html).toContain("console.log(1)");
  });

  it("renders math through KaTeX", () => {
    const html = renderMarkdownToStaticMarkup("$x^2$");
    expect(html).toContain("katex");
    expect(html).toContain("x");
  });

  it("supports component overrides", () => {
    const html = renderMarkdownToStaticMarkup("# Title", {
      components: {
        h1: ({ children }) => <h2 data-kind="override">{children}</h2>,
      },
    });
    expect(html).toBe('<h2 data-kind="override">Title</h2>');
  });

  it("passes the HAST node prop and preserves native props for custom components", () => {
    const html = renderMarkdownToStaticMarkup("[site](https://example.com)", {
      components: {
        a: ({ children, node, ...props }) => (
          <a {...props} data-node={node.tagName}>
            {children}
          </a>
        ),
      },
    });

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
    expect(html).toContain('data-node="a"');
  });

  it("routes inline code to inlineCode and keeps block code split across pre and code", () => {
    const html = renderMarkdownToStaticMarkup("Use `x`.\n\n~~~ts\nconst x = 1\n~~~", {
      components: {
        inlineCode: ({ children, node, ...props }) => (
          <mark {...props} data-inline-node={node.tagName}>
            {children}
          </mark>
        ),
        pre: ({ children, node, ...props }) => (
          <figure {...props} data-pre-node={node.tagName}>
            {children}
          </figure>
        ),
        code: ({ children, node, ...props }) => (
          <code {...props} data-code-node={node.tagName}>
            {children}
          </code>
        ),
      },
    });

    expect(html).toContain('<mark data-inline-node="code">x</mark>');
    expect(html).toContain('<figure data-pre-node="pre">');
    expect(html).toContain('data-code-node="code"');
    expect(html).toContain('class="language-ts"');
  });

  it("exports a Streamdown component with static mode", () => {
    const html = renderToStaticMarkup(<Streamdown mode="static"># Title</Streamdown>);
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("data-satteri-stream");
  });

  it("warns when unified plugins are passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderMarkdownToStaticMarkup("x", { remarkPlugins: [() => undefined], rehypePlugins: [() => undefined] });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("remarkPlugins"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("rehypePlugins"));
    warn.mockRestore();
  });
});
