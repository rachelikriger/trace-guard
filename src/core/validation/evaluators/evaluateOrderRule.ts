import type { TraceEvent } from "../../models/event";
import type { OrderRule } from "../../models/flow";
import type { RuleEvaluation, RuleViolation } from "../models/ruleEvaluation";
import { buildStats } from "./evaluatorUtils";

const getEarliestEvent = (events: TraceEvent[]): TraceEvent | undefined =>
  events.reduce<TraceEvent | undefined>((earliest, current) => {
    if (earliest === undefined) {
      return current;
    }

    return current.timestamp.getTime() < earliest.timestamp.getTime() ? current : earliest;
  }, undefined);

export const evaluateOrderRule = (rule: OrderRule, events: TraceEvent[]): RuleEvaluation => {
  const beforeEvents: TraceEvent[] = events.filter(
    (event: TraceEvent): boolean => event.eventType === rule.beforeEventType,
  );
  const afterEvents: TraceEvent[] = events.filter(
    (event: TraceEvent): boolean => event.eventType === rule.afterEventType,
  );

  const violations: RuleViolation[] = [];
  if (beforeEvents.length === 0) {
    violations.push({
      ruleId: rule.id,
      kind: rule.kind,
      code: "order_missing_before",
      message: `Order rule requires "${rule.beforeEventType}" before "${rule.afterEventType}", but no "${rule.beforeEventType}" event was found.`,
      evidenceEventIds: afterEvents.map((event: TraceEvent) => event.id),
    });
  }

  if (afterEvents.length === 0) {
    violations.push({
      ruleId: rule.id,
      kind: rule.kind,
      code: "order_missing_after",
      message: `Order rule requires "${rule.beforeEventType}" before "${rule.afterEventType}", but no "${rule.afterEventType}" event was found.`,
      evidenceEventIds: beforeEvents.map((event: TraceEvent) => event.id),
    });
  }

  const earliestBefore: TraceEvent | undefined = getEarliestEvent(beforeEvents);
  const earliestAfter: TraceEvent | undefined = getEarliestEvent(afterEvents);
  if (
    earliestBefore !== undefined &&
    earliestAfter !== undefined &&
    earliestBefore.timestamp.getTime() > earliestAfter.timestamp.getTime()
  ) {
    violations.push({
      ruleId: rule.id,
      kind: rule.kind,
      code: "order_incorrect_sequence",
      message: `Expected "${rule.beforeEventType}" to occur before "${rule.afterEventType}".`,
      evidenceEventIds: [earliestBefore.id, earliestAfter.id],
    });
  }

  const matchedEvents: TraceEvent[] = [...beforeEvents, ...afterEvents];
  const evidenceEventIds = matchedEvents.map((event: TraceEvent) => event.id);

  return {
    ruleId: rule.id,
    kind: rule.kind,
    passed: violations.length === 0,
    evidenceEventIds,
    violations,
    stats: buildStats(matchedEvents),
  };
};
