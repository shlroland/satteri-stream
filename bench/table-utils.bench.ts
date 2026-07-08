import { bench, describe } from "vitest";
import { renderMarkdownToStaticMarkup } from "../src/index.js";

const table = [
  "| Name | Value | Notes |",
  "| --- | ---: | --- |",
  ...Array.from({ length: 200 }, (_, index) => {
    return `| row-${index} | ${index} | [link](https://example.com/${index}) |`;
  }),
].join("\n");

describe("table rendering benchmark", () => {
  bench("Satteri GFM table render", () => {
    renderMarkdownToStaticMarkup(table);
  });
});
