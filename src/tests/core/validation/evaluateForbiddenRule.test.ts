import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateForbiddenRule } from "../../../core/validation/evaluators/evaluateForbiddenRule";
import { createEvent, createFlow } from "../../helpers/factories";

describe("evaluateForbiddenRule", () => {
  it("passes when forbidden event type does not exist", () => {
    const flow = createFlow({
      flowId: "flow-forbidden-pass",
      rules: [{ kind: "forbidden", id: "rule-1", eventType: "PAYMENT_FAILED" }],
    });
    const rule = flow.rules[0];
    if (rule === undefined || rule.kind !== "forbidden") {
      throw new Error("Fixture produced wrong rule type.");
    }

    const events = [
      createEvent({
        id: "event-1",
        eventType: "PAYMENT_COMPLETED",
        timestamp: "2026-03-10T10:00:00.000Z",
      }),
    ];

    const result = evaluateForbiddenRule(rule, events);

    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
    assert.equal(result.evidenceEventIds.length, 0);
    assert.equal(result.stats.matchedCount, 0);
  });

  it("fails with forbidden_present when forbidden event appears", () => {
    const flow = createFlow({
      flowId: "flow-forbidden-fail",
      rules: [{ kind: "forbidden", id: "rule-1", eventType: "PAYMENT_FAILED" }],
    });
    const rule = flow.rules[0];
    if (rule === undefined || rule.kind !== "forbidden") {
      throw new Error("Fixture produced wrong rule type.");
    }

    const events = [
      createEvent({
        id: "event-2",
        eventType: "PAYMENT_FAILED",
        timestamp: "2026-03-10T10:02:00.000Z",
      }),
    ];

    const result = evaluateForbiddenRule(rule, events);
    const violation = result.violations[0];
    if (violation === undefined) {
      throw new Error("Expected a violation but got none.");
    }

    assert.equal(result.passed, false);
    assert.equal(result.violations.length, 1);
    assert.equal(violation.code, "forbidden_present");
    assert.equal(result.evidenceEventIds.length, 1);
    assert.equal(result.stats.matchedCount, 1);
  });
});
