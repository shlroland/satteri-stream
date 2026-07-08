import { bench, describe } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { prepareStreamingBlocks, renderMarkdownToStaticMarkup } from "../src/index.js";

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

describe("streamdown-shaped rendering benchmark", () => {
  bench("Satteri renderer", () => {
    renderMarkdownToStaticMarkup(markdown);
  });

  bench("streaming repair and split", () => {
    prepareStreamingBlocks(markdown);
  });

  bench("React static markup baseline", () => {
    renderToStaticMarkup(React.createElement("article", null, markdown));
  });
});
