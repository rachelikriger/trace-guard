import type { RawFlowDefinition, RawRule } from "../../models/raw/flow";
import type { ParseIssue } from "../../core/types/parseIssue";
import type { ParseResult } from "../../core/types/parseResult";
import type {
  ExpectedRule,
  FlowDefinition,
  ForbiddenRule,
  OrderRule,
  Rule,
} from "../../models/internal/flow";
import { failure, success } from "../../core/types/result";
import {
  asRecord,
  combineIssues,
  fail,
  mustGet,
  parseNonEmptyString,
  parsePositiveIntegerFromNumber,
  toBrand,
} from "../common/parsers";

const parseRawRule = (input: unknown, index: number): ParseResult<RawRule> => {
  const recordResult: ParseResult<Record<string, unknown>> = asRecord(input, `flow.rules[${index}]`);
  if (!recordResult.ok) {
    return recordResult;
  }

  const ruleRecord: Record<string, unknown> = recordResult.value;
  const kindResult: ParseResult<string> = parseNonEmptyString(ruleRecord.kind, `flow.rules[${index}].kind`);
  const idResult: ParseResult<string> = parseNonEmptyString(ruleRecord.id, `flow.rules[${index}].id`);

  const baseIssues: ParseIssue[] = combineIssues(kindResult, idResult);
  if (baseIssues.length > 0) {
    return failure(baseIssues);
  }

  const kind: string = mustGet(kindResult);
  const id: string = mustGet(idResult);

  if (kind === "expected") {
    const eventTypeResult: ParseResult<string> = parseNonEmptyString(
      ruleRecord.eventType,
      `flow.rules[${index}].eventType`,
    );
    if (!eventTypeResult.ok) {
      return eventTypeResult;
    }

    return success({
      kind: "expected",
      id,
      eventType: mustGet(eventTypeResult),
    });
  }

  if (kind === "forbidden") {
    const eventTypeResult: ParseResult<string> = parseNonEmptyString(
      ruleRecord.eventType,
      `flow.rules[${index}].eventType`,
    );
    if (!eventTypeResult.ok) {
      return eventTypeResult;
    }

    return success({
      kind: "forbidden",
      id,
      eventType: mustGet(eventTypeResult),
    });
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

    const issues: ParseIssue[] = combineIssues(beforeResult, afterResult);
    if (issues.length > 0) {
      return failure(issues);
    }

    return success({
      kind: "order",
      id,
      beforeEventType: mustGet(beforeResult),
      afterEventType: mustGet(afterResult),
    });
  }

  return fail(
    "invalid_literal",
    `flow.rules[${index}].kind`,
    "Rule kind must be one of: expected, forbidden, order.",
    kind,
  );
};

const parseRawFlowDefinition = (input: unknown): ParseResult<RawFlowDefinition> => {
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

  const parsedRules: RawRule[] = [];
  const ruleIssues: ParseIssue[] = [];
  rulesField.forEach((ruleInput: unknown, index: number) => {
    const parsedRule: ParseResult<RawRule> = parseRawRule(ruleInput, index);
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

  return success({
    flowId,
    version,
    rules: parsedRules,
    ...(description !== undefined ? { description } : {}),
  });
};

const normalizeRawRule = (rawRule: RawRule): Rule => {
  const ruleId = toBrand<"RuleId">(rawRule.id);

  if (rawRule.kind === "expected") {
    const rule: ExpectedRule = {
      kind: "expected",
      id: ruleId,
      eventType: toBrand<"EventType">(rawRule.eventType),
    };
    return rule;
  }

  if (rawRule.kind === "forbidden") {
    const rule: ForbiddenRule = {
      kind: "forbidden",
      id: ruleId,
      eventType: toBrand<"EventType">(rawRule.eventType),
    };
    return rule;
  }

  const rule: OrderRule = {
    kind: "order",
    id: ruleId,
    beforeEventType: toBrand<"EventType">(rawRule.beforeEventType),
    afterEventType: toBrand<"EventType">(rawRule.afterEventType),
  };
  return rule;
};

export const convertRawFlowDefinitionToFlowDefinition = (
  rawFlow: RawFlowDefinition,
): ParseResult<FlowDefinition> => {
  const flow: FlowDefinition = {
    flowId: toBrand<"FlowId">(rawFlow.flowId),
    version: rawFlow.version,
    rules: rawFlow.rules.map((rule: RawRule): Rule => normalizeRawRule(rule)),
    ...(rawFlow.description !== undefined ? { description: rawFlow.description } : {}),
  };

  return success(flow);
};

export const parseFlowDefinition = (input: unknown): ParseResult<FlowDefinition> => {
  const rawResult: ParseResult<RawFlowDefinition> = parseRawFlowDefinition(input);
  if (!rawResult.ok) {
    return rawResult;
  }

  return convertRawFlowDefinitionToFlowDefinition(rawResult.value);
};
