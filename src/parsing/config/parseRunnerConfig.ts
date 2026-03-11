import type { RawRunnerConfig } from "../../contracts/raw/runnerConfig";
import type { ParseIssue } from "../../core/errors/parseIssue";
import type { RunnerConfig } from "../../core/models/runnerConfig";
import { failure, success } from "../../core/types/result";
import {
  asRecord,
  combineIssues,
  fail,
  parseOptionalIsoDate,
  parseOptionalPositiveInteger,
  parseOptionalNonEmptyString,
  parsePositiveInteger,
  toBrand,
  type ParseResult,
} from "../common/parsers";

interface RunnerConfigInputShape {
  readonly runId: unknown;
  readonly correlationId: unknown;
  readonly timeoutMs: unknown;
  readonly pollMs: unknown;
  readonly limit: unknown;
  readonly since: unknown;
}

const parseRunnerConfigShape = (input: RunnerConfigInputShape): ParseResult<RunnerConfig> => {
  const runIdResult: ParseResult<string | undefined> = parseOptionalNonEmptyString(
    input.runId,
    "config.runId",
  );
  const correlationIdResult: ParseResult<string | undefined> = parseOptionalNonEmptyString(
    input.correlationId,
    "config.correlationId",
  );
  const timeoutResult: ParseResult<number> = parsePositiveInteger(
    input.timeoutMs,
    "config.timeoutMs",
  );
  const pollResult: ParseResult<number> = parsePositiveInteger(input.pollMs, "config.pollMs");
  const limitResult: ParseResult<number | undefined> = parseOptionalPositiveInteger(
    input.limit,
    "config.limit",
  );
  const sinceResult: ParseResult<Date | undefined> = parseOptionalIsoDate(
    input.since,
    "config.since",
  );

  const issues: ParseIssue[] = combineIssues(
    runIdResult,
    correlationIdResult,
    timeoutResult,
    pollResult,
    limitResult,
    sinceResult,
  );
  if (issues.length > 0) {
    return failure(issues);
  }

  const config: RunnerConfig = {
    timeoutMs: timeoutResult.value,
    pollMs: pollResult.value,
    ...(runIdResult.value !== undefined
      ? { runId: toBrand<"RunId">(runIdResult.value) }
      : {}),
    ...(correlationIdResult.value !== undefined
      ? { correlationId: toBrand<"CorrelationId">(correlationIdResult.value) }
      : {}),
    ...(limitResult.value !== undefined ? { limit: limitResult.value } : {}),
    ...(sinceResult.value !== undefined ? { since: sinceResult.value } : {}),
  };

  if (config.pollMs > config.timeoutMs) {
    return failure([
      {
        code: "out_of_range",
        path: "config.pollMs",
        message: "pollMs must be less than or equal to timeoutMs.",
        input: config.pollMs,
      },
    ]);
  }

  return success(config);
};

export const parseRunnerConfig = (raw: RawRunnerConfig): ParseResult<RunnerConfig> =>
  parseRunnerConfigShape({
    runId: raw.runId,
    correlationId: raw.correlationId,
    timeoutMs: raw.timeoutMs,
    pollMs: raw.pollMs,
    limit: raw.limit,
    since: raw.since,
  });

export const parseRunnerConfigInput = (input: unknown): ParseResult<RunnerConfig> => {
  const recordResult: ParseResult<Record<string, unknown>> = asRecord(input, "config");
  if (!recordResult.ok) {
    return recordResult;
  }

  const record: Record<string, unknown> = recordResult.value;
  if (record.timeoutMs === undefined) {
    return fail("missing_field", "config.timeoutMs", "Missing required field: timeoutMs.");
  }

  if (record.pollMs === undefined) {
    return fail("missing_field", "config.pollMs", "Missing required field: pollMs.");
  }

  return parseRunnerConfigShape({
    runId: record.runId,
    correlationId: record.correlationId,
    timeoutMs: record.timeoutMs,
    pollMs: record.pollMs,
    limit: record.limit,
    since: record.since,
  });
};
