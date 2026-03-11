import type { TraceEvent } from "../../models/event";
import type { ExpectedRule } from "../../models/flow";
import type { RuleEvaluation, RuleViolation } from "../models/ruleEvaluation";
import { buildStats } from "./evaluatorUtils";

export const evaluateExpectedRule = (
  rule: ExpectedRule,
  events: TraceEvent[],
): RuleEvaluation => {
  const matchedEvents: TraceEvent[] = events.filter(
    (event: TraceEvent): boolean => event.eventType === rule.eventType,
  );
  const evidenceEventIds = matchedEvents.map((event: TraceEvent) => event.id);

  if (matchedEvents.length === 0) {
    const violation: RuleViolation = {
      ruleId: rule.id,
      kind: rule.kind,
      code: "expected_missing",
      message: `Expected event type "${rule.eventType}" was not found.`,
      evidenceEventIds: [],
    };

    return {
      ruleId: rule.id,
      kind: rule.kind,
      passed: false,
      evidenceEventIds: [],
      violations: [violation],
      stats: buildStats([]),
    };
  }

  return {
    ruleId: rule.id,
    kind: rule.kind,
    passed: true,
    evidenceEventIds,
    violations: [],
    stats: buildStats(matchedEvents),
  };
};
