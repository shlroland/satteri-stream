import { bench, describe } from "vitest";
import { renderMarkdownToStaticMarkup } from "../src/index.js";

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
  bench("Satteri-backed static render", () => {
    renderMarkdownToStaticMarkup(markdown);
  });
});
