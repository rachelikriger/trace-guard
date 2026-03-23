import type { FlowId, RunId, CorrelationId } from '../../types/brand';
import type { TraceEvent } from '../../../models/internal/event';
import type { RuleEvaluation, RuleViolation } from './ruleEvaluation';

export type ValidationStatus = 'pass' | 'fail';

/** Limits validation and event fetching to a single run and/or correlation chain. */
export interface EventScope {
  readonly runId?: RunId;
  readonly correlationId?: CorrelationId;
}

export const matchesEventScope = (event: TraceEvent, scope: EventScope): boolean => {
  if (scope.runId !== undefined && event.runId !== scope.runId) {
    return false;
  }

  if (scope.correlationId !== undefined && event.correlationId !== scope.correlationId) {
    return false;
  }

  return true;
};

export const filterEventsByScope = (events: TraceEvent[], scope?: EventScope): TraceEvent[] => {
  if (scope === undefined) {
    return events;
  }

  return events.filter((event: TraceEvent): boolean => matchesEventScope(event, scope));
};

export interface ValidationReport {
  readonly status: ValidationStatus;
  readonly flowId: FlowId;
  readonly eventScope?: EventScope;
  readonly generatedAt: Date;
  readonly totalEvents: number;
  readonly scopedEvents: number;
  readonly evaluatedRuleCount: number;
  readonly passedRuleCount: number;
  readonly failedRuleCount: number;
  readonly ruleEvaluations: RuleEvaluation[];
  readonly violations: RuleViolation[];
}
