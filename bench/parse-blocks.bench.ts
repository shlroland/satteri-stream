import { bench, describe } from "vitest";
import remend from "remend";
import { parseMarkdownIntoBlocks } from "streamdown";
import { splitSourceBlocks } from "../src/index.js";

const markdown = Array.from({ length: 200 }, (_, index) => {
  return `## Section ${index}\n\nParagraph with [a link](https://example.com/${index}).\n\n- one\n- two\n`;
}).join("\n");

describe("block splitting benchmark", () => {
  bench("Satteri Stream splitSourceBlocks", () => {
    splitSourceBlocks(markdown);
  });

  bench("Streamdown parseMarkdownIntoBlocks", () => {
    parseMarkdownIntoBlocks(markdown);
  });

  bench("Satteri Stream remend + split", () => {
    splitSourceBlocks(remend(markdown));
  });

  bench("Streamdown remend + parseMarkdownIntoBlocks", () => {
    parseMarkdownIntoBlocks(remend(markdown));
  });
});
