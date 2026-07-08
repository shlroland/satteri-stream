import { describe, expect, it } from "vitest";
import { prepareStreamingBlocks, splitSourceBlocks } from "../src/index.js";

describe("splitSourceBlocks", () => {
  it("returns no blocks for empty input", () => {
    expect(splitSourceBlocks("")).toEqual([]);
  });

  it("uses stable index keys for source blocks", () => {
    const blocks = splitSourceBlocks("one\n\ntwo");
    expect(blocks.map((block) => block.key)).toEqual(blocks.map((_, index) => `block-${index}`));
    expect(blocks.map((block) => block.source).join("")).toBe("one\n\ntwo");
  });

  it("keeps footnotes in one source block", () => {
    const blocks = splitSourceBlocks("A reference[^a].\n\n[^a]: note");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.source).toContain("[^a]: note");
  });

  it("merges content after an open raw HTML block", () => {
    const blocks = splitSourceBlocks("<div>\n\ninside\n\n</div>\n\noutside");
    expect(blocks[0]?.source).toContain("<div>\n\ninside\n\n</div>");
    expect(blocks.map((block) => block.source).join("")).toBe("<div>\n\ninside\n\n</div>\n\noutside");
  });

  it("merges content after an odd display math delimiter", () => {
    const blocks = splitSourceBlocks("$$\na\n\nb\n$$\n\nnext");
    expect(blocks[0]?.source).toContain("b\n$$");
    expect(blocks.at(-1)?.source).toContain("next");
  });
});

describe("prepareStreamingBlocks", () => {
  it("runs remend before splitting by default", () => {
    const blocks = prepareStreamingBlocks("[x](https://example.com");
    expect(blocks.map((block) => block.source).join("")).toContain("streamdown:incomplete-link");
  });

  it("can disable incomplete Markdown repair", () => {
    const source = "[x](https://example.com";
    const blocks = prepareStreamingBlocks(source, { parseIncompleteMarkdown: false });
    expect(blocks.map((block) => block.source).join("")).toBe(source);
  });
});
