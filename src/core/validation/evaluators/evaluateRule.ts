import type { TraceEvent } from "../../../models/internal/event";
import type { Rule } from "../../../models/internal/flow";
import type { RuleEvaluation } from "../models/ruleEvaluation";
import { evaluateExpectedRule } from "./evaluateExpectedRule";
import { evaluateForbiddenRule } from "./evaluateForbiddenRule";
import { evaluateOrderRule } from "./evaluateOrderRule";

export const evaluateRule = (rule: Rule, events: TraceEvent[]): RuleEvaluation => {
  switch (rule.kind) {
    case "expected":
      return evaluateExpectedRule(rule, events);
    case "forbidden":
      return evaluateForbiddenRule(rule, events);
    case "order":
      return evaluateOrderRule(rule, events);
  }
};
