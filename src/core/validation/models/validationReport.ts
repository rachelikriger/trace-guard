import type { FlowId, RunId, CorrelationId } from "../../types/brand";
import type { RuleEvaluation, RuleViolation } from "./ruleEvaluation";

export type ValidationStatus = "pass" | "fail";

export interface ValidationSelector {
  readonly runId?: RunId;
  readonly correlationId?: CorrelationId;
}

export interface ValidationReport {
  readonly status: ValidationStatus;
  readonly flowId: FlowId;
  readonly selector?: ValidationSelector;
  readonly generatedAt: Date;
  readonly totalEvents: number;
  readonly scopedEvents: number;
  readonly evaluatedRuleCount: number;
  readonly passedRuleCount: number;
  readonly failedRuleCount: number;
  readonly ruleEvaluations: RuleEvaluation[];
  readonly violations: RuleViolation[];
}
