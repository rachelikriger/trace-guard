# trace-guard
Trace-Guard is a CLI tool for validating system flows through logs and events.  It verifies that expected events occurred, in the correct order, using observability data.

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
