# Streamdown Parity Gaps

This document tracks the known gaps between `satteri-stream` and upstream `streamdown@2.5.0`.

`satteri-stream@0.1.0` covers the first core renderer slice:

- streaming block preparation
- `remend` repair for incomplete Markdown
- Satteri-backed Markdown to HAST conversion
- HAST to React rendering
- basic GFM, math, footnote, raw HTML, and URL safety behavior

It is not yet a complete Streamdown-compatible drop-in replacement.

## Highest Priority

- [ ] Export a first-class `Streamdown` component and `StreamdownProps` API.
  - Align `mode` with Streamdown: `"streaming" | "static"`.
  - Keep `Markdown` as an alias only if useful for migration.

- [ ] Implement ReactMarkdown-compatible `components`.
  - Support intrinsic element component overrides.
  - Pass the HAST `node` prop to custom components.
  - Preserve native element props.
  - Support the `inlineCode` custom component.
  - Reproduce Streamdown's `pre` / `code` split for block code vs inline code.
  - Merge user components with Streamdown-style default components.

- [ ] Implement Streamdown's element filtering and URL props.
  - `allowedElements`
  - `disallowedElements`
  - `allowElement`
  - `unwrapDisallowed`
  - `skipHtml`
  - `urlTransform`
  - `defaultUrlTransform`

- [ ] Align raw HTML security behavior.
  - `allowedTags`
  - `literalTagContent`
  - `normalizeHtmlIndentation`
  - Streamdown-style sanitize and harden behavior
  - Regression tests for nested raw HTML, unsafe attributes, and URL-bearing attributes

## Renderer and Plugin Parity

- [ ] Implement the `plugins` prop.
  - `plugins.code`
  - `plugins.math`
  - `plugins.mermaid`
  - `plugins.cjk`
  - `plugins.renderers`

- [ ] Implement code block parity.
  - Shiki highlighting plugin integration
  - copy button support
  - download button support
  - line numbers
  - `startLine=` metastring support
  - `noLineNumbers` metastring support
  - incomplete code fence state
  - custom renderers by language
  - Mermaid language special case

- [ ] Implement table UI parity.
  - table wrapper
  - copy as Markdown, CSV, and TSV
  - download controls
  - fullscreen controls
  - table utility exports

- [ ] Implement Mermaid parity.
  - Mermaid plugin interface
  - async rendering state
  - error component support
  - copy, download, fullscreen, and pan/zoom controls

- [ ] Implement math plugin parity.
  - Keep current built-in KaTeX path if useful.
  - Also support Streamdown's `plugins.math` interface.
  - Avoid double-rendering when both Satteri math and plugin math are enabled.

## Streaming UX Parity

- [ ] Implement animation props.
  - `animated`
  - `isAnimating`
  - `onAnimationStart`
  - `onAnimationEnd`
  - previous rendered character tracking
  - no re-animation for already visible content

- [ ] Implement caret behavior.
  - `caret="block"`
  - `caret="circle"`
  - suppress caret when the last streamed block is a table or incomplete code fence

- [ ] Implement block customization.
  - `BlockComponent`
  - `parseMarkdownIntoBlocksFn`
  - `parseMarkdownIntoBlocks`
  - `useIsCodeFenceIncomplete`

- [ ] Align incomplete block detection.
  - incomplete code fences
  - incomplete tables
  - incomplete raw HTML blocks
  - odd display math delimiters
  - footnote references and definitions

## UI and Package Surface

- [ ] Export Streamdown UI helpers.
  - `CodeBlock`
  - `CodeBlockContainer`
  - `CodeBlockCopyButton`
  - `CodeBlockDownloadButton`
  - `CodeBlockHeader`
  - `CodeBlockSkeleton`
  - `TableCopyDropdown`
  - `TableDownloadButton`
  - `TableDownloadDropdown`
  - `StreamdownContext`

- [ ] Add `./styles.css` package export.
  - Provide Streamdown-compatible data attributes and class hooks.
  - Decide whether to copy Streamdown's shadcn/Tailwind design surface or keep a smaller neutral surface.

- [ ] Implement i18n and icon customization.
  - `translations`
  - `defaultTranslations`
  - `icons`
  - `prefix` for Tailwind class prefixing

- [ ] Implement text direction support.
  - `dir="auto" | "ltr" | "rtl"`
  - `detectTextDirection`
  - per-block direction in streaming mode

- [ ] Implement link safety UI.
  - `linkSafety.enabled`
  - `linkSafety.onLinkCheck`
  - `linkSafety.renderModal`
  - default external link confirmation modal

## Compatibility Notes

- `remarkPlugins`, `rehypePlugins`, and `remarkRehypeOptions` are accepted today for API compatibility, but they are not executed.
- Full unified plugin execution is intentionally not part of the first Satteri renderer slice. If this project stays Satteri-first, plugin compatibility needs either a compatibility bridge or documented unsupported status.
- Streamdown's current public surface includes both renderer behavior and opinionated UI controls. Matching parser output alone is not enough for drop-in compatibility.

## Suggested Implementation Order

1. Lock the public API shape: `Streamdown`, `StreamdownProps`, `Components`, and core exports.
2. Implement `components` parity, including `node`, `inlineCode`, and `code/pre`.
3. Implement HTML, filtering, and URL transform parity.
4. Implement block customization and incomplete block state hooks.
5. Add code block UI and custom renderer support.
6. Add table controls and table utility exports.
7. Add plugin interfaces for math, Mermaid, CJK, and code highlighting.
8. Add animation, caret, direction, translations, icons, and CSS export.
