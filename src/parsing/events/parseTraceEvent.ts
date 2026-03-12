import type { RawTraceEvent } from "../../contracts/raw/event";
import type { ParseIssue } from "../../core/errors/parseIssue";
import type { TraceEvent } from "../../core/models/event";
import { failure, success } from "../../core/types/result";
import {
  asRecord,
  combineIssues,
  parseIsoDate,
  mustGet,
  parseNonEmptyString,
  parseOptionalNonEmptyString,
  toBrand,
  fail,
  type ParseResult,
} from "../common/parsers";

const parseRawTraceEvent = (input: unknown): ParseResult<RawTraceEvent> => {
  const recordResult: ParseResult<Record<string, unknown>> = asRecord(input, "event");
  if (!recordResult.ok) {
    return recordResult;
  }

  const eventRecord: Record<string, unknown> = recordResult.value;
  const idResult: ParseResult<string> = parseNonEmptyString(eventRecord.id, "event.id");
  const eventTypeResult: ParseResult<string> = parseNonEmptyString(
    eventRecord.eventType,
    "event.eventType",
  );
  const timestampResult: ParseResult<string> = parseNonEmptyString(
    eventRecord.timestamp,
    "event.timestamp",
  );
  const sourceResult: ParseResult<string> = parseNonEmptyString(eventRecord.source, "event.source");
  const runIdResult: ParseResult<string | undefined> = parseOptionalNonEmptyString(
    eventRecord.runId,
    "event.runId",
  );
  const correlationIdResult: ParseResult<string | undefined> = parseOptionalNonEmptyString(
    eventRecord.correlationId,
    "event.correlationId",
  );

  const payload: unknown = eventRecord.payload;
  if (payload === undefined) {
    return fail("missing_field", "event.payload", "Missing required field: payload.");
  }

  const issues: ParseIssue[] = combineIssues(
    idResult,
    eventTypeResult,
    timestampResult,
    sourceResult,
    runIdResult,
    correlationIdResult,
  );
  if (issues.length > 0) {
    return failure(issues);
  }

  const id: string = mustGet(idResult);
  const eventType: string = mustGet(eventTypeResult);
  const timestamp: string = mustGet(timestampResult);
  const source: string = mustGet(sourceResult);
  const runId: string | undefined = mustGet(runIdResult);
  const correlationId: string | undefined = mustGet(correlationIdResult);

  const rawEvent: RawTraceEvent = {
    id,
    eventType,
    timestamp,
    source,
    payload,
    ...(runId !== undefined ? { runId } : {}),
    ...(correlationId !== undefined ? { correlationId } : {}),
  };

  return success(rawEvent);
};

export const convertRawTraceEventToTraceEvent = (
  raw: RawTraceEvent,
): ParseResult<TraceEvent> => {
  const idResult: ParseResult<string> = parseNonEmptyString(raw.id, "event.id");
  const eventTypeResult: ParseResult<string> = parseNonEmptyString(
    raw.eventType,
    "event.eventType",
  );
  const timestampResult: ParseResult<Date> = parseIsoDate(raw.timestamp, "event.timestamp");
  const sourceResult: ParseResult<string> = parseNonEmptyString(raw.source, "event.source");
  const runIdResult: ParseResult<string | undefined> = parseOptionalNonEmptyString(
    raw.runId,
    "event.runId",
  );
  const correlationIdResult: ParseResult<string | undefined> = parseOptionalNonEmptyString(
    raw.correlationId,
    "event.correlationId",
  );

  const issues: ParseIssue[] = combineIssues(
    idResult,
    eventTypeResult,
    timestampResult,
    sourceResult,
    runIdResult,
    correlationIdResult,
  );
  if (issues.length > 0) {
    return failure(issues);
  }

  const id: string = mustGet(idResult);
  const eventType: string = mustGet(eventTypeResult);
  const timestamp: Date = mustGet(timestampResult);
  const source: string = mustGet(sourceResult);
  const rawRunId: string | undefined = mustGet(runIdResult);
  const rawCorrelationId: string | undefined = mustGet(correlationIdResult);

  const runId = rawRunId === undefined ? undefined : toBrand<"RunId">(rawRunId);
  const correlationId =
    rawCorrelationId === undefined
      ? undefined
      : toBrand<"CorrelationId">(rawCorrelationId);

  const normalized: TraceEvent = {
    id: toBrand<"EventId">(id),
    eventType: toBrand<"EventType">(eventType),
    timestamp,
    source: toBrand<"SourceName">(source),
    payload: raw.payload,
    ...(runId !== undefined ? { runId } : {}),
    ...(correlationId !== undefined ? { correlationId } : {}),
  };

  return success(normalized);
};

export const parseTraceEvent = (input: unknown): ParseResult<TraceEvent> => {
  const rawResult: ParseResult<RawTraceEvent> = parseRawTraceEvent(input);
  if (!rawResult.ok) {
    return rawResult;
  }

  return convertRawTraceEventToTraceEvent(rawResult.value);
};
