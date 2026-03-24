# Advanced Log Ingestion Notes

This document preserves future-facing ingestion ideas for Trace-Guard.
It is intentionally architecture-oriented and not an implementation plan for the current phase.

## Ingestion Pipeline (Conceptual)

raw logs
-> extraction (select relevant records)
-> normalization (mapping + cleanup)
-> build canonical event
-> validation

Each stage solves a different class of problems and should remain conceptually separate.

The canonical target model in Trace-Guard is `RawTraceEvent` / `TraceEvent`.
All ingestion strategies must eventually produce this shape before entering core validation.

## 1) Why Basic Field Mapping Is Not Enough

A simple `fieldMapping` (one path per canonical field) is useful for happy-path integrations, but real log/trace data is rarely stable enough for one-to-one mapping only.

In production environments, schemas drift, field names vary by source, and data quality differs across teams and systems.
Without additional ingestion capabilities, integrations become fragile and require frequent manual fixes.

## 2) Real-World Data Problems

- inconsistent schemas across sources and environments
- different names for the same concept (`eventType`, `type`, `event.name`)
- missing fields in some events
- noisy or nested payloads with mixed quality
- operational noise (duplicates, partial records, non-domain events)

## 3) Proposed FieldMapping Extensions

### Fallback Fields (Path Lists)

Allow multiple candidate paths per canonical field, evaluated in order.
Example: `eventTypeFields: ["event.name", "eventType", "type"]`.

This reduces breakage when a source changes naming conventions or when multiple sources are consumed together.

### Field Transforms

Support lightweight transforms per canonical field after extraction.
Typical examples:

- timestamp normalization (ISO, epoch milliseconds, epoch seconds)
- event type normalization (trim, case normalization)
- ID normalization (trim, consistent string formatting)

Transforms should stay small and deterministic to keep ingestion behavior understandable.

### Field Policy (required / optional / default)

Define expected behavior per canonical field:

- `required`: reject event when missing/invalid
- `optional`: allow missing field
- `default`: fill with configured value when missing

This makes ingestion behavior explicit and avoids hidden assumptions.

### Parser Modes (strict vs lenient)

- `strict`: fail fast on invalid event shape
- `lenient`: skip invalid events and continue processing

Lenient mode is often more practical in noisy environments, especially for long-running validation jobs.

### Ingestion Quality Report

Produce a structured report for ingestion outcomes, such as:

- total events seen
- accepted vs dropped counts
- top drop reasons by field/path/type mismatch
- sample problematic records (sanitized)

This turns ingestion issues into observable operational signals.
This is critical for maintaining integrations over time; without visibility, ingestion failures are hard to diagnose.

## 4) More Advanced Extensions

### Canonical Envelope with Metadata

Wrap normalized events with metadata fields such as:

- original raw input (`raw`)
- ingestion timestamp (`ingestedAt`)
- source identity
- mapping version used

This improves debugging, traceability, and auditability.

### Mapping Versioning

Treat mapping configuration as versioned contract.
Versioning enables controlled rollout, rollback, and compatibility tracking across teams.

### Ordering, Late Events, and Duplicates

Plan for event-time realities:

- out-of-order delivery
- late arrivals
- duplicate records

Behavior should be policy-driven (for example dedupe strategy and time-window handling).

### PII and Security Considerations

Ingestion/reporting should avoid leaking sensitive data.
Key safeguards:

- masking/redaction for known sensitive paths
- safe logging defaults
- least-privilege handling of raw payload access

## 5) Recommended Working Approach

Not every ingestion problem should be solved by configuration alone.

- Use mapping when differences are structural (field names, nesting, straightforward normalization).
- Use adapters when logic is required, values must be derived, or input is inconsistent/ambiguous.
- Prefer a hybrid model: mapping-first for speed, adapters for correctness where needed.

This keeps the core validation engine stable while allowing source-specific evolution at the boundaries.

## 6) Current Project Decision

For the current project phase:

- we do **not** implement advanced ingestion mechanisms yet
- we keep ingestion intentionally simple
- we focus on core validation features and product stabilization
- we revisit advanced ingestion before connecting to real production systems

This note exists to preserve direction and reduce rediscovery cost later.
