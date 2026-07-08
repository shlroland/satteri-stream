import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type StreamState = "idle" | "streaming" | "paused" | "done";

function App() {
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [source, setSource] = useState(samples[0]?.source ?? "");
  const [mode, setMode] = useState<StreamdownMode>("streaming");
  const [rawHtml, setRawHtml] = useState<RawHtmlMode>("sanitize");
  const [parseIncompleteMarkdown, setParseIncompleteMarkdown] = useState(true);
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [streamCursor, setStreamCursor] = useState(source.length);
  const [eventCount, setEventCount] = useState(0);
  const [chunkSize, setChunkSize] = useState(12);
  const [eventDelay, setEventDelay] = useState(140);
  const timeoutRef = useRef<number | null>(null);
  const streamTarget = samples[selectedSampleIndex]?.source ?? "";
  const blocks = useMemo(
    () => prepareStreamingBlocks(source, { rawHtml, parseIncompleteMarkdown }),
    [source, rawHtml, parseIncompleteMarkdown],
  );
  const progress = streamTarget.length === 0 ? 0 : Math.min(100, (streamCursor / streamTarget.length) * 100);

  const clearStreamTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const appendNextChunk = useCallback(() => {
    setStreamCursor((cursor) => {
      const nextCursor = Math.min(cursor + chunkSize, streamTarget.length);
      setSource(streamTarget.slice(0, nextCursor));
      setEventCount((count) => count + 1);
      if (nextCursor >= streamTarget.length) {
        setStreamState("done");
      }
      return nextCursor;
    });
  }, [chunkSize, streamTarget]);

  useEffect(() => {
    clearStreamTimeout();
    if (streamState !== "streaming") {
      return;
    }
    if (streamCursor >= streamTarget.length) {
      setStreamState("done");
      return;
    }

    timeoutRef.current = window.setTimeout(appendNextChunk, eventDelay);
    return clearStreamTimeout;
  }, [appendNextChunk, clearStreamTimeout, eventDelay, streamCursor, streamState, streamTarget.length]);

  function loadSample(index: number): void {
    clearStreamTimeout();
    const sampleSource = samples[index]?.source ?? "";
    setSelectedSampleIndex(index);
    setSource(sampleSource);
    setStreamCursor(sampleSource.length);
    setEventCount(0);
    setStreamState("idle");
  }

  function startStream(): void {
    clearStreamTimeout();
    setMode("streaming");
    setSource("");
    setStreamCursor(0);
    setEventCount(0);
    setStreamState("streaming");
  }

  function pauseStream(): void {
    clearStreamTimeout();
    setStreamState("paused");
  }

  function resumeStream(): void {
    if (streamCursor < streamTarget.length) {
      setMode("streaming");
      setStreamState("streaming");
    }
  }

  function stepStream(): void {
    clearStreamTimeout();
    setMode("streaming");
    setStreamState("paused");
    appendNextChunk();
  }

  function resetStream(): void {
    clearStreamTimeout();
    setSource("");
    setStreamCursor(0);
    setEventCount(0);
    setStreamState("paused");
  }

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
              {samples.map((sample, index) => (
                <button
                  key={sample.label}
                  type="button"
                  aria-pressed={selectedSampleIndex === index}
                  onClick={() => loadSample(index)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
          <div className="stream-panel" aria-label="SSE stream simulator">
            <div className="stream-actions">
              <button type="button" onClick={startStream}>
                Start SSE
              </button>
              <button type="button" disabled={streamState !== "streaming"} onClick={pauseStream}>
                Pause
              </button>
              <button
                type="button"
                disabled={streamState !== "paused" || streamCursor >= streamTarget.length}
                onClick={resumeStream}
              >
                Resume
              </button>
              <button type="button" disabled={streamCursor >= streamTarget.length} onClick={stepStream}>
                Step
              </button>
              <button type="button" onClick={resetStream}>
                Reset
              </button>
            </div>
            <div className="stream-settings">
              <label>
                <span>chunk</span>
                <input
                  type="range"
                  min="1"
                  max="48"
                  value={chunkSize}
                  onChange={(event) => setChunkSize(Number(event.target.value))}
                />
                <output>{chunkSize}</output>
              </label>
              <label>
                <span>delay</span>
                <input
                  type="range"
                  min="30"
                  max="600"
                  step="10"
                  value={eventDelay}
                  onChange={(event) => setEventDelay(Number(event.target.value))}
                />
                <output>{eventDelay}ms</output>
              </label>
            </div>
            <div className="stream-meter" aria-label="stream progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <dl className="stream-stats">
              <div>
                <dt>state</dt>
                <dd>{streamState}</dd>
              </div>
              <div>
                <dt>events</dt>
                <dd>{eventCount}</dd>
              </div>
              <div>
                <dt>cursor</dt>
                <dd>
                  {streamCursor}/{streamTarget.length}
                </dd>
              </div>
            </dl>
          </div>
          <textarea
            value={source}
            onChange={(event) => {
              clearStreamTimeout();
              setSource(event.target.value);
              setStreamCursor(event.target.value.length);
              setEventCount(0);
              setStreamState("idle");
            }}
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
                inlineCode: ({ children, className, ...props }) => (
                  <code {...props} className={className ? `${className} demo-inline-code` : "demo-inline-code"}>
                    {children}
                  </code>
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
