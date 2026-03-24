# Trace-Guard Architecture

## Goal

Trace-Guard validates whether a system flow actually happened, based on observed events/logs.
The tool checks event existence, forbidden events, and ordering constraints.

## Core Design Principle

Boundary-in -> Parse/Convert once -> Use strong internal models in core logic.

This means:

- External input is accepted as raw models.
- Parsing/conversion enforces shape and invariants.
- Validation logic runs only on normalized internal models.

## Architecture Layers

### 1) Raw Models (`src/models/raw`)

Represents untrusted external inputs (JSON/CLI/source adapters).
Examples: raw event timestamps are strings, numeric fields may arrive as strings.

### 2) Internal Models (`src/models/internal`)

Represents strongly typed domain objects used by core logic.
Examples: `timestamp: Date`, branded IDs, typed rules.

### 3) Parsing/Conversion (`src/parsing`)

Responsible for:

- parsing unknown input
- validating required fields and constraints
- converting raw models to internal models
- returning structured parsing outcomes (`ParseResult`, `ParseIssue`)

### 4) Validation Core (`src/core/validation`)

Contains business validation logic over internal models.

- Rule evaluators:
  - expected
  - forbidden
  - order
- Rule dispatcher (`evaluateRule`) using a typed registry
- Flow aggregator (`validateFlow`) producing `ValidationReport`

### 5) Shared Core Types (`src/core/types`)

Reusable foundational types:

- `Result`
- `ParseResult`
- `ParseIssue`
- branded identifier types

## Validation Rule Semantics (Current)

- `expected`: at least one event of the given type must exist.
- `forbidden`: no event of the given type may exist.
- `order` (v1): `first(before) < first(after)` and both sides must exist.

## Current Boundaries

Implemented:

- model boundaries (raw/internal)
- parsing/conversion pipeline
- validation engine and report model
- runner/polling orchestration with `EventSource` and timeout/pass semantics
- CLI command surface (`run`) with file-based inputs and stable exit codes
- tests for rule evaluators, flow aggregation, and runner behavior

Not implemented yet:

- concrete external source adapters (Elastic, etc.)
- advanced reporting modes and CLI UX polish
