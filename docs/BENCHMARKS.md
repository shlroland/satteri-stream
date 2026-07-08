# Benchmarks

Run all benchmark suites with:

```sh
pnpm bench
```

The suite compares this package against upstream `streamdown` in the main user-visible paths:

- `bench/markdown.bench.ts`: small Markdown render cost.
- `bench/streamdown-vs-satteri-stream.bench.ts`: larger Streamdown-shaped document render and repair/split cost.
- `bench/streaming-frames.bench.ts`: repeated streaming-frame repair and split cost.
- `bench/parse-blocks.bench.ts`: splitter-only and repair-plus-split cost.
- `bench/table-utils.bench.ts`: table-heavy rendering cost.

Vitest reports:

- `hz`: operations per second; higher is faster.
- `mean`: average milliseconds per operation; lower is faster.
- `min` / `max`: fastest and slowest observed operation.
- `p75` / `p99`: latency percentiles.
- `rme`: relative margin of error; lower is more reliable.
- `samples`: number of measured samples.

The most comparable render numbers are:

- `Satteri Stream React component SSR`
- `Streamdown React component SSR`

The `Satteri Stream block renderer` rows measure the lower-level Satteri block renderer without the full React streaming shell, so they are useful for isolating parser/render cost but should not be treated as a drop-in component comparison.
