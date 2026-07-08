import { bench, describe } from "vitest";
import { splitSourceBlocks } from "../src/index.js";

const markdown = Array.from({ length: 200 }, (_, index) => {
  return `## Section ${index}\n\nParagraph with [a link](https://example.com/${index}).\n\n- one\n- two\n`;
}).join("\n");

describe("parse-blocks parity benchmark", () => {
  bench("marked-based source block splitter", () => {
    splitSourceBlocks(markdown);
  });
});
