import type { TraceEvent } from "../../models/internal/event";
import type { FlowDefinition } from "../../models/internal/flow";
import type { RuleEvaluation, RuleViolation } from "./models/ruleEvaluation";
import type { ValidationReport, ValidationSelector } from "./models/validationReport";
import { evaluateRule } from "./evaluators/evaluateRule";

const applySelector = (events: TraceEvent[], selector?: ValidationSelector): TraceEvent[] => {
  if (selector === undefined) {
    return events;
  }

  return events.filter((event: TraceEvent): boolean => {
    if (selector.runId !== undefined && event.runId !== selector.runId) {
      return false;
    }

    if (
      selector.correlationId !== undefined &&
      event.correlationId !== selector.correlationId
    ) {
      return false;
    }

    return true;
  });
};

export const validateFlow = (
  flow: FlowDefinition,
  events: TraceEvent[],
  selector?: ValidationSelector,
): ValidationReport => {
  const scopedEvents: TraceEvent[] = applySelector(events, selector);
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
    ...(selector !== undefined ? { selector } : {}),
  };
};
