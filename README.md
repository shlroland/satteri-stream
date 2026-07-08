# satteri-stream

A Satteri-backed streaming Markdown renderer for React. V1 preserves Streamdown's streaming mechanics while replacing the unified/remark/rehype block renderer with Satteri.

## Install

```sh
pnpm add satteri-stream
```

React is a peer dependency:

```sh
pnpm add react react-dom
```

## Usage

```tsx
import { Markdown } from "satteri-stream";

export function Message({ content }: { content: string }) {
  return <Markdown>{content}</Markdown>;
}
```

## Safety

Raw HTML is not rendered directly. Configure the policy with:

```tsx
<Markdown rawHtml="sanitize">{content}</Markdown>
<Markdown rawHtml="escape">{content}</Markdown>
<Markdown rawHtml="drop">{content}</Markdown>
```

The default is `sanitize`.

## Development

```sh
pnpm install
pnpm check
pnpm bench
```

Run the local parity workbench:

```sh
pnpm demo
```

## Release

See [docs/RELEASE.md](./docs/RELEASE.md).
