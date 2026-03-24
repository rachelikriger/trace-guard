# CLI Examples

This folder contains small runnable examples for `trace-guard run`.

## 1) PASS example

Represents a successful flow: expected and order rules are satisfied, and no forbidden event appears.

Files:

- `flow.pass.json`
- `config.pass.json`
- `events.pass.json`

Run:

```bash
npm run cli -- run --flow examples/flow.pass.json --config examples/config.pass.json --events examples/events.pass.json
```

Expected output (short):

- `Status: PASS`
- rules summary where all rules passed
- `Violations: none`

## 2) TIMEOUT example

Represents an incomplete flow: `PAYMENT_COMPLETED` never arrives before timeout.

Files:

- `flow.timeout.json`
- `config.timeout.json`
- `events.timeout.json`

Run:

```bash
npm run cli -- run --flow examples/flow.timeout.json --config examples/config.timeout.json --events examples/events.timeout.json
```

Expected output (short):

- `Status: TIMEOUT`
- failed rule summary
- violation for missing expected event

## 3) Violation example (forbidden event)

Represents a clear rule violation: forbidden event `PAYMENT_FAILED` appears in input events.

Files:

- `flow.violation.json`
- `config.violation.json`
- `events.violation.json`

Run:

```bash
npm run cli -- run --flow examples/flow.violation.json --config examples/config.violation.json --events examples/events.violation.json
```

Expected output (short):

- `Status: TIMEOUT`
- violations list includes `forbidden_present`

Note:

- Current runner terminal statuses are `PASS` and `TIMEOUT`.
- Rule failures are shown through violations in the output.
