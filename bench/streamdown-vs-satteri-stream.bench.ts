import { bench, describe } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import remend from "remend";
import { parseMarkdownIntoBlocks, Streamdown } from "streamdown";
import { Markdown, prepareStreamingBlocks, renderMarkdownToStaticMarkup } from "../src/index.js";

const markdown = Array.from({ length: 60 }, (_, index) => {
  return `## Section ${index}

Paragraph with **strong text**, _emphasis_, [a link](https://example.com/${index}), and inline math $x_${index}$.

| a | b |
| - | - |
| ${index} | ${index + 1} |

~~~ts
console.log(${index});
~~~
`;
}).join("\n");

describe("Streamdown vs Satteri Stream benchmark", () => {
  bench("Satteri Stream block renderer", () => {
    renderMarkdownToStaticMarkup(markdown);
  });

  bench("Satteri Stream React component SSR", () => {
    renderToStaticMarkup(React.createElement(Markdown, null, markdown));
  });

  bench("Streamdown React component SSR", () => {
    renderToStaticMarkup(React.createElement(Streamdown, null, markdown));
  });

  bench("Satteri Stream remend + split", () => {
    prepareStreamingBlocks(markdown);
  });

  bench("Streamdown remend + parseMarkdownIntoBlocks", () => {
    parseMarkdownIntoBlocks(remend(markdown));
  });
});
