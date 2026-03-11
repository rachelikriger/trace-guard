import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateFlow } from "../../../core/validation/validateFlow";
import { createEvent, createFlow } from "../../helpers/factories";
import { parseRunnerConfigInput } from "../../../parsing/config/parseRunnerConfig";

describe("validateFlow", () => {
  const createSampleFlow = () =>
    createFlow({
      flowId: "flow-validate",
      rules: [
        { kind: "expected", id: "rule-expected", eventType: "PAYMENT_STARTED" },
        { kind: "forbidden", id: "rule-forbidden", eventType: "PAYMENT_FAILED" },
        {
          kind: "order",
          id: "rule-order",
          beforeEventType: "PAYMENT_STARTED",
          afterEventType: "PAYMENT_COMPLETED",
        },
      ],
    });

  it("returns pass when all rules pass", () => {
    const flow = createSampleFlow();
    const events = [
      createEvent({
        id: "event-1",
        eventType: "PAYMENT_STARTED",
        timestamp: "2026-03-10T10:00:00.000Z",
        runId: "run-a",
        correlationId: "corr-a",
      }),
      createEvent({
        id: "event-2",
        eventType: "PAYMENT_COMPLETED",
        timestamp: "2026-03-10T10:01:00.000Z",
        runId: "run-a",
        correlationId: "corr-a",
      }),
    ];

    const report = validateFlow(flow, events);

    assert.equal(report.status, "pass");
    assert.equal(report.failedRuleCount, 0);
    assert.equal(report.passedRuleCount, 3);
    assert.equal(report.violations.length, 0);
    assert.equal(report.ruleEvaluations.length, 3);
  });

  it("returns fail and aggregates violations when multiple rules fail", () => {
    const flow = createSampleFlow();
    const events = [
      createEvent({
        id: "event-failed",
        eventType: "PAYMENT_FAILED",
        timestamp: "2026-03-10T10:00:00.000Z",
      }),
      createEvent({
        id: "event-completed",
        eventType: "PAYMENT_COMPLETED",
        timestamp: "2026-03-10T10:01:00.000Z",
      }),
    ];

    const report = validateFlow(flow, events);

    assert.equal(report.status, "fail");
    assert.equal(report.failedRuleCount, 3);
    assert.equal(report.passedRuleCount, 0);
    assert.equal(report.violations.length >= 3, true);
  });

  it("applies selector and evaluates only scoped events", () => {
    const flow = createSampleFlow();
    const events = [
      createEvent({
        id: "event-run-a-started",
        eventType: "PAYMENT_STARTED",
        timestamp: "2026-03-10T10:00:00.000Z",
        runId: "run-a",
      }),
      createEvent({
        id: "event-run-a-completed",
        eventType: "PAYMENT_COMPLETED",
        timestamp: "2026-03-10T10:01:00.000Z",
        runId: "run-a",
      }),
      createEvent({
        id: "event-run-b-failed",
        eventType: "PAYMENT_FAILED",
        timestamp: "2026-03-10T10:02:00.000Z",
        runId: "run-b",
      }),
    ];

    const parsedConfig = parseRunnerConfigInput({
      runId: "run-a",
      timeoutMs: 1000,
      pollMs: 100,
    });
    if (!parsedConfig.ok) {
      throw new Error(`Failed to build selector fixture: ${JSON.stringify(parsedConfig.error)}`);
    }
    if (parsedConfig.value.runId === undefined) {
      throw new Error("Expected runId in parsed config fixture.");
    }

    const report = validateFlow(flow, events, { runId: parsedConfig.value.runId });

    assert.equal(report.status, "pass");
    assert.equal(report.totalEvents, 3);
    assert.equal(report.scopedEvents, 2);
    assert.equal(report.selector?.runId, parsedConfig.value.runId);
  });
});
