import type { TraceEvent } from "../../models/internal/event";
import type { FlowDefinition } from "../../models/internal/flow";
import type { RuleEvaluation, RuleViolation } from "./models/ruleEvaluation";
import {
  filterEventsByScope,
  type EventScope,
  type ValidationReport,
} from "./models/validationReport";
import { evaluateRule } from "./evaluators/evaluateRule";

export const validateFlow = (
  flow: FlowDefinition,
  events: TraceEvent[],
  eventScope?: EventScope,
): ValidationReport => {
  const scopedEvents: TraceEvent[] = filterEventsByScope(events, eventScope);
  const ruleEvaluations: RuleEvaluation[] = flow.rules.map((rule) => evaluateRule(rule, scopedEvents));
  const violations: RuleViolation[] = ruleEvaluations.flatMap(
    (evaluation: RuleEvaluation): RuleViolation[] => evaluation.violations,
  );

  const failedRuleCount: number = ruleEvaluations.filter(
    (evaluation: RuleEvaluation): boolean => !evaluation.passed,
  ).length;
  const passedRuleCount: number = ruleEvaluations.length - failedRuleCount;

  return {
    status: failedRuleCount === 0 ? "pass" : "fail",
    flowId: flow.flowId,
    generatedAt: new Date(),
    totalEvents: events.length,
    scopedEvents: scopedEvents.length,
    evaluatedRuleCount: ruleEvaluations.length,
    passedRuleCount,
    failedRuleCount,
    ruleEvaluations,
    violations,
    ...(eventScope !== undefined ? { eventScope } : {}),
  };
};
