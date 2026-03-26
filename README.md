# trace-guard

Trace-Guard is a CLI tool for validating system flows through logs and events. It verifies that expected events occurred, in the correct order, using observability data.

## Validation Flow (High Level)

```text
CLI (src/cli/index.ts)
  -> runCommand (src/cli/runCommand.ts)
    -> parse flow/config/events + build EventSource
      -> runValidation loop (src/core/runner/validationRunner.ts)
        -> validateFlow (src/core/validation/validateFlow.ts)
          -> evaluateRule switch (src/core/validation/evaluators/evaluateRule.ts)
            -> evaluateExpectedRule | evaluateForbiddenRule | evaluateOrderRule
        -> build ValidationReport
      -> final run status (pass/timeout)
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Current Project Status](docs/STATUS.md)
- [Implementation Roadmap](docs/ROADMAP.md)
- [Design Notes (Future Decisions)](docs/DESIGN_NOTES.md)

## CLI Contract

Command:

- `trace-guard run --flow <flow.json> --config <config.json> --events <events.json> [--output <human|json>]`

Exit codes:

- `0`: validation passed
- `1`: validation run completed but rules did not pass before timeout
- `2`: CLI/input error (invalid args, file read failure, or parsing error)

JSON output example (`--output json`):

```json
{
  "kind": "run_completed",
  "exitCode": 0,
  "runResult": {
    "status": "pass",
    "elapsedMs": 38
  }
}
```

## Elastic Source Adapter

`ElasticEventSource` integrates Elastic without changing core validation/runner contracts.

```ts
import { ElasticEventSource, ElasticHttpClient, runValidation } from 'trace-guard';

const client = new ElasticHttpClient({
  endpoint: 'https://my-elastic.example.com',
  apiKey: process.env.ELASTIC_API_KEY,
});

const source = new ElasticEventSource({
  index: 'trace-events',
  client,
  defaultLimit: 500,
});

const result = await runValidation({ flow, config, source });
```

## Import Guide

Preferred entrypoints for library usage:

- `trace-guard/public` - stable, high-level API for most consumers
- `trace-guard/parsing` - parsing-only API (`parseTraceEvent`, `parseFlowDefinition`, `parseRunnerConfig`)
- `trace-guard/validation` - validation-focused API (`validateFlow`, `runValidation`, report models)

`trace-guard` (root `src/index.ts`) is kept as a broad legacy barrel for backward compatibility.
For new code, prefer the focused entrypoints above.

## Type Branding Policy

Branded types in this project are compile-time only (no runtime validation by themselves).
They are reserved for identifiers that are easy to mix up, such as `EventId`, `FlowId`, `RuleId`, `RunId`, and `CorrelationId`.
Regular descriptive fields (for example `source`) should remain plain `string` values unless there is a clear confusion risk.
