import type { ParseIssue } from "../../core/errors/parseIssue";
import type {
  ExpectedRule,
  FlowDefinition,
  ForbiddenRule,
  OrderRule,
  Rule,
} from "../../core/models/flow";
import { failure, success } from "../../core/types/result";
import {
  asRecord,
  combineIssues,
  fail,
  mustGet,
  parseNonEmptyString,
  parsePositiveIntegerFromNumber,
  toBrand,
  type ParseResult,
} from "../common/parsers";

const parseRule = (input: unknown, index: number): ParseResult<Rule> => {
  const recordResult: ParseResult<Record<string, unknown>> = asRecord(
    input,
    `flow.rules[${index}]`,
  );
  if (!recordResult.ok) {
    return recordResult;
  }

  const ruleRecord: Record<string, unknown> = recordResult.value;
  const kindResult: ParseResult<string> = parseNonEmptyString(
    ruleRecord.kind,
    `flow.rules[${index}].kind`,
  );
  const idResult: ParseResult<string> = parseNonEmptyString(
    ruleRecord.id,
    `flow.rules[${index}].id`,
  );

  const baseIssues: ParseIssue[] = combineIssues(
    kindResult,
    idResult,
  );
  if (baseIssues.length > 0) {
    return failure(baseIssues);
  }

  const kind: string = mustGet(kindResult);
  const id: string = mustGet(idResult);
  const ruleId = toBrand<"RuleId">(id);

  if (kind === "expected") {
    const eventTypeResult: ParseResult<string> = parseNonEmptyString(
      ruleRecord.eventType,
      `flow.rules[${index}].eventType`,
    );
    if (!eventTypeResult.ok) {
      return eventTypeResult;
    }

    const rule: ExpectedRule = {
      kind: "expected",
      id: ruleId,
      eventType: toBrand<"EventType">(mustGet(eventTypeResult)),
    };
    return success(rule);
  }

  if (kind === "forbidden") {
    const eventTypeResult: ParseResult<string> = parseNonEmptyString(
      ruleRecord.eventType,
      `flow.rules[${index}].eventType`,
    );
    if (!eventTypeResult.ok) {
      return eventTypeResult;
    }

    const rule: ForbiddenRule = {
      kind: "forbidden",
      id: ruleId,
      eventType: toBrand<"EventType">(mustGet(eventTypeResult)),
    };
    return success(rule);
  }

  if (kind === "order") {
    const beforeResult: ParseResult<string> = parseNonEmptyString(
      ruleRecord.beforeEventType,
      `flow.rules[${index}].beforeEventType`,
    );
    const afterResult: ParseResult<string> = parseNonEmptyString(
      ruleRecord.afterEventType,
      `flow.rules[${index}].afterEventType`,
    );

    const issues: ParseIssue[] = combineIssues(
      beforeResult,
      afterResult,
    );
    if (issues.length > 0) {
      return failure(issues);
    }

    const rule: OrderRule = {
      kind: "order",
      id: ruleId,
      beforeEventType: toBrand<"EventType">(mustGet(beforeResult)),
      afterEventType: toBrand<"EventType">(mustGet(afterResult)),
    };
    return success(rule);
  }

  return fail(
    "invalid_literal",
    `flow.rules[${index}].kind`,
    "Rule kind must be one of: expected, forbidden, order.",
    kind,
  );
};

export const parseFlowDefinition = (input: unknown): ParseResult<FlowDefinition> => {
  const recordResult: ParseResult<Record<string, unknown>> = asRecord(input, "flow");
  if (!recordResult.ok) {
    return recordResult;
  }

  const flowRecord: Record<string, unknown> = recordResult.value;
  const flowIdResult: ParseResult<string> = parseNonEmptyString(flowRecord.flowId, "flow.flowId");
  const versionResult: ParseResult<number> = parsePositiveIntegerFromNumber(
    flowRecord.version,
    "flow.version",
  );

  const descriptionField: unknown = flowRecord.description;
  const descriptionResult: ParseResult<string | undefined> =
    descriptionField === undefined
      ? success(undefined)
      : parseNonEmptyString(descriptionField, "flow.description");

  const rulesField: unknown = flowRecord.rules;
  if (!Array.isArray(rulesField)) {
    return fail("invalid_type", "flow.rules", "Expected an array of rules.", rulesField);
  }

  const parsedRules: Rule[] = [];
  const ruleIssues: ParseIssue[] = [];
  rulesField.forEach((ruleInput: unknown, index: number) => {
    const parsedRule: ParseResult<Rule> = parseRule(ruleInput, index);
    if (parsedRule.ok) {
      parsedRules.push(parsedRule.value);
      return;
    }

    ruleIssues.push(...parsedRule.error);
  });

  const topLevelIssues: ParseIssue[] = combineIssues(
    flowIdResult,
    versionResult,
    descriptionResult,
  );
  const issues: ParseIssue[] = [...topLevelIssues, ...ruleIssues];
  if (issues.length > 0) {
    return failure(issues);
  }

  const flowId: string = mustGet(flowIdResult);
  const version: number = mustGet(versionResult);
  const description: string | undefined = mustGet(descriptionResult);

  const flow: FlowDefinition = {
    flowId: toBrand<"FlowId">(flowId),
    version,
    rules: parsedRules,
    ...(description !== undefined ? { description } : {}),
  };

  return success(flow);
};
