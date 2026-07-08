# Satteri Stream

This context describes the language for a Satteri-powered streaming Markdown renderer.

## Language

**Streaming Repair**:
Pre-parse handling that turns incomplete streamed Markdown text into a stable renderable form for the current frame.
_Avoid_: remend, parser repair

**Parser Tolerance**:
A parser's ability to accept, recover from, or deliberately classify incomplete and malformed Markdown or MDX input.
_Avoid_: streaming repair

**Streaming Renderer**:
A renderer that updates progressively while Markdown is still arriving and keeps intermediate frames visually coherent.
_Avoid_: markdown parser

**Repair Window**:
The trailing region of streamed Markdown that Streaming Repair may temporarily rewrite for the current render frame.
_Avoid_: whole-document repair

**Stable Block**:
A previously rendered Markdown block that is no longer expected to change during normal streaming updates.
_Avoid_: committed source

**Stable Boundary**:
A point in the source stream after which preceding Markdown can be treated as Stable Blocks without normal future tokens changing their parse meaning.
_Avoid_: block index, chunk boundary

**Source Block**:
A coarse Markdown segment cut from the Source Stream for progressive rendering, preserving the original source text for that segment.
_Avoid_: AST node, rendered block

**Cross-Block Construct**:
A Markdown construct whose meaning can reach across otherwise separate rendered blocks, requiring the Repair Window to expand or the document to render as a single unit.
_Avoid_: edge case, special block

**Compatibility Surface**:
The user-facing behavior and props expected by Streamdown users, without implying that the internal unified or remark pipeline is preserved.
_Avoid_: unified compatibility, parser compatibility

**Source Stream**:
The original Markdown text received from the caller, treated as the only durable source of truth.
_Avoid_: repaired markdown, rendered markdown

**Render Source**:
The temporary Markdown text produced for a single render frame after applying Streaming Repair to the Repair Window.
_Avoid_: source stream, persisted markdown

**Tolerance-Gated Repair**:
Streaming Repair that runs only where Parser Tolerance does not already produce the desired streaming render behavior.
_Avoid_: remend parity, unconditional repair

**Raw HTML**:
HTML syntax embedded in Markdown input, treated as untrusted content unless an explicit sanitizing render mode accepts it.
_Avoid_: MDX, trusted JSX

**MDX**:
Markdown with executable JSX and JavaScript syntax, treated as a separate code execution surface rather than Markdown content.
_Avoid_: raw HTML, markdown extension
