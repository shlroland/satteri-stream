# 0001. V1 preserves Streamdown streaming mechanics while replacing the renderer

Date: 2026-07-08

## Status

Accepted

## Context

The project aims to reimplement Streamdown with Satteri as the Markdown parser and renderer foundation. Streamdown's progressive behavior comes from a practical split of responsibilities: `remend` repairs incomplete streamed Markdown, `marked` lexes coarse source blocks, and each source block is rendered independently.

Satteri has Parser Tolerance for some incomplete Markdown cases, but it does not currently expose a full replacement for Streamdown's `remend` behavior or a streaming block tokenizer. Replacing repair, splitting, and rendering all at once would increase the number of moving parts in the first implementation.

## Decision

For v1, preserve Streamdown's streaming mechanics and replace only the block rendering pipeline:

```text
Source Stream
  -> remend(source, remendOptions)
  -> marked-based source block splitter
  -> Satteri markdownToHast per Source Block
  -> sanitize / transform / HAST-to-JSX
```

V1 will use `remend` on the current Source Stream before splitting, matching Streamdown's behavior. Repair Window and Tolerance-Gated Repair remain future optimization directions, not v1 requirements.

The Compatibility Surface should remain close to Streamdown for common React usage, but v1 does not preserve unified, remark, or rehype as the internal rendering pipeline.

V1 will not execute user-provided `remarkPlugins` or `rehypePlugins`. Those props may remain on the compatibility surface, but they should warn in development and be ignored in production. Satteri-native HAST transforms may be introduced as a separate extension point.

V1 should prioritize user-visible Streamdown defaults rather than plugin-name parity:

- GFM through Satteri `features.gfm`
- math through Satteri `features.math` plus a HAST-level KaTeX rendering path
- raw HTML through explicit sanitize, escape, or drop modes
- URL safety and external-link hardening through HAST transforms
- React `components` overrides during HAST-to-JSX rendering
- code block language, metadata, and component integration
- streaming caret and final-block UI state compatible with Streamdown

CJK enhancement, animation, custom unified plugins, MDX, and non-default Satteri extensions are outside v1 unless explicitly enabled later.

V1 should migrate Streamdown's benchmark coverage and run it as a single benchmark suite for parity and regression tracking. The upstream benchmark set currently includes:

- `markdown.bench.ts`
- `parse-blocks.bench.ts`
- `streamdown-vs-satteri-stream.bench.ts`
- `table-utils.bench.ts`

The migrated benchmark suite should compare the Satteri renderer against Streamdown-shaped scenarios rather than only microbenchmarking Satteri parse calls.

The Streamdown benchmark files should be adapted into parity benchmarks, not copied blindly. `parse-blocks.bench.ts` can stay close to upstream because v1 keeps a marked-based splitter. Markdown rendering benchmarks should compare the Satteri renderer against Streamdown-shaped scenarios. `streamdown-vs-react-markdown.bench.ts` should become a multi-baseline benchmark where practical. `table-utils.bench.ts` should only remain an executable benchmark if the corresponding table utilities exist in this project.

## Consequences

This keeps v1 focused on validating Satteri as the replacement for the remark/rehype rendering path. It also gives parity with Streamdown's current repair and splitting behavior before introducing Satteri-specific streaming optimizations.

The trade-off is that v1 still depends on `remend` and `marked`, so it is not a purely Satteri-driven streaming renderer. Removing or narrowing those dependencies should be treated as a later architectural change with fixture coverage against Streamdown behavior and Satteri Parser Tolerance.

Another trade-off is plugin compatibility. Existing Streamdown users whose behavior depends on custom remark or rehype plugins will need Satteri-native transforms or built-in feature support before migration is complete.
