import { bench, describe } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Streamdown } from "streamdown";
import { Markdown, renderMarkdownToStaticMarkup } from "../src/index.js";

const table = [
  "| Name | Value | Notes |",
  "| --- | ---: | --- |",
  ...Array.from({ length: 200 }, (_, index) => {
    return `| row-${index} | ${index} | [link](https://example.com/${index}) |`;
  }),
].join("\n");

describe("table rendering benchmark", () => {
  bench("Satteri Stream table block renderer", () => {
    renderMarkdownToStaticMarkup(table);
  });

  bench("Satteri Stream table component SSR", () => {
    renderToStaticMarkup(React.createElement(Markdown, null, table));
  });

  bench("Streamdown table component SSR", () => {
    renderToStaticMarkup(React.createElement(Streamdown, null, table));
  });
});
