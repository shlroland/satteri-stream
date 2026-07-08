import { bench, describe } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Streamdown } from "streamdown";
import { Markdown, renderMarkdownToStaticMarkup } from "../src/index.js";

const markdown = `# Benchmark

| a | b |
| - | - |
| 1 | 2 |

- [x] task
- item

Inline math $x^2$ and code \`value\`.

~~~ts
console.log("hello");
~~~
`;

describe("markdown rendering benchmark", () => {
  bench("Satteri Stream block renderer", () => {
    renderMarkdownToStaticMarkup(markdown);
  });

  bench("Satteri Stream React component SSR", () => {
    renderToStaticMarkup(React.createElement(Markdown, null, markdown));
  });

  bench("Streamdown React component SSR", () => {
    renderToStaticMarkup(React.createElement(Streamdown, null, markdown));
  });
});
