import React, { memo, startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import remend, { type RemendOptions } from "remend";
import { markdownToHast, type Features } from "satteri";
import { renderHastToReact, type ComponentsMap, type RawHtmlMode } from "./render-hast.js";
import { splitSourceBlocks, type SourceBlock } from "./split-source-blocks.js";
import { getStreamingBlockState, type StreamingBlockState } from "./streaming-state.js";

export type { ComponentsMap, RawHtmlMode };
export type StreamdownMode = "streaming" | "static";

export interface PreparedBlock extends SourceBlock {
  renderedSource: string;
  state: StreamingBlockState;
}

export interface RenderOptions {
  components?: ComponentsMap;
  rawHtml?: RawHtmlMode;
  features?: Features;
  parseIncompleteMarkdown?: boolean;
  remendOptions?: RemendOptions;
  remarkPlugins?: unknown[];
  rehypePlugins?: unknown[];
}

export interface StreamdownProps extends RenderOptions {
  children: string;
  mode?: StreamdownMode;
  className?: string;
}

export type MarkdownProps = Omit<StreamdownProps, "mode"> & {
  mode?: StreamdownMode | "complete";
};

export function prepareStreamingBlocks(source: string, options: RenderOptions = {}): PreparedBlock[] {
  const renderedSource =
    options.parseIncompleteMarkdown === false ? source : remend(source, options.remendOptions);
  const blocks = splitSourceBlocks(renderedSource);
  return blocks.map((block, index) => ({
    ...block,
    renderedSource: block.source,
    state:
      index === blocks.length - 1
        ? getStreamingBlockState(block.source)
        : { incompleteCodeFence: false, incompleteMath: false, incompleteTable: false },
  }));
}

export function renderMarkdownToReact(source: string, options: RenderOptions = {}): ReactNode {
  warnUnsupportedUnifiedPlugins(options);
  const tree = markdownToHast(source, {
    features: {
      gfm: true,
      math: true,
      frontmatter: true,
      ...options.features,
    },
  });
  return renderHastToReact(tree, {
    ...(options.components ? { components: options.components } : {}),
    rawHtml: options.rawHtml ?? "sanitize",
  });
}

export function renderMarkdownToStaticMarkup(source: string, options: RenderOptions = {}): string {
  return renderToStaticMarkup(<>{renderMarkdownToReact(source, options)}</>);
}

function StreamdownView({
  children,
  mode = "streaming",
  className,
  components,
  rawHtml,
  features,
  parseIncompleteMarkdown,
  remendOptions,
  remarkPlugins,
  rehypePlugins,
}: MarkdownProps): ReactNode {
  const normalizedMode: StreamdownMode = mode === "complete" ? "static" : mode;
  const options = useMemo<RenderOptions>(
    () => ({
      ...(components ? { components } : {}),
      ...(rawHtml ? { rawHtml } : {}),
      ...(features ? { features } : {}),
      ...(parseIncompleteMarkdown !== undefined ? { parseIncompleteMarkdown } : {}),
      ...(remendOptions ? { remendOptions } : {}),
      ...(remarkPlugins ? { remarkPlugins } : {}),
      ...(rehypePlugins ? { rehypePlugins } : {}),
    }),
    [components, rawHtml, features, parseIncompleteMarkdown, remendOptions, remarkPlugins, rehypePlugins],
  );
  const initialBlocks = useMemo(
    () => (normalizedMode === "streaming" ? prepareStreamingBlocks(children, options) : sourceAsSingleBlock(children)),
    [children, normalizedMode, options],
  );
  const [displayBlocks, setDisplayBlocks] = useState(initialBlocks);

  useEffect(() => {
    if (normalizedMode !== "streaming") {
      setDisplayBlocks(sourceAsSingleBlock(children));
      return;
    }

    const nextBlocks = prepareStreamingBlocks(children, options);
    startTransition(() => setDisplayBlocks(nextBlocks));
  }, [children, normalizedMode, options]);

  return (
    <div className={className} data-satteri-stream>
      {displayBlocks.map((block) => (
        <div
          key={block.key}
          data-source-block={block.index}
          data-incomplete-code-fence={block.state.incompleteCodeFence || undefined}
          data-incomplete-math={block.state.incompleteMath || undefined}
          data-incomplete-table={block.state.incompleteTable || undefined}
        >
          <Block source={block.source} options={options} />
        </div>
      ))}
    </div>
  );
}

export const Streamdown = memo(function Streamdown(props: StreamdownProps): ReactNode {
  return <StreamdownView {...props} />;
});

export const Markdown = memo(function Markdown(props: MarkdownProps): ReactNode {
  return <StreamdownView {...props} />;
});

export const SatteriStreamdown = Streamdown;

const Block = memo(function Block({ source, options }: { source: string; options: RenderOptions }) {
  return <>{renderMarkdownToReact(source, options)}</>;
});

function sourceAsSingleBlock(source: string): PreparedBlock[] {
  return source.length === 0
    ? []
    : [
        {
          key: "block-0",
          index: 0,
          source,
          renderedSource: source,
          state: getStreamingBlockState(source),
        },
      ];
}

function warnUnsupportedUnifiedPlugins(options: RenderOptions): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  if ((options.remarkPlugins?.length ?? 0) > 0) {
    console.warn("satteri-stream: remarkPlugins are accepted for compatibility but not executed in v1.");
  }
  if ((options.rehypePlugins?.length ?? 0) > 0) {
    console.warn("satteri-stream: rehypePlugins are accepted for compatibility but not executed in v1.");
  }
}
