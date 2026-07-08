export interface StreamingBlockState {
  incompleteCodeFence: boolean;
  incompleteTable: boolean;
  incompleteMath: boolean;
}

export function getStreamingBlockState(source: string): StreamingBlockState {
  return {
    incompleteCodeFence: hasIncompleteCodeFence(source),
    incompleteTable: hasIncompleteTable(source),
    incompleteMath: hasOddDisplayMathDelimiters(source),
  };
}

export function hasIncompleteCodeFence(source: string): boolean {
  const fencePattern = /(^|\n)( {0,3})(`{3,}|~{3,})[^\n]*(?=\n|$)/g;
  const stack: Array<{ marker: "`" | "~"; length: number }> = [];

  for (const match of source.matchAll(fencePattern)) {
    const fence = match[3];
    if (!fence) continue;
    const marker = fence[0] as "`" | "~";
    const length = fence.length;
    const open = stack.at(-1);

    if (open && open.marker === marker && length >= open.length) {
      stack.pop();
    } else if (!open) {
      stack.push({ marker, length });
    }
  }

  return stack.length > 0;
}

export function hasOddDisplayMathDelimiters(source: string): boolean {
  const withoutCodeFences = source.replace(/(^|\n)( {0,3})(`{3,}|~{3,})[\s\S]*?(\n\2\3[ \t]*(?=\n|$)|$)/g, "\n");
  const matches = withoutCodeFences.match(/\$\$/g);
  return (matches?.length ?? 0) % 2 === 1;
}

export function hasIncompleteTable(source: string): boolean {
  const lines = source.split(/\r?\n/);
  const lastNonEmptyIndex = findLastNonEmptyLine(lines);
  if (lastNonEmptyIndex < 0) {
    return false;
  }

  const last = lines[lastNonEmptyIndex] ?? "";
  const previous = lines[lastNonEmptyIndex - 1] ?? "";

  if (looksLikeTableHeader(last)) {
    return true;
  }

  return looksLikeTableHeader(previous) && !looksLikeTableDelimiter(last);
}

function findLastNonEmptyLine(lines: string[]): number {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if ((lines[index] ?? "").trim() !== "") {
      return index;
    }
  }
  return -1;
}

function looksLikeTableHeader(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes("|") && !looksLikeTableDelimiter(trimmed);
}

function looksLikeTableDelimiter(line: string): boolean {
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}
