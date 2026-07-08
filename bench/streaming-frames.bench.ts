import { bench, describe } from "vitest";
import remend from "remend";
import { parseMarkdownIntoBlocks } from "streamdown";
import { prepareStreamingBlocks } from "../src/index.js";

const full = Array.from({ length: 100 }, (_, index) => {
  return `Paragraph ${index} with **strong text** and [link](https://example.com).`;
}).join("\n\n");

const frames = Array.from({ length: 50 }, (_, index) => full.slice(0, Math.floor((full.length * (index + 1)) / 50)));

describe("streaming frame benchmark", () => {
  bench("Satteri Stream remend + split streaming frames", () => {
    for (const frame of frames) {
      prepareStreamingBlocks(frame);
    }
  });

  bench("Streamdown remend + parse streaming frames", () => {
    for (const frame of frames) {
      parseMarkdownIntoBlocks(remend(frame));
    }
  });
});
