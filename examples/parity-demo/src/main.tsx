import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  prepareStreamingBlocks,
  Streamdown,
  type RawHtmlMode,
  type StreamdownMode,
} from "satteri-stream";
import "./styles.css";

const samples = [
  {
    label: "Kitchen sink",
    source: `# Streaming parity

This workbench exercises **Satteri-backed** rendering while keeping Streamdown-shaped inputs.

- [x] GFM task item
- [ ] Pending task item

| feature | state |
| --- | --- |
| tables | rendered |
| math | $x^2 + y^2$ |

\`\`\`ts startLine=4
export function answer() {
  return 42;
}
\`\`\`

<a href="javascript:alert(1)" onclick="alert(1)">unsafe link</a>
`,
  },
  {
    label: "Open fence",
    source: `Here is an incomplete code fence:

\`\`\`tsx
export function Message() {
  return <Streamdown>`,
  },
  {
    label: "Raw HTML",
    source: `<div class="note" onclick="alert(1)">
  <strong>Allowed text</strong>
  <script>alert(1)</script>
  <a href="https://example.com">external link</a>
</div>`,
  },
  {
    label: "Footnote",
    source: `A reference that should stay in one source block.[^a]

More text before the definition.

[^a]: Footnote content.`,
  },
];

function App() {
  const [source, setSource] = useState(samples[0]?.source ?? "");
  const [mode, setMode] = useState<StreamdownMode>("streaming");
  const [rawHtml, setRawHtml] = useState<RawHtmlMode>("sanitize");
  const [parseIncompleteMarkdown, setParseIncompleteMarkdown] = useState(true);
  const blocks = useMemo(
    () => prepareStreamingBlocks(source, { rawHtml, parseIncompleteMarkdown }),
    [source, rawHtml, parseIncompleteMarkdown],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>satteri-stream parity workbench</h1>
          <p>Exercise Streamdown-shaped props against the Satteri-backed renderer.</p>
        </div>
        <div className="controls" aria-label="rendering controls">
          <div className="segmented" aria-label="mode">
            <button
              type="button"
              aria-pressed={mode === "streaming"}
              onClick={() => setMode("streaming")}
            >
              streaming
            </button>
            <button type="button" aria-pressed={mode === "static"} onClick={() => setMode("static")}>
              static
            </button>
          </div>
          <label className="field">
            <span>HTML</span>
            <select value={rawHtml} onChange={(event) => setRawHtml(event.target.value as RawHtmlMode)}>
              <option value="sanitize">sanitize</option>
              <option value="escape">escape</option>
              <option value="drop">drop</option>
            </select>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={parseIncompleteMarkdown}
              onChange={(event) => setParseIncompleteMarkdown(event.target.checked)}
            />
            <span>repair incomplete Markdown</span>
          </label>
        </div>
      </header>

      <section className="workspace" aria-label="parity workspace">
        <div className="editor-pane">
          <div className="pane-head">
            <h2>Input</h2>
            <div className="sample-row">
              {samples.map((sample) => (
                <button key={sample.label} type="button" onClick={() => setSource(sample.source)}>
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            aria-label="Markdown source"
          />
        </div>

        <div className="preview-pane">
          <div className="pane-head">
            <h2>Rendered output</h2>
            <span className="status">{blocks.length} source blocks</span>
          </div>
          <div className="preview-surface">
            <Streamdown
              mode={mode}
              rawHtml={rawHtml}
              parseIncompleteMarkdown={parseIncompleteMarkdown}
              components={{
                a: ({ children, ...props }) => (
                  <a {...props} data-demo-link>
                    {children}
                  </a>
                ),
                code: ({ children, className, ...props }) => (
                  <code {...props} className={className ? `${className} demo-code` : "demo-code"}>
                    {children}
                  </code>
                ),
              }}
            >
              {source}
            </Streamdown>
          </div>
        </div>
      </section>

      <section className="diagnostics" aria-label="source block diagnostics">
        <div className="pane-head">
          <h2>Streaming block diagnostics</h2>
          <span className="status">last block carries incomplete state</span>
        </div>
        <div className="block-grid">
          {blocks.map((block) => (
            <article key={block.key} className="block-item">
              <div className="block-meta">
                <strong>#{block.index}</strong>
                <span>{block.source.length} chars</span>
              </div>
              <dl>
                <div>
                  <dt>code fence</dt>
                  <dd>{String(block.state.incompleteCodeFence)}</dd>
                </div>
                <div>
                  <dt>table</dt>
                  <dd>{String(block.state.incompleteTable)}</dd>
                </div>
                <div>
                  <dt>math</dt>
                  <dd>{String(block.state.incompleteMath)}</dd>
                </div>
              </dl>
              <pre>{block.source.slice(0, 220)}</pre>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
