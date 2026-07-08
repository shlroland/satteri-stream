# V1 Implementation Plan

This plan describes the first Satteri-powered Streamdown-compatible renderer. V1 preserves Streamdown's streaming mechanics and replaces the unified/remark/rehype block renderer with Satteri.

## Goals

- Keep the common Streamdown React usage shape familiar.
- Preserve Streamdown's v1 streaming mechanics: `remend`, marked-based block splitting, and block-level rendering.
- Use Satteri for Markdown-to-HAST parsing per Source Block.
- Render HAST to JSX with explicit safety transforms.
- Build parity fixtures and benchmarks before optimizing Satteri-specific streaming behavior.

## Non-Goals

- Do not replace `remend` in v1.
- Do not implement Repair Window or Tolerance-Gated Repair in v1.
- Do not execute user-provided `remarkPlugins` or `rehypePlugins`.
- Do not support streamed MDX.
- Do not require byte-for-byte HTML parity with Streamdown.

## Architecture

```text
Source Stream
  -> remend(source, remendOptions)
  -> marked-based Source Block splitter
  -> Satteri markdownToHast per Source Block
  -> raw HTML policy
  -> HAST safety and presentation transforms
  -> HAST-to-JSX renderer
```

## Phase 1: Project Skeleton

- Create package metadata, TypeScript config, test config, and benchmark config.
- Add dependencies for React, Satteri, `remend`, `marked`, sanitizer utilities, KaTeX, and benchmark tooling.
- Establish source layout:
  - `src/streamdown.tsx`
  - `src/split-source-blocks.ts`
  - `src/render-hast.tsx`
  - `src/sanitize-hast.ts`
  - `src/transforms/`
  - `test/fixtures/`
  - `bench/`

## Phase 2: Streamdown-Compatible Shell

- Implement the top-level React component with the common Streamdown Compatibility Surface.
- Run `remend(source, remendOptions)` before splitting in streaming mode.
- Implement `splitSourceBlocks(source)` using `marked` token `raw` output.
- Preserve Streamdown parity rules:
  - footnotes force a single Source Block
  - open raw HTML blocks merge subsequent tokens
  - odd display math delimiters merge subsequent tokens
- Keep block keys stable by block index, matching Streamdown's behavior.
- Keep final-block streaming UI state separate from parser behavior.

## Phase 3: Satteri Block Renderer

- Parse each Source Block with Satteri `markdownToHast`.
- Enable Satteri features needed for Streamdown defaults:
  - `gfm`
  - `frontmatter` if needed by compatibility tests
  - `math`
- Convert HAST to JSX directly.
- Support React `components` overrides by tag name.
- Support code block language, metadata, and component integration.
- Warn in development when unsupported `remarkPlugins` or `rehypePlugins` are passed.

## Phase 4: Safety and HTML Policy

- Implement:

```ts
type RawHtmlMode = "sanitize" | "escape" | "drop";
```

- Default to `rawHtml: "sanitize"`.
- Never render Satteri `raw` nodes directly with unsanitized `dangerouslySetInnerHTML`.
- Sanitize element names, attributes, URL-valued attributes, event handlers, and style-like surfaces.
- Harden external links where applicable.
- Reject dangerous schemes such as `javascript:`.
- Keep MDX out of this path.

## Phase 5: Feature Parity

- GFM:
  - tables
  - task lists
  - strikethrough
  - autolinks
  - footnotes
- Math:
  - inline math
  - display math
  - KaTeX rendering path
- Code:
  - fenced code
  - language class
  - metadata
  - incomplete fence state
- Raw HTML:
  - sanitized render
  - escaped render
  - dropped render
- Links and images:
  - URL transform
  - unsafe URL blocking
  - external-link hardening

## Phase 6: Tests

Create fixture suites in three groups.

### Streamdown Parity Fixtures

- Streaming frames with increasing source input.
- Block count and stable block keys.
- Footnotes becoming a single Source Block.
- Raw HTML open-tag merge behavior.
- Display math odd-`$$` merge behavior.
- Incomplete code fence and table state.

### Satteri Renderer Fixtures

- GFM tables, task lists, strikethrough, autolinks, and footnotes.
- Inline and display math.
- Code fence language and metadata.
- Component overrides.
- URL safety and link hardening.

### Security and Boundary Fixtures

- `<script>`
- event attributes such as `onclick`
- `javascript:` URLs
- unsafe `data:` URLs
- unclosed raw HTML
- unclosed fences
- odd `$$`
- incomplete links, images, emphasis, and inline code repaired by `remend`
- footnote reference before definition

Fixture assertions should compare user-visible DOM semantics. They should not require byte-for-byte HTML parity unless the behavior depends on exact output.

## Phase 7: Benchmarks

Adapt Streamdown's benchmark coverage into this project as parity benchmarks:

- `markdown.bench.ts`
- `parse-blocks.bench.ts`
- `streamdown-vs-satteri-stream.bench.ts`
- `table-utils.bench.ts`, only if matching utilities exist

Benchmark goals:

- Compare Satteri-backed rendering against Streamdown-shaped scenarios.
- Keep `parse-blocks` close to upstream because v1 keeps the marked-based splitter.
- Include a multi-baseline benchmark where practical:
  - upstream Streamdown behavior
  - Satteri renderer
  - optional `react-markdown` baseline
- Track both full-document and streaming-frame workloads.

## Acceptance Criteria

- Common Streamdown usage renders through the Satteri-backed component.
- Streaming output remains visually stable across fixture frames.
- `remend` and marked splitter behavior matches Streamdown parity fixtures.
- User-provided unified plugins are not silently treated as supported in development.
- Raw HTML is never rendered unsanitized by default.
- MDX is not accepted as part of the default Markdown renderer.
- Test suite passes.
- Benchmark suite runs in one command and reports Satteri renderer results against the chosen baselines.

## Future Work

- Replace whole-source `remend` with Repair Window repair.
- Introduce Tolerance-Gated Repair based on Satteri Parser Tolerance fixtures.
- Replace or narrow the marked-based splitter if Satteri exposes a suitable streaming block tokenizer.
- Add Satteri-native transform APIs as a replacement for unified plugin compatibility.
- Consider experimental MDX as a separate code execution surface.
