# Trace-Guard Design Notes

This document captures architectural decisions we may implement later.
It is intentionally focused on "why/when" rather than immediate implementation.

## 1) Table-Driven / Data-Driven Tests

### Context

Many evaluator tests differ mostly by input + expected output shape.
As rule variants grow, duplication risk increases.

### Pros

- easier to add many scenarios quickly
- consistent assertion logic across cases
- good fit for rule semantics matrices (missing/present/order combinations)

### Cons

- failures can be harder to read if case names are weak
- can hide intent when each case has complex setup
- not ideal for narrative end-to-end flow explanations

### Recommendation

Use a hybrid approach:

- keep current explicit scenario tests for readability (baseline examples)
- gradually add table-driven tests for evaluator edge matrices
- do not rewrite all tests at once

### Where It Fits Best

- `evaluateExpectedRule`
- `evaluateForbiddenRule`
- `evaluateOrderRule`
- future rule kinds with combinatorial behavior

## 2) UI Automation Integration

### Goal

Use Trace-Guard as a backend-event truth layer in addition to UI assertions.

### Proposed Pattern

1. UI test triggers a user action.
2. UI flow captures `correlationId` or `runId`.
3. UI test invokes Trace-Guard runner with selector.
4. Trace-Guard validates observability events against a flow definition.

### Architectural Readiness (Current)

Already supported by current architecture:

- selector-based validation (`runId` / `correlationId`)
- runner orchestration over polling + timeout
- source abstraction (`EventSource`) for plugging real backends

### Small Future Enhancements

- stable machine-friendly output mode for CI consumption
- explicit exit code contracts for pass/fail/timeout
- optional report artifact file path for UI pipelines

## 3) Order Rule Evolution

### Current v1 Semantics

`first(before) < first(after)` with both event types required.

### Why Keep It for v1

- deterministic and easy to reason about
- simple to debug
- minimal ambiguity for initial users

### Future Extensions Worth Considering

- any-valid-pair semantics (exists `before -> after`)
- strict global ordering (`all before` before `all after`)
- multi-step sequences (`A -> B -> C`)
- bounded windows (`A before B within N seconds`)

### Recommendation

Do not overload one `order` rule with flags.
Instead, add new explicit rule kinds over time.

This preserves:

- clear semantics per rule type
- strong typing and explicit evaluator contracts
- easier testing and lower regression risk

## Implementation Strategy Principle

When adopting these notes:

- evolve additively
- keep core validation boundaries stable
- preserve backward compatibility for existing flow definitions when possible
