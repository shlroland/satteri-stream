import { Lexer, type Tokens } from "marked";

export interface SourceBlock {
  key: string;
  index: number;
  source: string;
}

const FOOTNOTE_PATTERN = /(^|\n)\[\^[^\]\n]+]:|\[\^[^\]\n]+]/;
const HTML_TAG_PATTERN = /<\/?([A-Za-z][A-Za-z0-9:-]*)(?:\s[^<>]*)?>/g;
const VOID_HTML_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export function splitSourceBlocks(markdown: string): SourceBlock[] {
  if (markdown.length === 0) {
    return [];
  }

  if (FOOTNOTE_PATTERN.test(markdown)) {
    return [createBlock(markdown, 0)];
  }

  const tokens = Lexer.lex(markdown, { gfm: true }) as Tokens.Generic[];
  const blocks: string[] = [];
  const htmlStack: string[] = [];

  for (const token of tokens) {
    const raw = typeof token.raw === "string" ? token.raw : "";
    if (raw.length === 0) {
      continue;
    }

    const previousIndex = blocks.length - 1;
    const previous = previousIndex >= 0 ? blocks[previousIndex] : undefined;
    const tokenType = typeof token.type === "string" ? token.type : "";
    const previousHasOpenMath =
      previous !== undefined && tokenType !== "code" && hasOddDisplayMathDelimiters(previous);

    if (htmlStack.length > 0 || previousHasOpenMath) {
      blocks[previousIndex] = `${previous ?? ""}${raw}`;
    } else {
      blocks.push(raw);
    }

    updateHtmlStack(htmlStack, raw);
  }

  return blocks.map((source, index) => createBlock(source, index));
}

function createBlock(source: string, index: number): SourceBlock {
  return {
    key: `block-${index}`,
    index,
    source,
  };
}

function hasOddDisplayMathDelimiters(source: string): boolean {
  const matches = source.match(/\$\$/g);
  return (matches?.length ?? 0) % 2 === 1;
}

function updateHtmlStack(stack: string[], source: string): void {
  HTML_TAG_PATTERN.lastIndex = 0;

  for (const match of source.matchAll(HTML_TAG_PATTERN)) {
    const full = match[0];
    const tagName = match[1]?.toLowerCase();
    if (!tagName || VOID_HTML_TAGS.has(tagName) || full.endsWith("/>")) {
      continue;
    }

    if (full.startsWith("</")) {
      const openIndex = stack.lastIndexOf(tagName);
      if (openIndex >= 0) {
        stack.splice(openIndex);
      }
      continue;
    }

    stack.push(tagName);
  }
}
