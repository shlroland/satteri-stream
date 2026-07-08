import { describe, expect, it } from "vitest";
import {
  getStreamingBlockState,
  hasIncompleteCodeFence,
  hasIncompleteTable,
  hasOddDisplayMathDelimiters,
  prepareStreamingBlocks,
} from "../src/index.js";

describe("streaming block state", () => {
  it("detects incomplete code fences", () => {
    expect(hasIncompleteCodeFence("```ts\nconst x = 1")).toBe(true);
    expect(hasIncompleteCodeFence("```ts\nconst x = 1\n```")).toBe(false);
  });

  it("detects incomplete display math", () => {
    expect(hasOddDisplayMathDelimiters("$$\nx")).toBe(true);
    expect(hasOddDisplayMathDelimiters("$$\nx\n$$")).toBe(false);
  });

  it("detects incomplete tables", () => {
    expect(hasIncompleteTable("| a | b |")).toBe(true);
    expect(hasIncompleteTable("| a | b |\n| --- | --- |")).toBe(false);
  });

  it("attaches state only to the last prepared streaming block", () => {
    const blocks = prepareStreamingBlocks("done\n\n```ts\nconst x = 1");
    expect(blocks.at(-1)?.state.incompleteCodeFence).toBe(true);
    expect(blocks.slice(0, -1).every((block) => !block.state.incompleteCodeFence)).toBe(true);
  });

  it("returns a combined state object", () => {
    expect(getStreamingBlockState("| a | b |")).toMatchObject({
      incompleteCodeFence: false,
      incompleteMath: false,
      incompleteTable: true,
    });
  });
});
