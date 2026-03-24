import type { TraceEvent } from '../../../models/internal/event';
import type { ForbiddenRule } from '../../../models/internal/flow';
import type { RuleEvaluation, RuleViolation } from '../models/ruleEvaluation';
import { buildStats } from './evaluatorUtils';

export const evaluateForbiddenRule = (rule: ForbiddenRule, events: TraceEvent[]): RuleEvaluation => {
  const matchedEvents: TraceEvent[] = events.filter((event: TraceEvent): boolean => event.eventType === rule.eventType);
  const evidenceEventIds = matchedEvents.map((event: TraceEvent) => event.id);

  if (matchedEvents.length > 0) {
    const violation: RuleViolation = {
      ruleId: rule.id,
      kind: rule.kind,
      code: 'forbidden_present',
      message: `Forbidden event type "${rule.eventType}" was found.`,
      evidenceEventIds,
    };

    return {
      ruleId: rule.id,
      kind: rule.kind,
      passed: false,
      evidenceEventIds,
      violations: [violation],
      stats: buildStats(matchedEvents),
    };
  }

  return {
    ruleId: rule.id,
    kind: rule.kind,
    passed: true,
    evidenceEventIds: [],
    violations: [],
    stats: buildStats([]),
  };
};
