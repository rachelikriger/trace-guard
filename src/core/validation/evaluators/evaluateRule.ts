import type { TraceEvent } from "../../models/event";
import type { Rule } from "../../models/flow";
import type { RuleEvaluation } from "../models/ruleEvaluation";
import { evaluateExpectedRule } from "./evaluateExpectedRule";
import { evaluateForbiddenRule } from "./evaluateForbiddenRule";
import { evaluateOrderRule } from "./evaluateOrderRule";

const assertNever = (value: never): never => {
  throw new Error(`Unhandled rule kind: ${JSON.stringify(value)}`);
};

export const evaluateRule = (rule: Rule, events: TraceEvent[]): RuleEvaluation => {
  switch (rule.kind) {
    case "expected":
      return evaluateExpectedRule(rule, events);
    case "forbidden":
      return evaluateForbiddenRule(rule, events);
    case "order":
      return evaluateOrderRule(rule, events);
    default:
      return assertNever(rule);
  }
};
