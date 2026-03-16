# Trace-Guard Roadmap

## Phase 3: Runner and Polling Orchestration (Next)

Goal: execute validation repeatedly over time until success or timeout.

Planned scope:

- introduce `EventSource` contract
- implement `MockEventSource` for iterative batches
- implement `ValidationRunner` orchestration:
  - poll
  - merge events
  - run validation
  - stop on pass or timeout
- add runner-focused tests (timing, polling, timeout semantics)

Out of scope for this phase:

- real Elastic integration
- final CLI UX polish

## Phase 4: CLI Integration

Goal: expose a practical command interface for running validations.

Planned scope:

- CLI entrypoint and argument parsing
- flow/config loading from files/flags
- invoke runner and print clear output
- stable exit codes for CI usage

## Phase 5: External Source Adapters

Goal: integrate real data sources without changing core logic.

Planned scope:

- Elastic adapter implementing `EventSource`
- adapter parsing/mapping tests
- optional pagination/query configuration

## Phase 6: Reporting and Operability

Goal: improve practical usage in pipelines and investigations.

Planned scope:

- richer report formatting (human + machine output)
- optional structured logs/metrics
- documentation and examples for real-world flow definitions

## Guiding Principle for All Future Phases

No temporary architecture rewrites:

- each phase should be a valid slice of the final product
- keep boundaries stable
- evolve features, not foundational contracts

## Cross-Cutting Design Tracks

In parallel with feature phases, maintain these design tracks:

- table-driven test patterns for evaluator-heavy logic
- UI automation integration pattern (UI action -> correlation ID -> Trace-Guard validation)
- richer order/sequence semantics via additive rule kinds (not by overloading one rule)

Detailed rationale and recommendations are documented in:

- [Design Notes](DESIGN_NOTES.md)
