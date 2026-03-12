import type { TraceEvent } from "../../../models/internal/event";
import type { RuleEvaluationStats } from "../models/ruleEvaluation";

export const buildStats = (matchedEvents: TraceEvent[]): RuleEvaluationStats => {
  if (matchedEvents.length === 0) {
    return { matchedCount: 0 };
  }

  const timestamps: number[] = matchedEvents.map(
    (event: TraceEvent): number => event.timestamp.getTime(),
  );
  const firstMatchedAt: Date = new Date(Math.min(...timestamps));
  const lastMatchedAt: Date = new Date(Math.max(...timestamps));

  return {
    matchedCount: matchedEvents.length,
    firstMatchedAt,
    lastMatchedAt,
  };
};
