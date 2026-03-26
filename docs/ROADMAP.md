# Trace-Guard Roadmap

## Phase 3: Runner and Polling Orchestration (Completed)

Goal: execute validation repeatedly over time until success or timeout.

Implemented scope:

- introduced `EventSource` contract
- implemented `MockEventSource` for iterative batches
- implemented `ValidationRunner` orchestration:
  - poll
  - dedupe + accumulate events
  - run validation
  - stop on pass or timeout
- added runner-focused tests (timing, polling, timeout semantics)
- added demo runner script for iteration-by-iteration learning

Still out of scope:

- real Elastic integration
- final CLI UX polish

## Phase 4: CLI Integration (Baseline Completed)

Goal: expose a practical command interface for running validations.

Completed baseline scope:

- CLI entrypoint and argument parsing for `run`
- flow/config/events loading from files
- runner invocation and human-readable output
- stable exit codes for pass/fail/input error paths

Remaining polish:

- richer CLI help and ergonomics
- machine-friendly output mode (JSON)
- dedicated CLI integration tests

## Phase 5: External Source Adapters (Completed)

Goal: integrate real data sources without changing core logic.

Completed scope:

- Elastic adapter implementing `EventSource` (`ElasticEventSource`)
- thin Elastic client contract and HTTP implementation (`ElasticClient`, `ElasticHttpClient`)
- isolated hit-to-`TraceEvent` parsing via existing event parser
- adapter-focused tests for query building, cursor semantics, and mapping failures
- basic query configuration (index, limit, scope/since filters)

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
