import type { TraceEvent } from "../../../models/internal/event";
import type { Rule } from "../../../models/internal/flow";
import type { RuleEvaluation } from "../models/ruleEvaluation";
import { evaluateExpectedRule } from "./evaluateExpectedRule";
import { evaluateForbiddenRule } from "./evaluateForbiddenRule";
import { evaluateOrderRule } from "./evaluateOrderRule";

type RuleEvaluator = (rule: Rule, events: TraceEvent[]) => RuleEvaluation;
type RuleByKind<K extends Rule["kind"]> = Extract<Rule, { kind: K }>;

const isRuleKind = <K extends Rule["kind"]>(rule: Rule, kind: K): rule is RuleByKind<K> =>
  rule.kind === kind;

const createKindEvaluator = <K extends Rule["kind"]>(
  kind: K,
  evaluator: (rule: RuleByKind<K>, events: TraceEvent[]) => RuleEvaluation,
): RuleEvaluator => {
  return (rule: Rule, events: TraceEvent[]): RuleEvaluation => {
    if (!isRuleKind(rule, kind)) {
      throw new Error(`Rule evaluator mismatch: expected "${kind}" but got "${rule.kind}".`);
    }

    return evaluator(rule, events);
  };
};

const evaluatorRegistry = {
  expected: createKindEvaluator("expected", evaluateExpectedRule),
  forbidden: createKindEvaluator("forbidden", evaluateForbiddenRule),
  order: createKindEvaluator("order", evaluateOrderRule),
} satisfies Record<Rule["kind"], RuleEvaluator>;

export const evaluateRule = (rule: Rule, events: TraceEvent[]): RuleEvaluation => {
  return evaluatorRegistry[rule.kind](rule, events);
};
